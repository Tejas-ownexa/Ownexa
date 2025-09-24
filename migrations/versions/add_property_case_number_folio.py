"""Add case_number and folio fields to Property table

Revision ID: add_property_fields
Revises: 46c119d97f2e
Create Date: 2025-09-23 22:40:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_property_fields'
down_revision = '46c119d97f2e'
branch_labels = None
depends_on = None


def upgrade():
    # Add case_number and folio columns to properties table
    op.add_column('properties', sa.Column('case_number', sa.String(length=100), nullable=True))
    op.add_column('properties', sa.Column('folio', sa.String(length=100), nullable=True))


def downgrade():
    # Remove case_number and folio columns from properties table
    op.drop_column('properties', 'folio')
    op.drop_column('properties', 'case_number')
