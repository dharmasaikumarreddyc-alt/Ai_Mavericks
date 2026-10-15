from pydantic import BaseModel
from typing import List, Optional
from enum import Enum
from datetime import datetime

class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DECLINED = "declined"
    EXPIRED = "expired"

class PriceComparison(BaseModel):
    store: str
    price: float

class ApprovalBase(BaseModel):
    merchant: str
    item: str
    qty: int
    amount: float
    reason: str
    comparison: List[PriceComparison] = []

class ApprovalCreate(ApprovalBase):
    expires_in_minutes: int = 360  # 6 hours default

class Approval(ApprovalBase):
    id: str
    status: ApprovalStatus = ApprovalStatus.PENDING
    expires_at: datetime
    created_at: datetime
    user_id: str
    agent_task_id: Optional[str] = None

    class Config:
        from_attributes = True

class ApprovalResponse(BaseModel):
    id: str
    merchant: str
    item: str
    qty: int
    amount: float
    reason: str
    expires: str  # Human readable like "Expires in 5h 12m"
    comparison: List[PriceComparison]
    status: str

class ApprovalAction(BaseModel):
    action: str  # "approve" or "decline"
