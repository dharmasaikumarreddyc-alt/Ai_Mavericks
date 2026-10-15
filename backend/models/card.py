from pydantic import BaseModel
from typing import Optional, List
from enum import Enum
from datetime import datetime

class CardType(str, Enum):
    SINGLE_USE = "single-use"
    MERCHANT_LOCKED = "merchant-locked"
    RECURRING = "recurring"

class CardStatus(str, Enum):
    ACTIVE = "active"
    DESTROYED = "destroyed"
    PAUSED = "paused"

class CardBase(BaseModel):
    label: str
    type: CardType
    limit: float
    merchant: Optional[str] = None

class CardCreate(CardBase):
    pass

class VirtualCard(CardBase):
    id: str
    last4: str
    spent: float = 0.0
    status: CardStatus = CardStatus.ACTIVE
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class CardResponse(BaseModel):
    id: str
    label: str
    last4: str
    type: str
    limit: float
    spent: float
    status: str
    merchant: Optional[str] = None

class Transaction(BaseModel):
    id: str
    card_id: str
    merchant: str
    amount: float
    date: str
    status: str  # "completed", "pending", "failed"
    description: Optional[str] = None

class TransactionResponse(BaseModel):
    id: str
    merchant: str
    amount: float
    date: str
    status: str
    card_last4: str
