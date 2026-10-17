"""Public transparency manifest for judges, users and operational reviews."""

from fastapi import APIRouter

router = APIRouter(prefix="/governance", tags=["AI Governance"])


@router.get("")
async def governance_manifest():
    return {
        "product": "Aisle AI",
        "modelPurpose": "Shopping assistance and merchant decision support",
        "controls": {
            "pii": "Email, phone and payment-like values are redacted before model calls and from outputs.",
            "grounding": "Prompts are grounded in catalog or aggregate merchant data with deterministic fallbacks.",
            "humanOversight": "Customers confirm orders and payment mode; merchants confirm every fulfillment transition.",
            "authorization": "Customer and merchant data are separated by JWT role and record ownership.",
            "audit": "AI telemetry records feature, provider, outcome and sizes—not prompt contents.",
        },
        "limitations": [
            "Recommendations can be wrong and should be reviewed.",
            "Default payment is a clearly labelled token simulation; no money moves. COD remains not collected.",
            "The optional Razorpay adapter requires separate credentials, provider operations and compliance review.",
            "Catalogs, availability, ratings, offers, orders and analytics may contain explicitly marked synthetic demo data.",
            "Demo forecasts are decision support, not guaranteed demand.",
        ],
    }
