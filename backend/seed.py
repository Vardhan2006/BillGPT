import argparse
import sys
from pathlib import Path

# Add parent directory to path to allow running script directly
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR.parent))

from typing import List, Optional, TypedDict

from backend.database import Base, SessionLocal, engine
from backend.models import User, Product, Deal, Card, SavedComparison
from backend.auth import hash_password


class CardDict(TypedDict):
    name: str
    reward_rate: float
    reward_type: Optional[str]
    description: Optional[str]


class ProductDict(TypedDict):
    name: str
    description: Optional[str]
    category: Optional[str]
    base_price: float
    image_url: Optional[str]


class DealDict(TypedDict):
    source: str
    source_type: str
    price: float
    discount_details: Optional[str]


class ProductSeedItem(TypedDict):
    product: ProductDict
    deals: List[DealDict]


def seed_database(create_demo_user: bool = True):
    """Seed catalog of products, deals, rewards cards, and optional local demo user."""
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Clear existing catalog data for idempotent seeding
        db.query(Deal).delete()
        db.query(Product).delete()
        db.query(Card).delete()
        db.commit()

        print("Seeding reward cards...")
        cards_data: List[CardDict] = [

            {
                "name": "American Express Gold Card",
                "reward_rate": 0.040,  # 4.0%
                "reward_type": "Points (4x)",
                "description": "4x Membership Rewards points on eligible dining and supermarket purchases.",
            },
            {
                "name": "Capital One SavorOne",
                "reward_rate": 0.030,  # 3.0%
                "reward_type": "Cashback (3%)",
                "description": "3% cashback on dining, entertainment, and popular streaming services.",
            },
            {
                "name": "Bank of America Customized Cash",
                "reward_rate": 0.030,  # 3.0%
                "reward_type": "Cashback (3%)",
                "description": "3% cashback in your choice category including online shopping.",
            },
            {
                "name": "Citi Double Cash",
                "reward_rate": 0.020,  # 2.0%
                "reward_type": "Cashback (2%)",
                "description": "2% total cash back: 1% when you buy plus 1% as you pay.",
            },
            {
                "name": "Chase Sapphire Preferred",
                "reward_rate": 0.020,  # 2.0%
                "reward_type": "Points (2x)",
                "description": "2x Ultimate Rewards points on travel and dining.",
            },
            {
                "name": "Chase Freedom Unlimited",
                "reward_rate": 0.015,  # 1.5%
                "reward_type": "Cashback (1.5%)",
                "description": "1.5% unlimited cash back on all general purchases.",
            },
        ]
        cards = [Card(**data) for data in cards_data]
        db.add_all(cards)
        db.commit()

        print("Seeding products and deals...")
        products_data: List[ProductSeedItem] = [
            {
                "product": {
                    "name": "Apple MacBook Air M3 (13-inch, 16GB RAM, 512GB SSD)",
                    "description": "Supercharged by Apple M3 chip with 8-core CPU and 10-core GPU, Liquid Retina display.",
                    "category": "Laptops",
                    "base_price": 1299.00,
                    "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80",
                },
                "deals": [
                    {
                        "source": "Best Buy",
                        "source_type": "offer",
                        "price": 1099.00,
                        "discount_details": "$200 My Best Buy Member Flash Discount",
                    },
                    {
                        "source": "B&H Photo Video",
                        "source_type": "coupon",
                        "price": 1129.00,
                        "discount_details": "$170 instant savings with coupon APPLE170",
                    },
                    {
                        "source": "Amazon",
                        "source_type": "offer",
                        "price": 1149.00,
                        "discount_details": "$150 off Limited Time Tech Deal",
                    },
                    {
                        "source": "Rakuten / Dell Store",
                        "source_type": "cashback",
                        "price": 1199.00,
                        "discount_details": "8% Rakuten cash back on retail price",
                    },
                ],
            },
            {
                "product": {
                    "name": "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
                    "description": "Industry-leading noise canceling with two processors and 8 microphones, 30-hour battery.",
                    "category": "Audio",
                    "base_price": 399.99,
                    "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
                },
                "deals": [
                    {
                        "source": "Amazon",
                        "source_type": "offer",
                        "price": 328.00,
                        "discount_details": "18% off Spring Sale price match",
                    },
                    {
                        "source": "Best Buy",
                        "source_type": "offer",
                        "price": 339.99,
                        "discount_details": "$60 instant discount for Plus members",
                    },
                    {
                        "source": "Target",
                        "source_type": "coupon",
                        "price": 349.99,
                        "discount_details": "$50 Target Circle Rewards coupon applied",
                    },
                ],
            },
            {
                "product": {
                    "name": "Samsung 65-inch Class OLED 4K S90C Series Smart TV",
                    "description": "Neural Quantum Processor with 4K upscaling, Quantum HDR OLED, Dolby Atmos sound.",
                    "category": "TV & Home Theater",
                    "base_price": 1899.99,
                    "image_url": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80",
                },
                "deals": [
                    {
                        "source": "Costco Wholesale",
                        "source_type": "offer",
                        "price": 1599.99,
                        "discount_details": "$300 instant manufacturer rebate + free 5-year warranty",
                    },
                    {
                        "source": "Amazon",
                        "source_type": "offer",
                        "price": 1647.99,
                        "discount_details": "Prime Member Special price drop",
                    },
                    {
                        "source": "Samsung Direct",
                        "source_type": "cashback",
                        "price": 1699.99,
                        "discount_details": "$200 instant savings + 5% Samsung Rewards bonus",
                    },
                ],
            },
            {
                "product": {
                    "name": "Apple iPhone 15 Pro Max (256GB, Natural Titanium)",
                    "description": "Forged in titanium with A17 Pro chip, Action button, 48MP main camera with 5x telephoto.",
                    "category": "Smartphones",
                    "base_price": 1199.00,
                    "image_url": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80",
                },
                "deals": [
                    {
                        "source": "Verizon Wireless",
                        "source_type": "offer",
                        "price": 999.00,
                        "discount_details": "$200 bill credit promotion on upgrade",
                    },
                    {
                        "source": "Apple Certified Refurbished",
                        "source_type": "offer",
                        "price": 1049.00,
                        "discount_details": "Official Apple refurb with fresh battery and 1-year warranty",
                    },
                    {
                        "source": "Best Buy",
                        "source_type": "offer",
                        "price": 1099.00,
                        "discount_details": "$100 instant qualified activation discount",
                    },
                ],
            },
            {
                "product": {
                    "name": "Dyson V15 Detect Extra Cordless Vacuum",
                    "description": "Laser reveals microscopic dust, piezo sensor measures dust particles with 60min run time.",
                    "category": "Home Appliances",
                    "base_price": 749.99,
                    "image_url": "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&auto=format&fit=crop&q=80",
                },
                "deals": [
                    {
                        "source": "Dyson Direct",
                        "source_type": "coupon",
                        "price": 599.99,
                        "discount_details": "$150 off with promotional code CLEAN150",
                    },
                    {
                        "source": "Amazon",
                        "source_type": "offer",
                        "price": 629.99,
                        "discount_details": "16% limited time spring clearance",
                    },
                    {
                        "source": "Home Depot",
                        "source_type": "offer",
                        "price": 649.00,
                        "discount_details": "Special Buy of the Week promotional pricing",
                    },
                ],
            },
        ]

        for item in products_data:
            prod = Product(**item["product"])
            db.add(prod)
            db.flush()  # populate prod.id

            for deal_data in item["deals"]:
                deal = Deal(product_id=prod.id, **deal_data)
                db.add(deal)

        db.commit()

        if create_demo_user:
            demo_email = "test@example.com"
            demo_user = db.query(User).filter(User.email == demo_email).first()
            if not demo_user:
                print("Seeding local development test user (test@example.com / password123)...")
                demo_user = User(
                    email=demo_email,
                    hashed_password=hash_password("password123"),
                )
                db.add(demo_user)
                db.commit()
                db.refresh(demo_user)

            # Add sample saved comparison for demo user
            db.query(SavedComparison).filter(SavedComparison.user_id == demo_user.id).delete()
            sample_product = db.query(Product).first()
            if sample_product:
                sample_comparison = SavedComparison(
                    user_id=demo_user.id,
                    product_id=sample_product.id,
                    title="MacBook Air M3 Best Deal Comparison",
                    notes="Evaluated Best Buy sale ($1,099) vs B&H Photo ($1,129) combined with Amex Gold 4% points.",
                    comparison_data={
                        "product_name": sample_product.name,
                        "base_price": sample_product.base_price,
                        "chosen_deal": {
                            "source": "Best Buy",
                            "source_type": "offer",
                            "price": 1099.00,
                        },
                        "applied_card": {
                            "name": "American Express Gold Card",
                            "reward_rate": 0.04,
                            "reward_earned": 43.96,
                        },
                        "effective_price": 1055.04,
                        "total_savings": 243.96,
                    },
                    best_deal_price=1055.04,
                    total_savings=243.96,
                )
                db.add(sample_comparison)
                db.commit()

        print("Database seeded successfully!")

    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed BillGPT Database")
    parser.add_argument(
        "--no-demo-user",
        action="store_true",
        help="Skip seeding the local development demo user",
    )
    args = parser.parse_args()
    seed_database(create_demo_user=not args.no_demo_user)
