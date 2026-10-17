"""Add the auditable merchant recommendation acceptance log.

Revision ID: d42a8e3f619b
Revises: af610d4b2c93
Create Date: 2026-10-17
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d42a8e3f619b"
down_revision: Union[str, None] = "af610d4b2c93"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "merchant_actions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("merchant_id", sa.String(), nullable=False),
        sa.Column("recommendation_id", sa.String(), nullable=False),
        sa.Column("category", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("instruction", sa.Text(), nullable=False),
        sa.Column("evidence", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("accepted_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["merchant_id"], ["merchant_profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_merchant_actions_merchant_id", "merchant_actions", ["merchant_id"])
    op.create_index("ix_merchant_actions_recommendation_id", "merchant_actions", ["recommendation_id"])
    op.create_index("ix_merchant_actions_status", "merchant_actions", ["status"])
    op.create_index("ix_merchant_actions_accepted_at", "merchant_actions", ["accepted_at"])


def downgrade() -> None:
    op.drop_index("ix_merchant_actions_accepted_at", table_name="merchant_actions")
    op.drop_index("ix_merchant_actions_status", table_name="merchant_actions")
    op.drop_index("ix_merchant_actions_recommendation_id", table_name="merchant_actions")
    op.drop_index("ix_merchant_actions_merchant_id", table_name="merchant_actions")
    op.drop_table("merchant_actions")
