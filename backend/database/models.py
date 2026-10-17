from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum, UniqueConstraint
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import uuid

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

    orders = relationship("OrderDB", back_populates="user")


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


class CartItemDB(Base):
    __tablename__ = "cart_items"
    __table_args__ = (
        UniqueConstraint("user_id", "merchant_id", "product_id", name="uq_cart_user_merchant_product"),
    )

    id = Column(String, primary_key=True, default=lambda: generate_id("CIT-"))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    merchant_id = Column(String, nullable=False)
    merchant_name = Column(String, nullable=False)
    product_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    image = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class MerchantDB(Base):
    __tablename__ = "merchant_profiles"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    category = Column(String, nullable=False, default="Food & Beverage")
    is_demo = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class MerchantAccountDB(Base):
    __tablename__ = "merchant_accounts"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_merchant_accounts_user_id"),
        UniqueConstraint("merchant_id", name="uq_merchant_accounts_merchant_id"),
    )

    id = Column(String, primary_key=True, default=lambda: generate_id("MAC-"))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    merchant_id = Column(String, ForeignKey("merchant_profiles.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class MerchantOrderDB(Base):
    __tablename__ = "merchant_orders"

    id = Column(String, primary_key=True)
    merchant_id = Column(String, ForeignKey("merchant_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    items = Column(JSON, nullable=False)
    total = Column(Float, nullable=False)
    status = Column(String, nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, index=True)
    dispatched_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    is_demo = Column(Boolean, nullable=False, default=False, index=True)


class PaymentIntentDB(Base):
    __tablename__ = "payment_intents"

    id = Column(String, primary_key=True, default=lambda: generate_id("ORD-"))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    merchant_id = Column(String, ForeignKey("merchant_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    provider_order_id = Column(String, nullable=False, unique=True, index=True)
    provider_payment_id = Column(String, nullable=True, unique=True)
    items = Column(JSON, nullable=False)
    pricing = Column(JSON, nullable=False)
    delivery_address = Column(Text, nullable=False)
    requested_method = Column(String, nullable=False)
    status = Column(String, nullable=False, default="created", index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class MerchantReviewDB(Base):
    __tablename__ = "merchant_reviews"

    id = Column(String, primary_key=True)
    merchant_id = Column(String, ForeignKey("merchant_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = Column(String, ForeignKey("merchant_orders.id", ondelete="SET NULL"), nullable=True)
    rating = Column(Integer, nullable=False)
    review = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, index=True)
    is_demo = Column(Boolean, nullable=False, default=False, index=True)


class MerchantActionDB(Base):
    """Auditable merchant acceptance of an advisory recommendation.

    Acceptance does not claim that inventory or a physical preparation task was
    executed; downstream operational integration is intentionally out of scope
    for this prototype.
    """

    __tablename__ = "merchant_actions"

    id = Column(String, primary_key=True, default=lambda: generate_id("ACT-"))
    merchant_id = Column(String, ForeignKey("merchant_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    recommendation_id = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False)
    title = Column(String, nullable=False)
    instruction = Column(Text, nullable=False)
    evidence = Column(JSON, nullable=False, default=dict)
    status = Column(String, nullable=False, default="accepted_for_review", index=True)
    accepted_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
