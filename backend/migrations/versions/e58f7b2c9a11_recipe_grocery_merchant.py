"""Add the synthetic grocery merchant used by recipe-shopping checkout.

Revision ID: e58f7b2c9a11
Revises: d42a8e3f619b
Create Date: 2026-10-17
"""
from datetime import datetime
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e58f7b2c9a11"
down_revision: Union[str, None] = "d42a8e3f619b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    merchant_profiles = sa.table(
        "merchant_profiles",
        sa.column("id", sa.String()),
        sa.column("name", sa.String()),
        sa.column("address", sa.String()),
        sa.column("category", sa.String()),
        sa.column("is_demo", sa.Boolean()),
        sa.column("created_at", sa.DateTime()),
    )
    op.bulk_insert(
        merchant_profiles,
        [
            {
                "id": "loopora-fresh-market",
                "name": "Loopora Fresh Market",
                "address": "180 Demo Market St, Atlanta, GA 30326",
                "category": "Groceries",
                "is_demo": True,
                "created_at": datetime.utcnow(),
            }
        ],
    )


def downgrade() -> None:
    op.execute(
        sa.text("DELETE FROM merchant_profiles WHERE id = :merchant_id").bindparams(
            merchant_id="loopora-fresh-market"
        )
    )
