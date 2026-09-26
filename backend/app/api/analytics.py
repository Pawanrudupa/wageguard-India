"""Anonymous, aggregate-only analytics counters for state and sector request volumes."""

import json
import logging
from pathlib import Path
from threading import Lock
from typing import Any

logger = logging.getLogger("wageguard.analytics")

ANALYTICS_FILE = (
    Path(__file__).resolve().parents[3] / "data" / "processed" / "analytics_counters.json"
)

_lock = Lock()
_counters: dict[str, int] = {}


def _load_counters() -> None:
    """Load existing aggregate counters from disk if available."""
    global _counters
    if ANALYTICS_FILE.exists():
        try:
            with open(ANALYTICS_FILE, "r", encoding="utf-8") as f:
                _counters = json.load(f)
        except (OSError, json.JSONDecodeError) as exc:
            logger.warning("Failed to load analytics counters (%s): %s", type(exc).__name__, exc)
            _counters = {}


def _save_counters() -> None:
    """Persist aggregate counters to disk (counts only, no user data)."""
    try:
        ANALYTICS_FILE.parent.mkdir(parents=True, exist_ok=True)
        temp_file = ANALYTICS_FILE.with_suffix(".tmp")
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(_counters, f, indent=2)
        temp_file.replace(ANALYTICS_FILE)
    except OSError as exc:
        logger.warning("Failed to save analytics counters (%s): %s", type(exc).__name__, exc)


# Initialize counters on module load
_load_counters()


def record_risk_call(state: str, sector: str) -> None:
    """Record an anonymous tally for a state+sector risk lookup.

    Privacy Compliance (AGENTS.md):
    - Strictly records combination tally.
    - NEVER records user IP, timestamp per user, or device identity.
    """
    key = f"risk:{state.strip()}:{sector.strip()}"
    with _lock:
        _counters[key] = _counters.get(key, 0) + 1
        _save_counters()


def record_rights_call(state: str | None = None, sector: str | None = None) -> None:
    """Record an anonymous tally for a legal rights query.

    Privacy Compliance (AGENTS.md):
    - Strictly records state/sector context tally.
    - NEVER records query text, user IP, or timestamp per user.
    """
    clean_state = (state or "All-India").strip()
    clean_sector = (sector or "General").strip()
    key = f"rights:{clean_state}:{clean_sector}"
    with _lock:
        _counters[key] = _counters.get(key, 0) + 1
        _save_counters()


def get_analytics_summary() -> dict[str, Any]:
    """Return an aggregated overview of total risk and rights requests."""
    with _lock:
        risk_total = sum(v for k, v in _counters.items() if k.startswith("risk:"))
        rights_total = sum(v for k, v in _counters.items() if k.startswith("rights:"))
        return {
            "total_risk_inquiries": risk_total,
            "total_rights_inquiries": rights_total,
            "aggregate_counters": dict(_counters),
        }


def reset_analytics_for_testing() -> None:
    """Reset counters strictly for test isolation."""
    global _counters
    with _lock:
        _counters = {}
        if ANALYTICS_FILE.exists():
            try:
                ANALYTICS_FILE.unlink()
            except OSError as exc:
                logger.warning("Failed to unlink test analytics file (%s): %s", type(exc).__name__, exc)

