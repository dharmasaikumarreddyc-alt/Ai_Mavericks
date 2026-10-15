"""Spending rules routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from database.models import SpendingRulesDB
from models.rules import SpendingRules, RulesUpdate
from routers.auth import get_current_user

router = APIRouter(prefix="/rules", tags=["Rules"])


@router.get("", response_model=dict)
async def get_rules(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's spending rules."""
    result = await db.execute(
        select(SpendingRulesDB).where(SpendingRulesDB.user_id == current_user.id)
    )
    rules = result.scalar_one_or_none()

    if not rules:
        # Return default rules
        return {
            "monthly_budget": 500.0,
            "categories": [
                {"category": "Groceries", "enabled": True, "limit": 150.0},
                {"category": "Health & Supplements", "enabled": True, "limit": 100.0},
                {"category": "Electronics", "enabled": True, "limit": 200.0},
                {"category": "Fashion", "enabled": False, "limit": 75.0},
            ],
            "guardrails": {
                "require_approval_above": 50.0,
                "block_international": False,
                "require_2fa_above": 100.0,
                "auto_pause_on_suspicious": True
            },
            "merchant_whitelist": [],
            "merchant_blacklist": []
        }

    return {
        "monthly_budget": rules.monthly_budget,
        "categories": rules.categories,
        "guardrails": rules.guardrails,
        "merchant_whitelist": rules.merchant_whitelist,
        "merchant_blacklist": rules.merchant_blacklist
    }


@router.put("")
async def update_rules(
    updates: RulesUpdate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user's spending rules."""
    result = await db.execute(
        select(SpendingRulesDB).where(SpendingRulesDB.user_id == current_user.id)
    )
    rules = result.scalar_one_or_none()

    if not rules:
        # Create new rules
        rules = SpendingRulesDB(user_id=current_user.id)
        db.add(rules)

    # Update fields
    if updates.monthly_budget is not None:
        rules.monthly_budget = updates.monthly_budget

    if updates.categories is not None:
        rules.categories = [cat.model_dump() for cat in updates.categories]

    if updates.guardrails is not None:
        rules.guardrails = updates.guardrails.model_dump()

    if updates.merchant_whitelist is not None:
        rules.merchant_whitelist = updates.merchant_whitelist

    if updates.merchant_blacklist is not None:
        rules.merchant_blacklist = updates.merchant_blacklist

    await db.commit()
    await db.refresh(rules)

    return {
        "status": "success",
        "message": "Rules updated",
        "rules": {
            "monthly_budget": rules.monthly_budget,
            "categories": rules.categories,
            "guardrails": rules.guardrails,
            "merchant_whitelist": rules.merchant_whitelist,
            "merchant_blacklist": rules.merchant_blacklist
        }
    }


@router.post("/categories/{category}/toggle")
async def toggle_category(
    category: str,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Toggle a category on/off."""
    result = await db.execute(
        select(SpendingRulesDB).where(SpendingRulesDB.user_id == current_user.id)
    )
    rules = result.scalar_one_or_none()

    if not rules:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rules not found"
        )

    categories = rules.categories or []
    found = False

    for cat in categories:
        if cat["category"].lower() == category.lower():
            cat["enabled"] = not cat["enabled"]
            found = True
            break

    if not found:
        # Add new category
        categories.append({
            "category": category,
            "enabled": True,
            "limit": 100.0
        })

    rules.categories = categories
    await db.commit()

    return {"status": "success", "categories": rules.categories}


@router.put("/categories/{category}/limit")
async def update_category_limit(
    category: str,
    limit: float,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a category's spending limit."""
    result = await db.execute(
        select(SpendingRulesDB).where(SpendingRulesDB.user_id == current_user.id)
    )
    rules = result.scalar_one_or_none()

    if not rules:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rules not found"
        )

    categories = rules.categories or []

    for cat in categories:
        if cat["category"].lower() == category.lower():
            cat["limit"] = limit
            break

    rules.categories = categories
    await db.commit()

    return {"status": "success", "categories": rules.categories}
