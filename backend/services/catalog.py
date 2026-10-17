"""Pure deterministic catalog retrieval shared by APIs and offline evaluation."""

from services.catalog_registry import MERCHANTS


def transform_product(product: dict, merchant: dict) -> dict:
    return {
        "id": f"{merchant['id']}_{product['id']}",
        "name": product["name"],
        "price": product["price"],
        "originalPrice": product.get("originalPrice"),
        "discount": product.get("discount"),
        "image": product.get("image", ""),
        "category": [product.get("category", merchant["category"])],
        "tags": product.get("tags", []),
        "description": product.get("description", ""),
        "merchant": merchant["name"],
        "merchant_id": merchant["id"],
        "location": merchant.get("address", ""),
        "rating": merchant.get("rating", 4.5),
        "inStock": product.get("available", True),
    }


def search_catalog(
    *,
    category: str | None = None,
    search: str | None = None,
    limit: int | None = None,
    merchant_id: str | None = None,
) -> list[dict]:
    merchants = [MERCHANTS[merchant_id]] if merchant_id in MERCHANTS else list(MERCHANTS.values())
    if merchant_id and merchant_id not in MERCHANTS:
        return []

    search_terms = search.lower().split() if search and search.strip() else []
    products: list[dict] = []
    for merchant in merchants:
        for product in merchant.get("catalog", []):
            transformed = transform_product(product, merchant)
            if category and category.lower() not in {value.lower() for value in transformed["category"]}:
                continue
            searchable_text = " ".join([
                transformed["name"],
                transformed["description"],
                transformed["merchant"],
                *transformed["category"],
                *transformed["tags"],
            ]).lower()
            if search_terms and not all(term in searchable_text for term in search_terms):
                continue
            products.append(transformed)
    return products[:limit] if limit and limit > 0 else products
