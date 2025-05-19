from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision: str = '85861a8aa054'
down_revision: Union[str, None] = '0df221a1ed9a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Explicitly create the enum type, if not exists
    op.execute("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'hazardstatus') THEN CREATE TYPE hazardstatus AS ENUM ('reported', 'in_progress', 'resolved'); END IF; END $$;")

    # 2. Add column using that enum type
    op.add_column('hazards', sa.Column('status', sa.Enum('reported', 'in_progress', 'resolved', name='hazardstatus'), nullable=True))



def downgrade() -> None:
    # 1. Drop the column
    op.drop_column('hazards', 'status')

    # 2. Drop the enum type
    op.execute("DROP TYPE hazardstatus")
