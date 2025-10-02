"""
Utility functions for property operations
"""

from config import db
import logging

def safe_delete_property_related_records(property_id):
    """
    Safely delete all records related to a property, handling schema differences gracefully
    """
    deletion_queries = [
        # Tables without CASCADE DELETE - must be deleted manually
        ("property_favorites", "DELETE FROM property_favorites WHERE property_id = :property_id"),
        ("listings", "DELETE FROM listings WHERE property_id = :property_id"),
        ("work_orders", "DELETE FROM work_orders WHERE property_id = :property_id"),
        ("association_property_assignments", "DELETE FROM association_property_assignments WHERE property_id = :property_id"),
        
        # Tables with CASCADE DELETE - should be handled automatically, but let's be explicit
        ("property_financials", "DELETE FROM property_financials WHERE property_id = :property_id"),
        ("financial_transactions", "DELETE FROM financial_transactions WHERE property_id = :property_id"),
        ("maintenance_requests", "DELETE FROM maintenance_requests WHERE property_id = :property_id"),
        ("property_unit_details", "DELETE FROM property_unit_details WHERE property_id = :property_id"),
        ("property_listing_status", "DELETE FROM property_listing_status WHERE property_id = :property_id"),
        ("leasing_applicants", "DELETE FROM leasing_applicants WHERE property_id = :property_id"),
        ("lease_drafts", "DELETE FROM lease_drafts WHERE property_id = :property_id"),
        ("applicant_groups", "DELETE FROM applicant_groups WHERE property_id = :property_id"),
        ("lease_roll", "DELETE FROM lease_roll WHERE property_id = :property_id"),
    ]
    
    deleted_counts = {}
    
    for table_name, query in deletion_queries:
        try:
            result = db.session.execute(db.text(query), {"property_id": property_id})
            deleted_count = result.rowcount
            if deleted_count > 0:
                deleted_counts[table_name] = deleted_count
                logging.info(f"Deleted {deleted_count} records from {table_name}")
        except Exception as e:
            # Log the error but continue with other deletions
            logging.warning(f"Could not delete from {table_name}: {e}")
            # Check if it's a "table doesn't exist" error
            if "does not exist" in str(e).lower() or "relation" in str(e).lower():
                logging.info(f"Table {table_name} does not exist, skipping...")
            else:
                logging.error(f"Unexpected error deleting from {table_name}: {e}")
    
    return deleted_counts

def check_property_deletion_constraints(property_id):
    """
    Check if a property can be safely deleted by checking for blocking constraints
    Returns a tuple: (can_delete, blocking_reasons)
    """
    from models.tenant import Tenant, OutstandingBalance
    from models.maintenance import MaintenanceRequest
    
    blocking_reasons = []
    
    # Check for tenants
    try:
        tenant_count = Tenant.query.filter_by(property_id=property_id).count()
        if tenant_count > 0:
            blocking_reasons.append(f"{tenant_count} tenants assigned to this property")
    except Exception as e:
        logging.warning(f"Could not check tenants: {e}")
    
    # Check for outstanding balances
    try:
        balance_count = OutstandingBalance.query.filter_by(property_id=property_id).count()
        if balance_count > 0:
            blocking_reasons.append(f"{balance_count} outstanding balances")
    except Exception as e:
        logging.warning(f"Could not check outstanding balances: {e}")
    
    # Check for maintenance requests
    try:
        maintenance_count = MaintenanceRequest.query.filter_by(property_id=property_id).count()
        if maintenance_count > 0:
            blocking_reasons.append(f"{maintenance_count} maintenance requests")
    except Exception as e:
        logging.warning(f"Could not check maintenance requests: {e}")
    
    # Note: Tasks table is not related to properties (no property_id column)
    # so we don't need to check for tasks
    
    can_delete = len(blocking_reasons) == 0
    return can_delete, blocking_reasons
