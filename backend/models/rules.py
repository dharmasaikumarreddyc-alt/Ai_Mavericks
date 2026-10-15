from pydantic import BaseModel
from typing import List, Optional, Dict

class CategoryLimit(BaseModel):
    category: str
    enabled: bool = True
    limit: float

class Guardrails(BaseModel):
    require_approval_above: float = 50.0
    block_international: bool = False
    require_2fa_above: float = 100.0
    auto_pause_on_suspicious: bool = True

class SpendingRules(BaseModel):
    monthly_budget: float = 500.0
    categories: List[CategoryLimit] = [
        CategoryLimit(category="Groceries", enabled=True, limit=150.0),
        CategoryLimit(category="Health & Supplements", enabled=True, limit=100.0),
        CategoryLimit(category="Electronics", enabled=True, limit=200.0),
        CategoryLimit(category="Fashion", enabled=False, limit=75.0),
    ]
    guardrails: Guardrails = Guardrails()
    merchant_whitelist: List[str] = []
    merchant_blacklist: List[str] = []

class RulesUpdate(BaseModel):
    monthly_budget: Optional[float] = None
    categories: Optional[List[CategoryLimit]] = None
    guardrails: Optional[Guardrails] = None
    merchant_whitelist: Optional[List[str]] = None
    merchant_blacklist: Optional[List[str]] = None
