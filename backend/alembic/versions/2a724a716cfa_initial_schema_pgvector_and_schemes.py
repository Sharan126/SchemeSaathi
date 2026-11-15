"""initial_schema_pgvector_and_schemes

Revision ID: 2a724a716cfa
Revises: 
Create Date: 2026-11-16 00:39:42.549990

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2a724a716cfa'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


"""initial_schema_pgvector_and_schemes

Revision ID: 2a724a716cfa
Revises: 
Create Date: 2026-11-16 00:39:42.549990

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2a724a716cfa'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema across PostgreSQL with pgvector and SQLite."""
    bind = op.get_bind()
    dialect = bind.dialect.name

    # Enable pgvector extension on PostgreSQL
    if dialect == "postgresql":
        op.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    # 1. schemes table
    op.create_table(
        'schemes',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('slug', sa.String(length=128), nullable=False, unique=True),
        sa.Column('ministry', sa.String(length=256), nullable=False),
        sa.Column('department', sa.String(length=256), nullable=True),
        sa.Column('category', sa.String(length=128), nullable=False),
        sa.Column('target_beneficiaries', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='discovered'),
        sa.Column('current_version_id', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_schemes_slug', 'schemes', ['slug'])
    op.create_index('ix_schemes_ministry', 'schemes', ['ministry'])
    op.create_index('ix_schemes_category', 'schemes', ['category'])
    op.create_index('ix_schemes_status', 'schemes', ['status'])

    # 2. scheme_versions table
    op.create_table(
        'scheme_versions',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('scheme_id', sa.String(length=64), sa.ForeignKey('schemes.id', ondelete='CASCADE'), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('title', sa.JSON(), nullable=False),
        sa.Column('short_description', sa.JSON(), nullable=False),
        sa.Column('full_description', sa.JSON(), nullable=False),
        sa.Column('official_portal_url', sa.String(length=512), nullable=False),
        sa.Column('gazette_notification_url', sa.String(length=512), nullable=True),
        sa.Column('source_reference_date', sa.String(length=32), nullable=False),
        sa.Column('source_document_hash', sa.String(length=64), nullable=True),
        sa.Column('funding_type', sa.String(length=64), nullable=False, server_default='CENTRAL_SECTOR'),
        sa.Column('application_mode', sa.String(length=32), nullable=False, server_default='ONLINE'),
        sa.Column('application_steps', sa.JSON(), nullable=True),
        sa.Column('valid_from', sa.DateTime(timezone=True), nullable=False),
        sa.Column('valid_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('verified_by', sa.String(length=128), nullable=True),
        sa.Column('verification_notes', sa.Text(), nullable=True),
        sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_scheme_versions_scheme_id', 'scheme_versions', ['scheme_id'])

    # 3. scheme_benefits table
    op.create_table(
        'scheme_benefits',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('scheme_version_id', sa.String(length=64), sa.ForeignKey('scheme_versions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('benefit_type', sa.String(length=64), nullable=False),
        sa.Column('amount_description', sa.JSON(), nullable=False),
        sa.Column('frequency', sa.String(length=32), nullable=False),
        sa.Column('max_monetary_value', sa.Float(), nullable=True),
    )
    op.create_index('ix_scheme_benefits_version_id', 'scheme_benefits', ['scheme_version_id'])

    # 4. scheme_criteria table
    op.create_table(
        'scheme_criteria',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('scheme_version_id', sa.String(length=64), sa.ForeignKey('scheme_versions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('field_name', sa.String(length=64), nullable=False),
        sa.Column('criterion_type', sa.String(length=32), nullable=False),
        sa.Column('rule_ast', sa.JSON(), nullable=False),
        sa.Column('explanation', sa.JSON(), nullable=False),
        sa.Column('is_mandatory', sa.Boolean(), nullable=False, server_default='1'),
    )
    op.create_index('ix_scheme_criteria_version_id', 'scheme_criteria', ['scheme_version_id'])
    op.create_index('ix_scheme_criteria_field_name', 'scheme_criteria', ['field_name'])

    # 5. scheme_documents table
    op.create_table(
        'scheme_documents',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('scheme_version_id', sa.String(length=64), sa.ForeignKey('scheme_versions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('document_code', sa.String(length=64), nullable=False),
        sa.Column('document_name', sa.JSON(), nullable=False),
        sa.Column('issuing_authority', sa.JSON(), nullable=False),
        sa.Column('is_mandatory', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('alternatives', sa.JSON(), nullable=True),
    )
    op.create_index('ix_scheme_documents_version_id', 'scheme_documents', ['scheme_version_id'])
    op.create_index('ix_scheme_documents_doc_code', 'scheme_documents', ['document_code'])

    # 6. scheme_text_chunks table
    op.create_table(
        'scheme_text_chunks',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('scheme_version_id', sa.String(length=64), sa.ForeignKey('scheme_versions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('section_title', sa.String(length=128), nullable=False),
        sa.Column('language', sa.String(length=8), nullable=False, server_default='en'),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('embedding_vector', sa.JSON(), nullable=True),
    )
    op.create_index('ix_scheme_text_chunks_version_id', 'scheme_text_chunks', ['scheme_version_id'])
    op.create_index('ix_scheme_text_chunks_language', 'scheme_text_chunks', ['language'])

    # 7. users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('username', sa.String(length=64), nullable=False, unique=True),
        sa.Column('hashed_password', sa.String(length=256), nullable=False),
        sa.Column('role', sa.String(length=32), nullable=False, server_default='CSC_OPERATOR'),
        sa.Column('full_name', sa.String(length=128), nullable=False),
        sa.Column('organization', sa.String(length=256), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_users_username', 'users', ['username'])

    # 8. audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('entity_type', sa.String(length=64), nullable=False),
        sa.Column('entity_id', sa.String(length=64), nullable=False),
        sa.Column('action', sa.String(length=64), nullable=False),
        sa.Column('performed_by', sa.String(length=128), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('changes', sa.JSON(), nullable=True),
        sa.Column('comment', sa.Text(), nullable=True),
    )
    op.create_index('ix_audit_logs_entity_type', 'audit_logs', ['entity_type'])
    op.create_index('ix_audit_logs_entity_id', 'audit_logs', ['entity_id'])
    op.create_index('ix_audit_logs_action', 'audit_logs', ['action'])
    op.create_index('ix_audit_logs_timestamp', 'audit_logs', ['timestamp'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('audit_logs')
    op.drop_table('users')
    op.drop_table('scheme_text_chunks')
    op.drop_table('scheme_documents')
    op.drop_table('scheme_criteria')
    op.drop_table('scheme_benefits')
    op.drop_table('scheme_versions')
    op.drop_table('schemes')

