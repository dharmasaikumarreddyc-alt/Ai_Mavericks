"""Provider-agnostic payment integrity helpers."""

import hashlib
import hmac
from decimal import Decimal, ROUND_HALF_UP


def amount_to_subunits(amount: float) -> int:
    """Convert a two-decimal currency amount to provider subunits without float drift."""
    normalized = Decimal(str(amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return int(normalized * 100)


def verify_razorpay_signature(
    provider_order_id: str,
    provider_payment_id: str,
    signature: str,
    key_secret: str,
) -> bool:
    payload = f"{provider_order_id}|{provider_payment_id}".encode("utf-8")
    expected = hmac.new(key_secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)
