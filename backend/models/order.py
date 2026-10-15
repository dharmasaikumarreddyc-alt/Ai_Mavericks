from pydantic import BaseModel
from typing import List, Optional
from enum import Enum
from datetime import datetime

class OrderStatus(str, Enum):
    DELIVERED = "delivered"
    IN_TRANSIT = "in-transit"
    PROCESSING = "processing"
    AWAITING_APPROVAL = "awaiting-approval"

class OrderItem(BaseModel):
    name: str
    qty: int
    price: float

class OrderStep(BaseModel):
    time: str
    label: str
    detail: str

class OrderBase(BaseModel):
    merchant: str
    items: List[OrderItem]
    total: float
    savings: float = 0.0
    agent_task: str
    card: str
    address: str

class OrderCreate(OrderBase):
    pass

class Order(OrderBase):
    id: str
    date: str
    status: OrderStatus
    steps: List[OrderStep] = []
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: str
    merchant: str
    items: List[OrderItem]
    total: float
    savings: float
    date: str
    status: str
    agentTask: str
    card: str
    address: str
    steps: List[OrderStep]
