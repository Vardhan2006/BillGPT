import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, List, Optional
from sqlalchemy import DateTime, Float, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    saved_comparisons: Mapped[List["SavedComparison"]] = relationship(
        "SavedComparison",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    base_price: Mapped[float] = mapped_column(Float, nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    deals: Mapped[List["Deal"]] = relationship(
        "Deal",
        back_populates="product",
        cascade="all, delete-orphan",
    )
    saved_comparisons: Mapped[List["SavedComparison"]] = relationship(
        "SavedComparison",
        back_populates="product",
    )


class Deal(Base):
    __tablename__ = "deals"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., "Amazon", "Best Buy"
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "offer", "coupon", "cashback"
    price: Mapped[float] = mapped_column(Float, nullable=False)
    discount_details: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    product: Mapped["Product"] = relationship("Product", back_populates="deals")


class Card(Base):
    __tablename__ = "cards"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    reward_rate: Mapped[float] = mapped_column(Float, nullable=False)  # Decimal: 0.03 for 3%
    reward_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class SavedComparison(Base):
    __tablename__ = "saved_comparisons"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[Optional[int]] = mapped_column(ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Store complete calculation snapshot (evaluated deals, chosen card, best price, savings)
    comparison_data: Mapped[Any] = mapped_column(JSON, nullable=False)
    
    best_deal_price: Mapped[float] = mapped_column(Float, nullable=False)
    total_savings: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="saved_comparisons")
    product: Mapped[Optional["Product"]] = relationship("Product", back_populates="saved_comparisons")
