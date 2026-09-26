"""In-memory sliding-window rate limiting for FastAPI endpoints."""

import ipaddress
import os
import time
from collections import defaultdict
from threading import Lock

from fastapi import HTTPException, Request, status


def _is_ip_trusted(raw_ip: str, trusted_proxies_cfg: str) -> bool:
    """Check if raw_ip matches any trusted proxy IP or CIDR network in trusted_proxies_cfg."""
    if not trusted_proxies_cfg or not raw_ip:
        return False

    entries = [p.strip() for p in trusted_proxies_cfg.split(",") if p.strip()]
    if not entries:
        return False

    # Universal wildcard trust (e.g. platform containers strictly behind a managed edge gateway)
    if "*" in entries:
        return True

    # Exact string match (e.g. 'localhost', 'testclient', hostnames)
    if raw_ip in entries:
        return True

    try:
        client_addr = ipaddress.ip_address(raw_ip)
    except ValueError:
        return False

    for entry in entries:
        try:
            net = ipaddress.ip_network(entry, strict=False)
            if client_addr in net:
                return True
        except ValueError:
            continue

    return False


class RateLimiter:
    """Sliding-window in-memory rate limiter applied as a FastAPI dependency.

    Provides basic denial-of-service and cost-control protection on LLM/inference endpoints
    without requiring external infrastructure (Redis/Memcached).
    """

    def __init__(
        self,
        times: int = 30,
        seconds: int = 60,
        trusted_proxies: str | None = None,
    ) -> None:
        self.times = times
        self.seconds = seconds
        self._trusted_proxies = trusted_proxies
        self._history: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def _get_client_identifier(self, request: Request) -> str:
        """Extract client IP address safely, trusting X-Forwarded-For only from trusted proxies."""
        raw_ip = request.client.host if request.client and request.client.host else "unknown_client"

        trusted_cfg = (
            self._trusted_proxies
            if self._trusted_proxies is not None
            else os.getenv("TRUSTED_PROXIES", "").strip()
        )

        if _is_ip_trusted(raw_ip, trusted_cfg):
            forwarded = request.headers.get("x-forwarded-for")
            if forwarded:
                client_ip = forwarded.split(",")[0].strip()
                if client_ip:
                    return client_ip

        return raw_ip

    def __call__(self, request: Request) -> None:
        """Enforce rate limit check against the client's request timestamp history."""
        # Check if rate limiting is globally disabled for testing
        if "app" in request.scope and getattr(request.app.state, "disable_rate_limits", False):
            return

        client_id = self._get_client_identifier(request)
        now = time.time()
        window_start = now - self.seconds

        with self._lock:
            timestamps = self._history[client_id]
            # Prune timestamps outside current sliding window
            valid_timestamps = [ts for ts in timestamps if ts > window_start]

            if len(valid_timestamps) >= self.times:
                oldest_in_window = valid_timestamps[0]
                retry_after = max(1, int(self.seconds - (now - oldest_in_window)))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Maximum {self.times} requests per {self.seconds} seconds.",
                    headers={"Retry-After": str(retry_after)},
                )

            valid_timestamps.append(now)
            self._history[client_id] = valid_timestamps

    def reset(self) -> None:
        """Reset rate limit history for testing."""
        with self._lock:
            self._history.clear()

