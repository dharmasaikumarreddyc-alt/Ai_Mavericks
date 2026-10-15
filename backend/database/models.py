from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import uuid
import enum

Base = declarative_base()

def generate_id(prefix: str = "") -> str:
    short_id = str(uuid.uuid4())[:8].upper()
    return f"{prefix}{short_id}" if prefix else short_id

class UserDB(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: generate_id("USR-"))
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    agent_paused = Column(Boolean, default=False)
    notification_email = Column(Boolean, default=True)
    notification_push = Column(Boolean, default=True)
    notification_sms = Column(Boolean, default=False)

    # Relationships
    orders = relationship("OrderDB", back_populates="user")
    approvals = relationship("ApprovalDB", back_populates="user")
    cards = relationship("VirtualCardDB", back_populates="user")
    agent_runs = relationship("AgentRunDB", back_populates="user")
    spending_rules = relationship("SpendingRulesDB", back_populates="user", uselist=False)


class OrderDB(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=lambda: generate_id("ORD-"))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    merchant = Column(String, nullable=False)
    items = Column(JSON, nullable=False)  # List of {name, qty, price}
    total = Column(Float, nullable=False)
    savings = Column(Float, default=0.0)
    date = Column(String, nullable=False)
    status = Column(String, default="processing")  # delivered, in-transit, processing, awaiting-approval
    agent_task = Column(Text, nullable=False)
    card = Column(String, nullable=False)
    address = Column(Text, nullable=False)
    steps = Column(JSON, default=list)  # List of {time, label, detail}
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserDB", back_populates="orders")


class ApprovalDB(Base):
    __tablename__ = "approvals"

    id = Column(String, primary_key=True, default=lambda: generate_id("APR-"))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    merchant = Column(String, nullable=False)
    item = Column(String, nullable=False)
    qty = Column(Float, default=1)
    amount = Column(Float, nullable=False)
    reason = Column(String, nullable=False)
    comparison = Column(JSON, default=list)  # List of {store, price}
    status = Column(String, default="pending")  # pending, approved, declined, expired
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    agent_task_id = Column(String, ForeignKey("agent_runs.id"), nullable=True)

    user = relationship("UserDB", back_populates="approvals")
    agent_run = relationship("AgentRunDB", back_populates="approvals")


class VirtualCardDB(Base):
    __tablename__ = "virtual_cards"

    id = Column(String, primary_key=True, default=lambda: generate_id("CRD-"))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    label = Column(String, nullable=False)
    last4 = Column(String(4), nullable=False)
    type = Column(String, nullable=False)  # single-use, merchant-locked, recurring
    limit = Column(Float, nullable=False)
    spent = Column(Float, default=0.0)
    status = Column(String, default="active")  # active, destroyed, paused
    merchant = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserDB", back_populates="cards")
    transactions = relationship("TransactionDB", back_populates="card")


class TransactionDB(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=lambda: generate_id("TXN-"))
    card_id = Column(String, ForeignKey("virtual_cards.id"), nullable=False)
    merchant = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(String, nullable=False)
    status = Column(String, default="completed")  # completed, pending, failed
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    card = relationship("VirtualCardDB", back_populates="transactions")


class AgentRunDB(Base):
    __tablename__ = "agent_runs"

    id = Column(String, primary_key=True, default=lambda: generate_id("RUN-"))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    task = Column(Text, nullable=False)
    status = Column(String, default="running")  # running, completed, waiting, watching, failed, paused
    detail = Column(Text, nullable=True)
    time = Column(String, nullable=False)
    steps = Column(JSON, default=list)  # Agent execution log
    result = Column(JSON, nullable=True)  # Final result data
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("UserDB", back_populates="agent_runs")
    approvals = relationship("ApprovalDB", back_populates="agent_run")


class SpendingRulesDB(Base):
    __tablename__ = "spending_rules"

    id = Column(String, primary_key=True, default=lambda: generate_id("RUL-"))
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    monthly_budget = Column(Float, default=25000.0)
    categories = Column(JSON, default=list)  # List of {category, enabled, limit}
    guardrails = Column(JSON, default=dict)  # {require_approval_above, block_international, ...}
    merchant_whitelist = Column(JSON, default=list)
    merchant_blacklist = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("UserDB", back_populates="spending_rules")


class FeedEventDB(Base):
    __tablename__ = "feed_events"

    id = Column(String, primary_key=True, default=lambda: generate_id("EVT-"))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)  # search, compare, checkout, approval, delivery
    title = Column(String, nullable=False)
    detail = Column(Text, nullable=True)
    time = Column(String, nullable=False)
    status = Column(String, default="info")  # success, pending, info
    agent_run_id = Column(String, ForeignKey("agent_runs.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
