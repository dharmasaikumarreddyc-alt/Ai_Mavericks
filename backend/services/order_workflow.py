"""Deterministic order-state rules; the model cannot bypass this workflow."""

ALLOWED_TRANSITIONS: dict[str, frozenset[str]] = {
    "pending": frozenset({"confirmed", "cancelled"}),
    "confirmed": frozenset({"preparing", "cancelled"}),
    "preparing": frozenset({"ready", "cancelled"}),
    "ready": frozenset({"dispatched", "cancelled"}),
    "dispatched": frozenset({"delivered"}),
    "delivered": frozenset(),
    "cancelled": frozenset(),
}


def can_transition(current: str, target: str) -> bool:
    return target in ALLOWED_TRANSITIONS.get(current, frozenset())


def next_primary_status(current: str) -> str | None:
    return {
        "pending": "confirmed",
        "confirmed": "preparing",
        "preparing": "ready",
        "ready": "dispatched",
        "dispatched": "delivered",
    }.get(current)
