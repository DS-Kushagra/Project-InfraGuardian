"""Add hazard status

Revision ID: 0df221a1ed9a
Revises: 6c92fac2ba94
Create Date: 2025-05-19 09:08:57.616525

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0df221a1ed9a'
down_revision: Union[str, None] = '6c92fac2ba94'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Define the ENUM type
hazard_status_enum = sa.Enum('reported', 'in_progress', 'resolved', name='hazardstatus')

def upgrade() -> None:
    """Upgrade schema."""
    # First, create the ENUM type
    hazard_status_enum.create(op.get_bind())

    # Add the new 'status' column using the created ENUM type
    op.add_column('hazards', sa.Column('status', hazard_status_enum, nullable=True))

    # Other schema changes
    op.alter_column('hazards', 'type',
               existing_type=sa.VARCHAR(),
               nullable=False)
    op.alter_column('hazards', 'severity',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.drop_index('ix_hazards_type', table_name='hazards')


def downgrade() -> None:
    """Downgrade schema."""
    # Reverse the schema changes
    op.create_index('ix_hazards_type', 'hazards', ['type'], unique=False)
    op.alter_column('hazards', 'severity',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.alter_column('hazards', 'type',
               existing_type=sa.VARCHAR(),
               nullable=True)
    
    # Drop the 'status' column first
    op.drop_column('hazards', 'status')

    # Then drop the ENUM type
    hazard_status_enum.drop(op.get_bind())
