"""Authoritative demo catalog registry.

Extends the existing synthetic restaurant catalog with one bounded grocery merchant
used by recipe-shopping flows. All checkout validation still resolves against this
registry; model output never creates products or prices.
"""

from agents.base import MERCHANTS as BASE_MERCHANTS


GROCERY_MERCHANTS = {
    "loopora-fresh-market": {
        "id": "loopora-fresh-market",
        "name": "Loopora Fresh Market",
        "type": "Grocery & Fresh Market",
        "category": "Groceries",
        "rating": 4.8,
        "reviews": 318,
        "distance": 0.4,
        "address": "180 Demo Market St, Atlanta, GA 30326",
        "image": "/images/products/daily-fresh-mart.jpg",
        "tags": ["grocery", "ingredients", "rice", "spices", "fresh produce", "biryani"],
        "hours": "7:00 AM - 10:00 PM",
        "offers": [
            {"title": "Free delivery above $25", "code": "FRESH25"},
        ],
        "loyalty": {"points_per_dollar": 1, "reward": "$5 off after 100 points"},
        "catalog": [
            {
                "id": "fm-biryani-pantry",
                "name": "Biryani Pantry Essentials Kit",
                "price": 11.99,
                "category": "Recipe Kits",
                "description": "Basmati rice, biryani masala, whole spices and ghee for a home biryani base.",
                "tags": ["biryani", "ingredients", "basmati rice", "biryani masala", "whole spices", "ghee", "pantry"],
                "available": True,
                "image": "/images/products/biryani.jpg",
            },
            {
                "id": "fm-biryani-fresh-base",
                "name": "Biryani Fresh Base Pack",
                "price": 6.99,
                "category": "Recipe Kits",
                "description": "Onions, tomatoes, yogurt, mint and coriander. Add your preferred protein or vegetables.",
                "tags": ["biryani", "ingredients", "onion", "tomato", "yogurt", "mint", "coriander", "fresh"],
                "available": True,
                "image": "/images/products/mediterranean-salad.jpg",
            },
            {
                "id": "fm-biryani-chicken",
                "name": "Chicken Biryani Fresh Ingredients Pack",
                "price": 13.99,
                "category": "Recipe Kits",
                "description": "Chicken, onions, tomatoes, yogurt, mint and coriander for chicken biryani.",
                "tags": ["biryani", "ingredients", "chicken", "onion", "tomato", "yogurt", "mint", "coriander", "fresh"],
                "available": True,
                "image": "/images/products/chicken-biryani.jpg",
            },
            {
                "id": "fm-biryani-veg",
                "name": "Vegetable Biryani Fresh Ingredients Pack",
                "price": 9.99,
                "category": "Recipe Kits",
                "description": "Mixed vegetables, onions, tomatoes, yogurt, mint and coriander for vegetable biryani.",
                "tags": ["biryani", "ingredients", "vegetarian", "vegetables", "onion", "tomato", "yogurt", "mint", "coriander", "fresh"],
                "available": True,
                "image": "/images/products/veg-biryani.jpg",
            },
        ],
    },
}


# Mutate the original registry in place so legacy modules that still import
# agents.base.MERCHANTS observe the same authoritative catalog object.
BASE_MERCHANTS.update(GROCERY_MERCHANTS)
MERCHANTS = BASE_MERCHANTS
