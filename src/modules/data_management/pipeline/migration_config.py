#!/usr/bin/env python3
"""
Configuration file for the Data Migration Pipeline
Contains field mappings, validation rules, and database schema mappings
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass

@dataclass
class FieldMapping:
    """Mapping between CSV column names and database field names"""
    csv_column: str
    db_field: str
    required: bool = False
    data_type: str = "string"
    default_value: Any = None
    validation_rules: Optional[Dict[str, Any]] = None

@dataclass
class ValidationRule:
    """Validation rule for a field"""
    rule_type: str  # required, email, phone, date, decimal, regex, custom
    parameters: Dict[str, Any]
    error_message: str

# Field mappings for Properties
PROPERTY_FIELD_MAPPINGS = [
    FieldMapping("Property name", "title", required=True, data_type="string"),
    FieldMapping("Address 1", "street_address_1", required=True, data_type="string"),
    FieldMapping("Address 2", "street_address_2", required=False, data_type="string"),
    FieldMapping("Address 3", "apt_number", required=False, data_type="string"),
    FieldMapping("City/Locality", "city", required=True, data_type="string"),
    FieldMapping("State/Province", "state", required=True, data_type="string"),
    FieldMapping("Postal code", "zip_code", required=True, data_type="string"),
    FieldMapping("Building type", "building_type", required=False, data_type="string"),
    FieldMapping("Operating bank account", "operating_account", required=False, data_type="string"),
    FieldMapping("Deposit trust account", "deposit_account", required=False, data_type="string"),
    FieldMapping("Reserve amount", "reserve_amount", required=False, data_type="decimal"),
    FieldMapping("Building description", "description", required=False, data_type="text"),
    FieldMapping("Id", "external_id", required=False, data_type="string"),
    FieldMapping("Year built", "year_built", required=False, data_type="integer"),
    FieldMapping("Location", "location", required=False, data_type="string"),
    FieldMapping("Rental owners", "owner_name", required=False, data_type="string"),
    FieldMapping("Type", "property_type", required=False, data_type="string"),
]

# Field mappings for Tenants
TENANT_FIELD_MAPPINGS = [
    FieldMapping("Property name", "property_name", required=True, data_type="string"),
    FieldMapping("Unit number", "unit_number", required=False, data_type="string"),
    FieldMapping("First name", "first_name", required=True, data_type="string"),
    FieldMapping("Last name", "last_name", required=True, data_type="string"),
    FieldMapping("Start date", "lease_start", required=False, data_type="date"),
    FieldMapping("End date", "lease_end", required=False, data_type="date"),
    FieldMapping("Rent/Fee", "rent_amount", required=False, data_type="decimal"),
    FieldMapping("Rent cycle", "rent_cycle", required=False, data_type="string"),
    FieldMapping("Street address line 1", "address_line_1", required=False, data_type="string"),
    FieldMapping("Street address line 2", "address_line_2", required=False, data_type="string"),
    FieldMapping("Street address line 3", "address_line_3", required=False, data_type="string"),
    FieldMapping("City/Locality", "city", required=False, data_type="string"),
    FieldMapping("State/Province/Territory", "state", required=False, data_type="string"),
    FieldMapping("Postal code", "postal_code", required=False, data_type="string"),
    FieldMapping("Login email", "email", required=False, data_type="email"),
    FieldMapping("Alternate email", "alternate_email", required=False, data_type="email"),
    FieldMapping("Home phone", "home_phone", required=False, data_type="phone"),
    FieldMapping("Work phone", "work_phone", required=False, data_type="phone"),
    FieldMapping("Mobile", "mobile_phone", required=False, data_type="phone"),
    FieldMapping("Fax", "fax", required=False, data_type="phone"),
    FieldMapping("Emergency name", "emergency_contact_name", required=False, data_type="string"),
    FieldMapping("Emergency phone", "emergency_contact_phone", required=False, data_type="phone"),
    FieldMapping("Date of birth", "date_of_birth", required=False, data_type="date"),
    FieldMapping("Comment", "notes", required=False, data_type="text"),
    FieldMapping("Id", "external_id", required=False, data_type="string"),
    FieldMapping("LeaseId", "lease_id", required=False, data_type="string"),
    FieldMapping("Status", "status", required=False, data_type="string"),
    FieldMapping("Number of pets", "pet_count", required=False, data_type="integer"),
]

# Field mappings for Leases
LEASE_FIELD_MAPPINGS = [
    FieldMapping("Account number", "account_number", required=True, data_type="string"),
    FieldMapping("Tenants", "tenant_names", required=True, data_type="string"),
    FieldMapping("Unit", "unit", required=False, data_type="string"),
    FieldMapping("Status", "status", required=False, data_type="string"),
    FieldMapping("Start date", "start_date", required=False, data_type="date"),
    FieldMapping("End date", "end_date", required=False, data_type="date"),
    FieldMapping("Type", "lease_type", required=False, data_type="string"),
    FieldMapping("Rent", "rent_amount", required=False, data_type="decimal"),
]

# Field mappings for Rental Owners
OWNER_FIELD_MAPPINGS = [
    FieldMapping("Owner name", "full_name", required=True, data_type="string"),
    FieldMapping("Email", "email", required=False, data_type="email"),
    FieldMapping("Phone", "phone", required=False, data_type="phone"),
    FieldMapping("Address", "address", required=False, data_type="string"),
    FieldMapping("City", "city", required=False, data_type="string"),
    FieldMapping("State", "state", required=False, data_type="string"),
    FieldMapping("Zip", "zip_code", required=False, data_type="string"),
]

# Field mappings for Outstanding Balances
BALANCE_FIELD_MAPPINGS = [
    FieldMapping("Tenant name", "tenant_name", required=True, data_type="string"),
    FieldMapping("Property", "property_name", required=True, data_type="string"),
    FieldMapping("Amount due", "amount_due", required=True, data_type="decimal"),
    FieldMapping("Due date", "due_date", required=False, data_type="date"),
    FieldMapping("Status", "status", required=False, data_type="string"),
]

# Validation rules
VALIDATION_RULES = {
    "email": ValidationRule(
        rule_type="regex",
        parameters={"pattern": r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"},
        error_message="Invalid email format"
    ),
    "phone": ValidationRule(
        rule_type="regex",
        parameters={"pattern": r"^[\+]?[1-9][\d]{0,15}$"},
        error_message="Invalid phone number format"
    ),
    "date": ValidationRule(
        rule_type="date_format",
        parameters={"formats": ["%m/%d/%Y", "%Y-%m-%d", "%m-%d-%Y", "%d/%m/%Y"]},
        error_message="Invalid date format"
    ),
    "decimal": ValidationRule(
        rule_type="decimal",
        parameters={"precision": 10, "scale": 2},
        error_message="Invalid decimal format"
    ),
    "postal_code": ValidationRule(
        rule_type="regex",
        parameters={"pattern": r"^\d{5}(-\d{4})?$"},
        error_message="Invalid postal code format"
    ),
    "state": ValidationRule(
        rule_type="regex",
        parameters={"pattern": r"^[A-Z]{2}$"},
        error_message="State should be 2-letter abbreviation"
    ),
}

# Data cleaning rules
DATA_CLEANING_RULES = {
    "string": {
        "trim_whitespace": True,
        "remove_extra_spaces": True,
        "convert_to_title_case": False,
        "remove_special_chars": False,
    },
    "email": {
        "trim_whitespace": True,
        "convert_to_lowercase": True,
        "remove_extra_spaces": True,
    },
    "phone": {
        "remove_non_digits": True,
        "remove_extra_spaces": True,
        "format_phone": True,
    },
    "address": {
        "trim_whitespace": True,
        "remove_extra_spaces": True,
        "standardize_abbreviations": True,
    },
    "currency": {
        "remove_currency_symbols": True,
        "remove_commas": True,
        "remove_spaces": True,
        "validate_decimal": True,
    },
}

# Building type mappings
BUILDING_TYPE_MAPPINGS = {
    "Condo/Townhome": "condo",
    "Single-Family": "single_family",
    "Office": "office",
    "Industrial": "industrial",
    "Warehouse": "warehouse",
    "Retail": "retail",
    "Mixed Use": "mixed_use",
    "Apartment": "apartment",
    "Townhouse": "townhouse",
    "Villa": "villa",
}

# Property status mappings
PROPERTY_STATUS_MAPPINGS = {
    "available": "available",
    "occupied": "occupied",
    "maintenance": "maintenance",
    "rented": "occupied",
    "leased": "occupied",
    "vacant": "available",
    "under_renovation": "maintenance",
}

# Tenant status mappings
TENANT_STATUS_MAPPINGS = {
    "active": "active",
    "inactive": "inactive",
    "pending": "pending",
    "tenant": "active",
    "prospect": "pending",
    "former": "inactive",
}

# Lease type mappings
LEASE_TYPE_MAPPINGS = {
    "AtWill": "month_to_month",
    "Fixed": "fixed_term",
    "FixedWithRollover": "fixed_with_rollover",
    "month_to_month": "month_to_month",
    "fixed_term": "fixed_term",
    "fixed_with_rollover": "fixed_with_rollover",
}

# CSV file type detection patterns
FILE_TYPE_PATTERNS = {
    "properties": {
        "filename_patterns": ["property", "properties", "building", "real_estate"],
        "column_patterns": ["Property name", "Address", "City", "State", "Postal code"],
        "required_columns": ["Property name", "Address 1"]
    },
    "tenants": {
        "filename_patterns": ["tenant", "tenants", "resident", "occupant"],
        "column_patterns": ["First name", "Last name", "Property name", "Start date"],
        "required_columns": ["First name", "Last name", "Property name"]
    },
    "leases": {
        "filename_patterns": ["lease", "leases", "rental", "agreement"],
        "column_patterns": ["Account number", "Tenants", "Start date", "End date"],
        "required_columns": ["Account number", "Tenants"]
    },
    "owners": {
        "filename_patterns": ["owner", "owners", "landlord", "investor"],
        "column_patterns": ["Owner name", "Email", "Phone", "Address"],
        "required_columns": ["Owner name"]
    },
    "balances": {
        "filename_patterns": ["balance", "balances", "outstanding", "arrears"],
        "column_patterns": ["Tenant name", "Property", "Amount due"],
        "required_columns": ["Tenant name", "Property", "Amount due"]
    }
}

# Database table mappings
DATABASE_TABLE_MAPPINGS = {
    "properties": {
        "table_name": "properties",
        "model_class": "Property",
        "unique_constraints": ["title"],
        "foreign_keys": {"owner_id": "user.id"}
    },
    "tenants": {
        "table_name": "tenants",
        "model_class": "Tenant",
        "unique_constraints": ["email"],
        "foreign_keys": {"property_id": "properties.id"}
    },
    "leases": {
        "table_name": "draft_leases",
        "model_class": "DraftLease",
        "unique_constraints": ["tenant_id", "property_id"],
        "foreign_keys": {
            "tenant_id": "tenants.id",
            "property_id": "properties.id"
        }
    },
    "owners": {
        "table_name": "user",
        "model_class": "User",
        "unique_constraints": ["email", "username"],
        "foreign_keys": {}
    },
    "balances": {
        "table_name": "outstanding_balances",
        "model_class": "OutstandingBalance",
        "unique_constraints": ["tenant_id", "property_id"],
        "foreign_keys": {
            "tenant_id": "tenants.id",
            "property_id": "properties.id"
        }
    }
}

# Error handling configuration
ERROR_HANDLING_CONFIG = {
    "max_errors_per_file": 100,
    "max_warnings_per_file": 200,
    "continue_on_error": True,
    "log_level": "INFO",
    "create_error_report": True,
    "error_report_format": "csv",  # csv, json, html
}

# Performance configuration
PERFORMANCE_CONFIG = {
    "batch_size": 100,
    "use_transactions": True,
    "commit_frequency": 50,
    "parallel_processing": False,
    "max_workers": 1,
    "timeout_seconds": 300,
}

# Backup configuration
BACKUP_CONFIG = {
    "create_backup": True,
    "backup_directory": "./backups",
    "backup_format": "sql",  # sql, csv, json
    "keep_backups": 5,
    "backup_before_migration": True,
    "backup_after_migration": False,
}

# Logging configuration
LOGGING_CONFIG = {
    "log_level": "INFO",
    "log_file": "migration.log",
    "log_format": "%(asctime)s - %(levelname)s - %(message)s",
    "log_rotation": True,
    "max_log_size": "10MB",
    "backup_count": 5,
    "console_output": True,
    "file_output": True,
}

def get_field_mapping(file_type: str) -> List[FieldMapping]:
    """Get field mappings for a specific file type"""
    mappings = {
        "properties": PROPERTY_FIELD_MAPPINGS,
        "tenants": TENANT_FIELD_MAPPINGS,
        "leases": LEASE_FIELD_MAPPINGS,
        "owners": OWNER_FIELD_MAPPINGS,
        "balances": BALANCE_FIELD_MAPPINGS,
    }
    return mappings.get(file_type, [])

def get_validation_rules() -> Dict[str, ValidationRule]:
    """Get all validation rules"""
    return VALIDATION_RULES

def get_data_cleaning_rules() -> Dict[str, Dict[str, Any]]:
    """Get data cleaning rules"""
    return DATA_CLEANING_RULES

def get_file_type_patterns() -> Dict[str, Dict[str, Any]]:
    """Get file type detection patterns"""
    return FILE_TYPE_PATTERNS

def get_database_table_mappings() -> Dict[str, Dict[str, Any]]:
    """Get database table mappings"""
    return DATABASE_TABLE_MAPPINGS

def get_error_handling_config() -> Dict[str, Any]:
    """Get error handling configuration"""
    return ERROR_HANDLING_CONFIG

def get_performance_config() -> Dict[str, Any]:
    """Get performance configuration"""
    return PERFORMANCE_CONFIG

def get_backup_config() -> Dict[str, Any]:
    """Get backup configuration"""
    return BACKUP_CONFIG

def get_logging_config() -> Dict[str, Any]:
    """Get logging configuration"""
    return LOGGING_CONFIG
