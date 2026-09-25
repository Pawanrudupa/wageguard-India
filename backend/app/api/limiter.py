"""In-memory sliding-window rate limiting for FastAPI endpoints."""

import time
from collections import defaultdict
from threading import Lock

from fastapi import HTTPException, Request, status


class RateLimiter:
    """Sliding-window in-memory rate limiter applied as a FastAPI dependency.

    Provides basic denial-of-service and cost-control protection on LLM/inference endpoints
    without requiring external infrastructure (Redis/Memcached).
    """

    def __init__(self, times: int = 30, seconds: int = 60) -> None:
        self.times = times
        self.seconds = seconds
        self._history: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def _get_client_identifier(self, request: Request) -> str:
        """Extract client IP address, handling proxies and local addresses."""
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        if request.client and request.client.host:
            return request.client.host
        return "unknown_client"

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
