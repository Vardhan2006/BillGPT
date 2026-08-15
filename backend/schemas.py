from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---------------------------------------------------------------------------
# Auth Schemas
# ---------------------------------------------------------------------------

class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")


class UserLogin(UserBase):
    password: str


class UserOut(UserBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    email: Optional[str] = None
    exp: Optional[int] = None


# ---------------------------------------------------------------------------
# Domain Model Schemas
# ---------------------------------------------------------------------------

class ProductOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    base_price: float
    image_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DealOut(BaseModel):
    id: int
    product_id: int
    source: str
    source_type: str
    price: float
    discount_details: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CardOut(BaseModel):
    id: int
    name: str
    reward_rate: float  # e.g., 0.03 = 3%
    reward_type: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Calculation & Search Schemas
# ---------------------------------------------------------------------------

class DealComparisonItem(BaseModel):
    id: int
    source: str
    source_type: str
    price: float
    discount_details: Optional[str] = None
    savings_vs_base: float


class CardPaymentOption(BaseModel):
    id: int
    name: str
    reward_rate: float  # Decimal representation: 0.04 = 4%
    reward_type: Optional[str] = None
    description: Optional[str] = None
    reward_earned_on_best_deal: float
    effective_price_on_best_deal: float


class BestWayToPay(BaseModel):
    product_name: str
    base_price: float
    cheapest_deal: DealComparisonItem
    best_card: Optional[CardPaymentOption] = None
    cheapest_source_price: float
    card_reward_rate: float
    card_reward_earned: float
    effective_price: float
    total_savings: float
    savings_percentage: float
    payment_recommendation: str


class SearchComparisonResult(BaseModel):
    product: ProductOut
    deals: List[DealComparisonItem]
    cards: List[CardPaymentOption]
    best_way_to_pay: BestWayToPay


# ---------------------------------------------------------------------------
# Saved Comparison Schemas (Strictly User Owned)
# ---------------------------------------------------------------------------

class SavedComparisonCreate(BaseModel):
    product_id: Optional[int] = None
    title: str = Field(..., min_length=1, max_length=255)
    notes: Optional[str] = None
    comparison_data: Any
    best_deal_price: float
    total_savings: float


class SavedComparisonOut(BaseModel):
    id: int
    user_id: int
    product_id: Optional[int] = None
    title: str
    notes: Optional[str] = None
    comparison_data: Any
    best_deal_price: float
    total_savings: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

