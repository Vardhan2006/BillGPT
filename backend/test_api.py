import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.auth import hash_password
from backend.database import Base, get_db
from backend.main import app, calculate_comparison_for_product
from backend.models import Card, Deal, Product, User, SavedComparison

# Isolated in-memory SQLite database with StaticPool for test execution
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    """Create a clean in-memory database and seed test data before each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Seed Cards with explicit decimal rates
    card1 = Card(
        name="Amex Gold",
        reward_rate=0.040,
        reward_type="Points (4x)",
        description="4x points on dining and supermarkets",
    )
    card2 = Card(
        name="Citi Double Cash",
        reward_rate=0.020,
        reward_type="Cashback (2%)",
        description="2% flat cash back",
    )
    card3 = Card(
        name="Chase Freedom Unlimited",
        reward_rate=0.015,
        reward_type="Cashback (1.5%)",
        description="1.5% unlimited cash back",
    )
    db.add_all([card1, card2, card3])

    # Seed Product & Deals
    product = Product(
        name="Apple MacBook Air M3 (13-inch)",
        description="M3 chip with 16GB RAM and 512GB SSD",
        category="Laptops",
        base_price=1299.00,
        image_url="https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
    )
    db.add(product)
    db.flush()

    deal1 = Deal(
        product_id=product.id,
        source="Best Buy",
        source_type="offer",
        price=1099.00,
        discount_details="$200 Member Flash Deal",
    )
    deal2 = Deal(
        product_id=product.id,
        source="Amazon",
        source_type="offer",
        price=1149.00,
        discount_details="$150 Limited Time Deal",
    )
    deal3 = Deal(
        product_id=product.id,
        source="B&H Photo",
        source_type="coupon",
        price=1129.00,
        discount_details="$170 instant coupon",
    )
    db.add_all([deal1, deal2, deal3])

    # Seed a second product for search filtering tests
    product2 = Product(
        name="Sony WH-1000XM5 Headphones",
        description="Wireless noise canceling headphones",
        category="Audio",
        base_price=399.99,
        image_url="https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
    )
    db.add(product2)
    db.flush()

    deal2_1 = Deal(
        product_id=product2.id,
        source="Amazon",
        source_type="offer",
        price=328.00,
        discount_details="18% off Spring Sale",
    )
    db.add(deal2_1)

    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=engine)


# ---------------------------------------------------------------------------
# Test Cases: Health & Auth
# ---------------------------------------------------------------------------

def test_health_check():
    """Verify health check endpoint returns status ok."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "BillGPT API"}


def test_user_registration_and_login_flow():
    """Verify registration, duplicate email rejection, weak password rejection, and login."""
    # 1. Register a new user
    reg_payload = {"email": "alice@example.com", "password": "securepassword123"}
    reg_resp = client.post("/api/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    data = reg_resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "alice@example.com"
    assert "id" in data["user"]

    # 2. Reject duplicate email registration
    dup_resp = client.post("/api/auth/register", json=reg_payload)
    assert dup_resp.status_code == 400
    assert "already exists" in dup_resp.json()["detail"]

    # 3. Reject password under 6 characters
    short_pwd_resp = client.post(
        "/api/auth/register",
        json={"email": "bob@example.com", "password": "123"},
    )
    assert short_pwd_resp.status_code == 422

    # 4. Reject invalid email format
    bad_email_resp = client.post(
        "/api/auth/register",
        json={"email": "not-an-email", "password": "securepassword123"},
    )
    assert bad_email_resp.status_code == 422

    # 5. Login with correct credentials
    login_resp = client.post("/api/auth/login", json=reg_payload)
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert "access_token" in login_data
    token = login_data["access_token"]

    # 6. Reject login with invalid password
    bad_login_resp = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "wrongpassword"},
    )
    assert bad_login_resp.status_code == 401
    assert "Invalid email or password" in bad_login_resp.json()["detail"]

    # 7. Reject login with non-existent user
    unknown_login_resp = client.post(
        "/api/auth/login",
        json={"email": "ghost@example.com", "password": "somepassword"},
    )
    assert unknown_login_resp.status_code == 401

    # 8. Fetch /api/auth/me with valid Bearer token
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "alice@example.com"

    # 9. Reject /api/auth/me without token
    unauth_resp = client.get("/api/auth/me")
    assert unauth_resp.status_code == 401


# ---------------------------------------------------------------------------
# Test Cases: Deals Search & Best-Way-to-Pay Calculation
# ---------------------------------------------------------------------------

def test_search_and_best_way_to_pay_calculation():
    """
    Verify search endpoint calculations:
    - Normalization and sorting of merchant deals
    - Accurate cheapest source selection ($1,099 at Best Buy)
    - Card rewards applied separately to avoid double-counting
    - Accurate effective price and total savings calculations
    """
    response = client.get("/api/deals/search?q=MacBook")
    assert response.status_code == 200
    results = response.json()
    assert len(results) == 1

    item = results[0]
    product = item["product"]
    deals = item["deals"]
    cards = item["cards"]
    best_way = item["best_way_to_pay"]

    assert "MacBook" in product["name"]
    assert product["base_price"] == 1299.00

    # 3 deals sorted by price ascending: Best Buy ($1099), B&H Photo ($1129), Amazon ($1149)
    assert len(deals) == 3
    assert deals[0]["source"] == "Best Buy"
    assert deals[0]["price"] == 1099.00
    assert deals[0]["savings_vs_base"] == 200.00
    assert deals[1]["source"] == "B&H Photo"
    assert deals[1]["price"] == 1129.00
    assert deals[2]["source"] == "Amazon"
    assert deals[2]["price"] == 1149.00

    # Best card should be Amex Gold at 4%
    assert best_way["best_card"]["name"] == "Amex Gold"
    assert best_way["card_reward_rate"] == 0.04
    assert best_way["cheapest_source_price"] == 1099.00
    assert best_way["cheapest_deal"]["source"] == "Best Buy"
    assert best_way["cheapest_deal"]["price"] == 1099.00

    # Mathematical verification:
    # Cheapest Price = $1,099.00
    # Reward Earned = round(1099.00 * 0.04, 2) = $43.96
    # Effective Price = round(1099.00 * (1 - 0.04), 2) = $1,055.04
    # Total Savings = round(1299.00 - 1055.04, 2) = $243.96
    # Savings Percentage = round((243.96 / 1299.00) * 100, 1) = 18.8%
    assert best_way["card_reward_earned"] == 43.96
    assert best_way["effective_price"] == 1055.04
    assert best_way["total_savings"] == 243.96
    assert best_way["savings_percentage"] == 18.8
    assert "Best Buy" in best_way["payment_recommendation"]
    assert "Amex Gold" in best_way["payment_recommendation"]


def test_search_all_and_fallback_calculation():
    """Verify empty search query returns all products, and test calculation without cards."""
    # 1. Search without query returns all 2 products
    response = client.get("/api/deals/search")
    assert response.status_code == 200
    results = response.json()
    assert len(results) == 2

    # 2. Test calculate_comparison_for_product when NO cards are available
    db = TestingSessionLocal()
    prod = db.query(Product).filter(Product.name.contains("MacBook")).first()
    res_no_cards = calculate_comparison_for_product(prod, cards=[])
    db.close()

    assert res_no_cards.best_way_to_pay.best_card is None
    assert res_no_cards.best_way_to_pay.card_reward_rate == 0.0
    assert res_no_cards.best_way_to_pay.effective_price == 1099.00
    assert res_no_cards.best_way_to_pay.total_savings == 200.00
    assert "Buy directly from Best Buy" in res_no_cards.best_way_to_pay.payment_recommendation


# ---------------------------------------------------------------------------
# Test Cases: Saved Comparisons & Strict User Ownership
# ---------------------------------------------------------------------------

def test_strict_user_ownership_for_saved_comparisons():
    """Verify complete CRUD and multi-user isolation on /api/saved-comparisons."""
    # 1. Register User A
    user_a_token = client.post(
        "/api/auth/register",
        json={"email": "usera@example.com", "password": "passwordA123"},
    ).json()["access_token"]
    headers_a = {"Authorization": f"Bearer {user_a_token}"}

    # 2. Register User B
    user_b_token = client.post(
        "/api/auth/register",
        json={"email": "userb@example.com", "password": "passwordB123"},
    ).json()["access_token"]
    headers_b = {"Authorization": f"Bearer {user_b_token}"}

    # 3. User A creates a saved comparison
    comparison_payload = {
        "title": "MacBook Air Deal Comparison",
        "notes": "Best Buy offer + Amex Gold 4%",
        "comparison_data": {
            "product_name": "Apple MacBook Air M3 (13-inch)",
            "base_price": 1299.00,
            "cheapest_source": "Best Buy",
            "cheapest_price": 1099.00,
            "best_card": "Amex Gold",
            "card_reward": 43.96,
            "effective_price": 1055.04,
        },
        "best_deal_price": 1055.04,
        "total_savings": 243.96,
    }
    create_resp = client.post("/api/saved-comparisons", json=comparison_payload, headers=headers_a)
    assert create_resp.status_code == 201
    comp_a = create_resp.json()
    comp_a_id = comp_a["id"]
    assert comp_a["title"] == "MacBook Air Deal Comparison"
    assert comp_a["total_savings"] == 243.96

    # 4. User A lists comparisons -> sees 1 item
    list_a_resp = client.get("/api/saved-comparisons", headers=headers_a)
    assert list_a_resp.status_code == 200
    assert len(list_a_resp.json()) == 1
    assert list_a_resp.json()[0]["id"] == comp_a_id

    # 5. User B lists comparisons -> receives empty list (isolation check)
    list_b_resp = client.get("/api/saved-comparisons", headers=headers_b)
    assert list_b_resp.status_code == 200
    assert len(list_b_resp.json()) == 0

    # 6. User B attempts to delete User A's comparison -> 404 (IDOR prevention)
    delete_by_b_resp = client.delete(f"/api/saved-comparisons/{comp_a_id}", headers=headers_b)
    assert delete_by_b_resp.status_code == 404
    assert delete_by_b_resp.json()["detail"] == "Comparison not found or unauthorized"

    # 7. Unauthenticated user cannot access saved comparisons
    unauth_list = client.get("/api/saved-comparisons")
    assert unauth_list.status_code == 401

    unauth_delete = client.delete(f"/api/saved-comparisons/{comp_a_id}")
    assert unauth_delete.status_code == 401

    # 8. User A deletes their comparison -> 200 OK
    delete_by_a_resp = client.delete(f"/api/saved-comparisons/{comp_a_id}", headers=headers_a)
    assert delete_by_a_resp.status_code == 200
    assert delete_by_a_resp.json()["id"] == comp_a_id

    # 9. User A lists comparisons -> 0 items
    list_a_after = client.get("/api/saved-comparisons", headers=headers_a)
    assert list_a_after.status_code == 200
    assert len(list_a_after.json()) == 0
