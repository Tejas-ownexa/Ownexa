"""Add association managers table

Revision ID: add_association_managers
Revises: ca38d43017a1
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_association_managers'
down_revision = '46c119d97f2e'
branch_labels = None
depends_on = None


def upgrade():
    # Create association_managers table
    op.create_table('association_managers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('association_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('is_primary', sa.Boolean(), nullable=True, default=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['association_id'], ['associations.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    # Drop association_managers table
    op.drop_table('association_managers')
