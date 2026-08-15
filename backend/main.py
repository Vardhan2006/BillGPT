import sys
from pathlib import Path
from typing import List, Optional

# Ensure project root is in sys.path for direct module execution
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import or_
from sqlalchemy.orm import Session

from backend import models, schemas
from backend.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from backend.database import Base, engine, get_db

# Create database tables automatically on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BillGPT API",
    description="Smart Deal Comparison & Payment Optimization Backend",
    version="1.0.0",
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Root & Health Check Endpoints
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"])
def root():
    """Root endpoint providing quick navigation links."""
    return {
        "service": "BillGPT API",
        "status": "online",
        "documentation": "/docs",
        "health": "/api/health",
        "deals_search": "/api/deals/search?q=",
    }


@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint to verify backend service status."""
    return {"status": "ok", "service": "BillGPT API"}


# ---------------------------------------------------------------------------
# Authentication Endpoints
# ---------------------------------------------------------------------------

@app.post(
    "/api/auth/register",
    response_model=schemas.Token,
    status_code=status.HTTP_201_CREATED,
    tags=["Authentication"],
)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user with email and password, returning a Bearer JWT token.
    Validates email format and minimum password length.
    """
    existing_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )

    hashed_pwd = hash_password(user_in.password)
    new_user = models.User(email=user_in.email, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(data={"sub": str(new_user.id), "email": new_user.email})
    return schemas.Token(
        access_token=access_token,
        token_type="bearer",
        user=schemas.UserOut.model_validate(new_user),
    )


@app.post("/api/auth/login", response_model=schemas.Token, tags=["Authentication"])
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate a user with email and password, returning a Bearer JWT token.
    """
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, str(user.hashed_password)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user.id), "email": str(user.email)})
    return schemas.Token(
        access_token=access_token,
        token_type="bearer",
        user=schemas.UserOut.model_validate(user),
    )


@app.get("/api/auth/me", response_model=schemas.UserOut, tags=["Authentication"])
def get_me(current_user: models.User = Depends(get_current_user)):
    """
    Retrieve the currently authenticated user profile from the validated Bearer token.
    """
    return current_user


# ---------------------------------------------------------------------------
# Deal & Best-Way-to-Pay Calculation Engine
# ---------------------------------------------------------------------------

def calculate_comparison_for_product(
    product: models.Product, cards: List[models.Card]
) -> schemas.SearchComparisonResult:
    """
    Core calculation engine:
    1. Finds the cheapest merchant deal among all available sources.
    2. Applies each card's reward rate separately to the cheapest deal price.
    3. Compares the resulting effective prices with the original cheapest price.
    4. Selects the card offering the lowest effective price (or cheapest deal if no card reward).
    5. Calculates net total savings and percentage savings relative to the product base price MSRP.
    """
    deals_list: List[models.Deal] = list(product.deals)
    deals = sorted(deals_list, key=lambda d: float(d.price))
    base_price = float(product.base_price)

    # 1. Normalize merchant deal items with baseline discount vs MSRP
    deal_items: List[schemas.DealComparisonItem] = []
    for d in deals:
        d_price = float(d.price)
        savings = round(max(0.0, base_price - d_price), 2)
        deal_items.append(
            schemas.DealComparisonItem(
                id=int(d.id),
                source=str(d.source),
                source_type=str(d.source_type),
                price=round(d_price, 2),
                discount_details=str(d.discount_details) if d.discount_details else None,
                savings_vs_base=savings,
            )
        )

    # Lowest merchant deal is the pricing baseline (or product base_price if no deals exist)
    cheapest_deal = deal_items[0] if deal_items else schemas.DealComparisonItem(
        id=0,
        source="Retail Base Price",
        source_type="retail",
        price=round(base_price, 2),
        discount_details="Standard MSRP",
        savings_vs_base=0.0,
    )

    # 2. Evaluate all available credit cards against the cheapest deal
    card_options: List[schemas.CardPaymentOption] = []
    for card in cards:
        c_rate = float(card.reward_rate)
        reward_earned = round(cheapest_deal.price * c_rate, 2)
        effective_price = round(cheapest_deal.price * (1.0 - c_rate), 2)
        card_options.append(
            schemas.CardPaymentOption(
                id=int(card.id),
                name=str(card.name),
                reward_rate=c_rate,
                reward_type=str(card.reward_type) if card.reward_type else None,
                description=str(card.description) if card.description else None,
                reward_earned_on_best_deal=reward_earned,
                effective_price_on_best_deal=effective_price,
            )
        )

    # Sort cards by lowest effective price / highest reward rate
    card_options.sort(key=lambda c: (c.effective_price_on_best_deal, -c.reward_rate))

    # 3. Determine if any card provides a lower effective price than the cheapest deal
    best_card_candidate = card_options[0] if card_options else None
    
    if best_card_candidate and best_card_candidate.reward_rate > 0:
        best_card = best_card_candidate
        effective_price = best_card.effective_price_on_best_deal
        card_rate = best_card.reward_rate
        card_reward_earned = best_card.reward_earned_on_best_deal
        payment_recommendation = (
            f"Buy from {cheapest_deal.source} for ${cheapest_deal.price:.2f} using "
            f"{best_card.name} ({best_card.reward_rate * 100:.1f}% reward) for an "
            f"effective price of ${effective_price:.2f}."
        )
    else:
        best_card = None
        effective_price = cheapest_deal.price
        card_rate = 0.0
        card_reward_earned = 0.0
        payment_recommendation = (
            f"Buy directly from {cheapest_deal.source} at the lowest price of ${cheapest_deal.price:.2f}."
        )

    total_savings = round(max(0.0, base_price - effective_price), 2)
    savings_pct = (
        round((total_savings / base_price) * 100.0, 1)
        if base_price > 0
        else 0.0
    )

    best_way = schemas.BestWayToPay(
        product_name=str(product.name),
        base_price=round(base_price, 2),
        cheapest_deal=cheapest_deal,
        best_card=best_card,
        cheapest_source_price=round(cheapest_deal.price, 2),
        card_reward_rate=card_rate,
        card_reward_earned=card_reward_earned,
        effective_price=effective_price,
        total_savings=total_savings,
        savings_percentage=savings_pct,
        payment_recommendation=payment_recommendation,
    )

    return schemas.SearchComparisonResult(
        product=schemas.ProductOut.model_validate(product),
        deals=deal_items,
        cards=card_options,
        best_way_to_pay=best_way,
    )


# ---------------------------------------------------------------------------
# Search & Deals Endpoint
# ---------------------------------------------------------------------------

@app.get(
    "/api/deals/search",
    response_model=List[schemas.SearchComparisonResult],
    tags=["Deals & Comparison"],
)
def search_deals(
    q: Optional[str] = Query(None, description="Search query for product name, category, or description"),
    db: Session = Depends(get_db),
):
    """
    Search products by keyword and return normalized deal results, all available card reward
    evaluations, and the computed Best-Way-to-Pay payment recommendation.
    """
    cards = db.query(models.Card).all()

    query = db.query(models.Product)
    if q and q.strip():
        search_pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                models.Product.name.ilike(search_pattern),
                models.Product.description.ilike(search_pattern),
                models.Product.category.ilike(search_pattern),
            )
        )

    products = query.limit(20).all()
    results = [calculate_comparison_for_product(product, cards) for product in products]
    return results


# ---------------------------------------------------------------------------
# Saved Comparisons Endpoints (Strict User Ownership)
# ---------------------------------------------------------------------------

@app.get(
    "/api/saved-comparisons",
    response_model=List[schemas.SavedComparisonOut],
    tags=["Saved Comparisons"],
)
def list_saved_comparisons(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List all saved comparisons belonging strictly to the currently authenticated user.
    Ordered by creation date descending.
    """
    comparisons = (
        db.query(models.SavedComparison)
        .filter(models.SavedComparison.user_id == current_user.id)
        .order_by(models.SavedComparison.created_at.desc())
        .all()
    )
    return comparisons


@app.post(
    "/api/saved-comparisons",
    response_model=schemas.SavedComparisonOut,
    status_code=status.HTTP_201_CREATED,
    tags=["Saved Comparisons"],
)
def create_saved_comparison(
    comparison_in: schemas.SavedComparisonCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Save a comparison snapshot for the currently authenticated user.
    """
    new_comparison = models.SavedComparison(
        user_id=current_user.id,
        product_id=comparison_in.product_id,
        title=comparison_in.title,
        notes=comparison_in.notes,
        comparison_data=comparison_in.comparison_data,
        best_deal_price=comparison_in.best_deal_price,
        total_savings=comparison_in.total_savings,
    )
    db.add(new_comparison)
    db.commit()
    db.refresh(new_comparison)
    return new_comparison


@app.delete(
    "/api/saved-comparisons/{comparison_id}",
    status_code=status.HTTP_200_OK,
    tags=["Saved Comparisons"],
)
def delete_saved_comparison(
    comparison_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a saved comparison strictly owned by the currently authenticated user.
    Returns 404 if the record does not exist or does not belong to the user.
    """
    comparison = (
        db.query(models.SavedComparison)
        .filter(
            models.SavedComparison.id == comparison_id,
            models.SavedComparison.user_id == current_user.id,
        )
        .first()
    )
    if not comparison:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comparison not found or unauthorized",
        )

    db.delete(comparison)
    db.commit()
    return {"detail": "Comparison deleted successfully", "id": comparison_id}
