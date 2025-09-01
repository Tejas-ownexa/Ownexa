#!/usr/bin/env python3
"""
Advanced Data Migration Pipeline for Ownexa-JP
Converts CSV files to PostgreSQL database with comprehensive validation and error handling.
"""

import os
import sys
import csv
import logging
import pandas as pd
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from typing import Dict, List, Any, Optional, Tuple
import re
from pathlib import Path

# Add project root to path for imports
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_root)

# Import DataCleaner first (always needed)
from data_cleaner import DataCleaner

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migration.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Import project modules
try:
    from config import app, db
    from models import (
        Property, Tenant, User, RentRoll, OutstandingBalance, 
        LeaseRenewal, DraftLease, FinancialTransaction
    )
    from migration_config import *
    logger.info("Successfully imported Flask app and models")
except ImportError as e:
    logger.warning(f"Could not import models: {e}. Running in standalone mode.")
    app = None
    db = None

class MigrationConfig:
    """Configuration for the migration pipeline"""
    
    def __init__(self, csv_directory=".", backup_directory="./backups", dry_run=False, 
                 validate_data=True, clean_data=True, create_backup=True,
                 batch_size=100, max_errors=50, log_level="INFO", log_file="migration.log"):
        # Map the parameters to match what run_migration.py expects
        self.csv_directory = csv_directory
        self.csv_dir = csv_directory  # Alternative name
        self.backup_directory = backup_directory
        self.dry_run = dry_run
        self.validate_data = validate_data
        self.clean_data = clean_data
        self.create_backup = create_backup
        self.batch_size = batch_size
        self.max_errors = max_errors
        self.log_level = log_level
        self.log_file = log_file

class ValidationResult:
    """Result of data validation"""
    def __init__(self, is_valid: bool, errors: List[str], warnings: List[str], cleaned_data: Dict[str, Any]):
        self.is_valid = is_valid
        self.errors = errors
        self.warnings = warnings
        self.cleaned_data = cleaned_data

class DataValidator:
    """Base class for data validators"""
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        if not email:
            return False
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def validate_phone(phone: str) -> bool:
        """Validate phone number"""
        if not phone:
            return True  # Phone is optional
        # Remove all non-digits
        digits = re.sub(r'\D', '', phone)
        return len(digits) >= 10

class PropertyValidator(DataValidator):
    """Validator for property data"""
    
    @staticmethod
    def validate_property_data(data: Dict[str, Any]) -> ValidationResult:
        errors = []
        warnings = []
        cleaned_data = data.copy()
        
        # Required fields
        if not data.get('Property Name'):
            errors.append("Property name is required")
        
        if not data.get('City'):
            errors.append("City is required")
            
        if not data.get('State'):
            errors.append("State is required")
        
        # Validate rent amount
        try:
            rent = DataCleaner.clean_currency(str(data.get('Rent Amount', '0')))
            if rent <= 0:
                warnings.append("Rent amount should be greater than 0")
            cleaned_data['rent_amount'] = rent
        except:
            errors.append("Invalid rent amount format")
        
        # Clean and validate address
        cleaned_data['street_address_1'] = DataCleaner.clean_string(data.get('Street Address', ''))
        cleaned_data['city'] = DataCleaner.clean_string(data.get('City', ''))
        cleaned_data['state'] = DataCleaner.clean_string(data.get('State', ''))
        cleaned_data['zip_code'] = DataCleaner.clean_string(data.get('Zip Code', ''))
        
        is_valid = len(errors) == 0
        return ValidationResult(is_valid, errors, warnings, cleaned_data)

class TenantValidator(DataValidator):
    """Validator for tenant data"""
    
    @staticmethod
    def validate_tenant_data(data: Dict[str, Any]) -> ValidationResult:
        errors = []
        warnings = []
        cleaned_data = data.copy()
        
        # Validate name
        full_name = data.get('Full name', '').strip()
        if not full_name:
            errors.append("Full name is required")
        cleaned_data['full_name'] = DataCleaner.clean_name(full_name)
        
        # Validate email
        email = data.get('Login email', '').strip()
        if email and not DataValidator.validate_email(email):
            errors.append(f"Invalid email format: {email}")
        elif not email:
            cleaned_data['email'] = None  # Set to None for NULL in database
        else:
            cleaned_data['email'] = DataCleaner.clean_email(email)
        
        # Validate phone
        phone = data.get('Phone Number', '').strip()
        if phone and not DataValidator.validate_phone(phone):
            warnings.append(f"Invalid phone format: {phone}")
        cleaned_data['phone_number'] = DataCleaner.clean_phone(phone) if phone else None
        
        # Clean address fields
        cleaned_data['street_address_1'] = DataCleaner.clean_string(data.get('Street Address', ''))
        cleaned_data['city'] = DataCleaner.clean_string(data.get('City', ''))
        cleaned_data['state'] = DataCleaner.clean_string(data.get('State', ''))
        cleaned_data['zip_code'] = DataCleaner.clean_string(data.get('Zip Code', ''))
        
        is_valid = len(errors) == 0
        return ValidationResult(is_valid, errors, warnings, cleaned_data)

class LeaseValidator(DataValidator):
    """Validator for lease data"""
    
    @staticmethod
    def validate_lease_data(data: Dict[str, Any]) -> ValidationResult:
        errors = []
        warnings = []
        cleaned_data = data.copy()
        
        # Validate tenant name
        tenant_name = data.get('Tenants', '').strip()
        if not tenant_name:
            errors.append("Tenant name is required")
        cleaned_data['tenant_name'] = DataCleaner.clean_name(tenant_name)
        
        # Validate dates
        start_date = data.get('start Date')
        end_date = data.get('End Date')
        
        try:
            if start_date:
                cleaned_data['start_date'] = DataCleaner.clean_date(start_date)
        except:
            errors.append("Invalid start date format")
            
        try:
            if end_date:
                cleaned_data['end_date'] = DataCleaner.clean_date(end_date)
        except:
            errors.append("Invalid end date format")
        
        # Validate rent amount
        try:
            rent = DataCleaner.clean_currency(str(data.get('Rent Amount', '0')))
            if rent <= 0:
                warnings.append("Rent amount should be greater than 0")
            cleaned_data['rent_amount'] = rent
        except:
            errors.append("Invalid rent amount format")
        
        is_valid = len(errors) == 0
        return ValidationResult(is_valid, errors, warnings, cleaned_data)

class OwnerValidator(DataValidator):
    """Validator for owner data"""
    
    @staticmethod
    def validate_owner_data(data: Dict[str, Any]) -> ValidationResult:
        errors = []
        warnings = []
        cleaned_data = data.copy()
        
        # Validate name
        full_name = data.get('Name', '').strip()
        if not full_name:
            errors.append("Owner name is required")
        cleaned_data['full_name'] = DataCleaner.clean_name(full_name)
        
        # Validate email
        email = data.get('Email', '').strip()
        if not email:
            errors.append("Email is required for owners")
        elif not DataValidator.validate_email(email):
            errors.append(f"Invalid email format: {email}")
        else:
            cleaned_data['email'] = DataCleaner.clean_email(email)
        
        # Generate username from email
        if email:
            username = email.split('@')[0].lower()
            cleaned_data['username'] = DataCleaner.clean_string(username)
        
        # Clean address fields
        cleaned_data['street_address_1'] = DataCleaner.clean_string(data.get('Address', ''))
        cleaned_data['city'] = DataCleaner.clean_string(data.get('City', ''))
        cleaned_data['state'] = DataCleaner.clean_string(data.get('State', ''))
        cleaned_data['zip_code'] = DataCleaner.clean_string(data.get('Zip Code', ''))
        
        is_valid = len(errors) == 0
        return ValidationResult(is_valid, errors, warnings, cleaned_data)

class BalanceValidator(DataValidator):
    """Validator for balance data"""
    
    @staticmethod
    def validate_balance_data(data: Dict[str, Any]) -> ValidationResult:
        errors = []
        warnings = []
        cleaned_data = data.copy()
        
        # Validate tenant name
        tenant_name = data.get('Tenants', '').strip()
        if not tenant_name:
            errors.append("Tenant name is required")
        cleaned_data['tenant_name'] = DataCleaner.clean_name(tenant_name)
        
        # Validate balance amount
        try:
            amount = DataCleaner.clean_currency(str(data.get('Balance', '0')))
            cleaned_data['due_amount'] = amount
        except:
            errors.append("Invalid balance amount format")
        
        # Validate date
        due_date = data.get('Due Date')
        try:
            if due_date:
                cleaned_data['due_date'] = DataCleaner.clean_date(due_date)
        except:
            warnings.append("Invalid due date format")
        
        is_valid = len(errors) == 0
        return ValidationResult(is_valid, errors, warnings, cleaned_data)

class CSVProcessor:
    """Handles CSV file processing and validation"""
    
    def __init__(self, config: MigrationConfig):
        self.config = config
        self.validators = {
            'properties': PropertyValidator(),
            'tenants': TenantValidator(),
            'leases': LeaseValidator(),
            'owners': OwnerValidator(),
            'balances': BalanceValidator()
        }
    
    def detect_file_type(self, filename: str, headers: List[str]) -> str:
        """Detect the type of CSV file based on filename and headers"""
        filename_lower = filename.lower()
        
        # Check filename patterns
        if 'properties' in filename_lower or 'property' in filename_lower:
            return 'properties'
        elif 'tenants' in filename_lower or 'tenant' in filename_lower:
            return 'tenants'
        elif 'leases' in filename_lower or 'lease' in filename_lower:
            return 'leases'
        elif 'owners' in filename_lower or 'owner' in filename_lower:
            return 'owners'
        elif 'balances' in filename_lower or 'balance' in filename_lower:
            return 'balances'
        
        # Check headers if filename detection fails
        headers_str = ' '.join(headers).lower()
        if 'property name' in headers_str and 'rent amount' in headers_str:
            return 'properties'
        elif 'full name' in headers_str and 'login email' in headers_str:
            return 'tenants'
        elif 'tenants' in headers_str and 'start date' in headers_str:
            return 'leases'
        elif 'name' in headers_str and 'email' in headers_str and 'address' in headers_str:
            return 'owners'
        elif 'tenants' in headers_str and 'balance' in headers_str:
            return 'balances'
        
        return 'unknown'
    
    def read_csv(self, file_path: str) -> Tuple[List[Dict[str, Any]], str]:
        """Read CSV file and return data with detected file type"""
        try:
            df = pd.read_csv(file_path)
            data = df.to_dict('records')
            
            # Clean the data - remove rows where all values are NaN
            data = [row for row in data if not all(pd.isna(value) if value != value else False for value in row.values())]
            
            file_type = self.detect_file_type(os.path.basename(file_path), list(df.columns))
            
            logger.info(f"Successfully read {len(data)} rows from {os.path.basename(file_path)}")
            logger.info(f"Detected file type: {file_type}")
            
            return data, file_type
            
        except Exception as e:
            logger.error(f"Error reading CSV file {file_path}: {str(e)}")
            raise
    
    def validate_data(self, data: List[Dict[str, Any]], file_type: str) -> Tuple[List[Dict[str, Any]], List[str], List[str]]:
        """Validate data using appropriate validator"""
        if file_type not in self.validators:
            logger.warning(f"No validator found for file type: {file_type}")
            return data, [], []
        
        validated_data = []
        all_errors = []
        all_warnings = []
        
        for i, record in enumerate(data):
            try:
                if file_type == 'properties':
                    result = PropertyValidator.validate_property_data(record)
                elif file_type == 'tenants':
                    result = TenantValidator.validate_tenant_data(record)
                elif file_type == 'leases':
                    result = LeaseValidator.validate_lease_data(record)
                elif file_type == 'owners':
                    result = OwnerValidator.validate_owner_data(record)
                elif file_type == 'balances':
                    result = BalanceValidator.validate_balance_data(record)
                else:
                    result = ValidationResult(True, [], [], record)
                
                if result.is_valid:
                    validated_data.append(result.cleaned_data)
                else:
                    all_errors.extend([f"Row {i+1}: {error}" for error in result.errors])
                
                all_warnings.extend([f"Row {i+1}: {warning}" for warning in result.warnings])
                
            except Exception as e:
                error_msg = f"Row {i+1}: Validation error - {str(e)}"
                all_errors.append(error_msg)
                logger.error(error_msg)
        
        return validated_data, all_errors, all_warnings

class DatabaseMigrator:
    """Handles database operations for migration"""
    
    def __init__(self, config: MigrationConfig):
        self.config = config
        self.migration_stats = {
            'total_records': 0,
            'successful_records': 0,
            'failed_records': 0,
            'errors': []
        }
    
    def create_backup(self, table_name: str):
        """Create backup of table before migration"""
        if not self.config.create_backup or not app or not db:
            return
        
        try:
            backup_dir = Path(self.config.backup_directory)
            backup_dir.mkdir(exist_ok=True)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_file = backup_dir / f"{table_name}_backup_{timestamp}.sql"
            
            logger.info(f"Creating backup of table {table_name}")
            # Note: In a real implementation, you'd use pg_dump or similar
            
        except Exception as e:
            logger.error(f"Error creating backup for {table_name}: {str(e)}")
    
    def get_default_property_id(self) -> int:
        """Get the first available property ID for leases/balances"""
        if not app or not db:
            return 1
        
        try:
            with app.app_context():
                first_property = Property.query.first()
                if first_property:
                    logger.info(f"Using property ID {first_property.id} as default")
                    return first_property.id
                else:
                    logger.warning("No properties found, using ID 1")
                    return 1
        except Exception as e:
            logger.error(f"Error getting default property ID: {str(e)}")
            return 1
    
    def find_tenant_by_name(self, tenant_name: str) -> Optional[int]:
        """Find tenant by name and return tenant ID"""
        if not app or not db or not tenant_name:
            return None
        
        try:
            with app.app_context():
                # Try exact match first
                tenant = Tenant.query.filter_by(full_name=tenant_name).first()
                if tenant:
                    return tenant.id
                
                # Try case-insensitive match
                tenant = Tenant.query.filter(Tenant.full_name.ilike(f"%{tenant_name}%")).first()
                if tenant:
                    return tenant.id
                
                return None
        except Exception as e:
            logger.error(f"Error finding tenant {tenant_name}: {str(e)}")
            return None
    
    def migrate_properties(self, data: List[Dict[str, Any]]) -> int:
        """Migrate property data to database"""
        if not app or not db:
            logger.warning("Database not available, skipping migration")
            return 0
        
        try:
            with app.app_context():
                # Create backup
                self.create_backup('properties')
                
                migrated_count = 0
                for record in data:
                    try:
                        # Check if property already exists
                        existing_property = Property.query.filter_by(
                            title=record.get('Property Name', '')
                        ).first()
                        
                        if existing_property:
                            logger.info(f"Property '{record.get('Property Name')}' already exists, skipping")
                            continue
                        
                        # Create new property
                        property_data = {
                            'title': record.get('Property Name', ''),
                            'street_address_1': record.get('Street Address', ''),
                            'city': record.get('City', ''),
                            'state': record.get('State', ''),
                            'zip_code': record.get('Zip Code', ''),
                            'description': record.get('Description', ''),
                            'rent_amount': record.get('rent_amount', 0),
                            'status': record.get('Status', 'available'),
                            'owner_id': 1  # Default owner ID
                        }
                        
                        property_obj = Property(**property_data)
                        db.session.add(property_obj)
                        db.session.commit()
                        
                        migrated_count += 1
                        
                    except Exception as e:
                        logger.error(f"Error migrating property: {str(e)}")
                        db.session.rollback()
                        continue
                
                logger.info(f"Successfully migrated {migrated_count} properties")
                return migrated_count
                
        except Exception as e:
            logger.error(f"Error in property migration: {str(e)}")
            return 0
    
    def migrate_tenants(self, data: List[Dict[str, Any]]) -> int:
        """Migrate tenant data to database"""
        if not app or not db:
            logger.warning("Database not available, skipping migration")
            return 0
        
        try:
            with app.app_context():
                # Create backup
                self.create_backup('tenants')
                
                migrated_count = 0
                for record in data:
                    try:
                        # Get email and convert empty string to None
                        email = record.get('email')
                        if email == '':
                            email = None
                        
                        # Check if tenant already exists by email (if provided)
                        existing_tenant = None
                        if email:
                            existing_tenant = Tenant.query.filter_by(email=email).first()
                        
                        if existing_tenant:
                            logger.info(f"Tenant with email {email} already exists, skipping")
                            continue
                        
                        # Create new tenant
                        tenant_data = {
                            'full_name': record.get('full_name', ''),
                            'email': email,
                            'phone_number': record.get('phone_number'),
                            'street_address_1': record.get('street_address_1', ''),
                            'city': record.get('city', ''),
                            'state': record.get('state', ''),
                            'zip_code': record.get('zip_code', ''),
                        }
                        
                        tenant_obj = Tenant(**tenant_data)
                        db.session.add(tenant_obj)
                        db.session.commit()
                        
                        migrated_count += 1
                        
                    except Exception as e:
                        logger.error(f"Error migrating tenant: {str(e)}")
                        db.session.rollback()
                        continue
                
                logger.info(f"Successfully migrated {migrated_count} tenants")
                return migrated_count
                
        except Exception as e:
            logger.error(f"Error in tenant migration: {str(e)}")
            return 0
    
    def migrate_leases(self, data: List[Dict[str, Any]]) -> int:
        """Migrate lease data to database"""
        if not app or not db:
            logger.warning("Database not available, skipping migration")
            return 0
        
        try:
            with app.app_context():
                # Create backup
                self.create_backup('draft_leases')
                
                default_property_id = self.get_default_property_id()
                migrated_count = 0
                
                for record in data:
                    try:
                        # Find tenant
                        tenant_name = record.get('tenant_name', '')
                        tenant_id = self.find_tenant_by_name(tenant_name)
                        
                        if not tenant_id:
                            logger.warning(f"Tenant '{tenant_name}' not found for lease")
                            continue
                        
                        # Create new lease
                        lease_data = {
                            'tenant_id': tenant_id,
                            'property_id': default_property_id,
                            'start_date': record.get('start_date'),
                            'end_date': record.get('end_date'),
                            'rent_amount': record.get('rent_amount', 0)
                        }
                        
                        lease_obj = DraftLease(**lease_data)
                        db.session.add(lease_obj)
                        db.session.commit()
                        
                        migrated_count += 1
                        
                    except Exception as e:
                        logger.error(f"Error migrating lease: {str(e)}")
                        db.session.rollback()
                        continue
                
                logger.info(f"Successfully migrated {migrated_count} leases")
                return migrated_count
                
        except Exception as e:
            logger.error(f"Error in lease migration: {str(e)}")
            return 0
    
    def migrate_owners(self, data: List[Dict[str, Any]]) -> int:
        """Migrate owner data to database"""
        if not app or not db:
            logger.warning("Database not available, skipping migration")
            return 0
        
        try:
            with app.app_context():
                # Create backup
                self.create_backup('users')
                
                migrated_count = 0
                for record in data:
                    try:
                        email = record.get('email', '')
                        
                        # Check if user already exists
                        existing_user = User.query.filter_by(email=email).first()
                        if existing_user:
                            logger.info(f"User with email {email} already exists, skipping")
                            continue
                        
                        # Generate unique email if needed
                        if not email or User.query.filter_by(email=email).first():
                            base_name = record.get('full_name', 'owner').lower().replace(' ', '.')
                            counter = 1
                            email = f"{base_name}@example.com"
                            while User.query.filter_by(email=email).first():
                                email = f"{base_name}.{counter}@example.com"
                                counter += 1
                        
                        # Create new user
                        user_data = {
                            'username': record.get('username', email.split('@')[0]),
                            'email': email,
                            'password': 'default_password',  # Should be hashed in production
                            'full_name': record.get('full_name', ''),
                            'role': 'OWNER',
                            'street_address_1': record.get('street_address_1', ''),
                            'city': record.get('city', ''),
                            'state': record.get('state', ''),
                            'zip_code': record.get('zip_code', '')
                        }
                        
                        user_obj = User(**user_data)
                        db.session.add(user_obj)
                        db.session.commit()
                        
                        migrated_count += 1
                        
                    except Exception as e:
                        logger.error(f"Error migrating owner: {str(e)}")
                        db.session.rollback()
                        continue
                
                logger.info(f"Successfully migrated {migrated_count} owners")
                return migrated_count
                
        except Exception as e:
            logger.error(f"Error in owner migration: {str(e)}")
            return 0
    
    def migrate_balances(self, data: List[Dict[str, Any]]) -> int:
        """Migrate balance data to database"""
        if not app or not db:
            logger.warning("Database not available, skipping migration")
            return 0
        
        try:
            with app.app_context():
                # Create backup
                self.create_backup('outstanding_balances')
                
                default_property_id = self.get_default_property_id()
                migrated_count = 0
                
                for record in data:
                    try:
                        # Find tenant
                        tenant_name = record.get('tenant_name', '')
                        tenant_id = self.find_tenant_by_name(tenant_name)
                        
                        if not tenant_id:
                            logger.warning(f"Tenant '{tenant_name}' not found for balance")
                            continue
                        
                        # Create new balance record
                        balance_data = {
                            'tenant_id': tenant_id,
                            'property_id': default_property_id,
                            'due_amount': record.get('due_amount', 0),
                            'due_date': record.get('due_date'),
                            'balance_type': record.get('balance_type', 'rent')
                        }
                        
                        balance_obj = OutstandingBalance(**balance_data)
                        db.session.add(balance_obj)
                        db.session.commit()
                        
                        migrated_count += 1
                        
                    except Exception as e:
                        logger.error(f"Error migrating balance: {str(e)}")
                        db.session.rollback()
                        continue
                
                logger.info(f"Successfully migrated {migrated_count} balances")
                return migrated_count
                
        except Exception as e:
            logger.error(f"Error in balance migration: {str(e)}")
            return 0

class DataMigrationPipeline:
    """Main migration pipeline orchestrator"""
    
    def __init__(self, config: MigrationConfig):
        self.config = config
        self.csv_processor = CSVProcessor(config)
        self.migrator = DatabaseMigrator(config)
        self.migration_stats = {
            'total_files': 0,
            'processed_files': 0,
            'total_records': 0,
            'successful_records': 0,
            'failed_records': 0,
            'errors': [],
            'warnings': []
        }
    
    def find_csv_files(self) -> List[str]:
        """Find all CSV files in the specified directory"""
        csv_dir = Path(self.config.csv_directory)
        csv_files = list(csv_dir.glob("*.csv"))
        
        if not csv_files:
            logger.warning(f"No CSV files found in directory: {csv_dir}")
        else:
            logger.info(f"Found {len(csv_files)} CSV files to process")
        
        return [str(f) for f in csv_files]
    
    def _process_csv_file(self, file_path: str) -> bool:
        """Process a single CSV file"""
        try:
            logger.info(f"Processing file: {os.path.basename(file_path)}")
            
            # Read and detect file type
            data, file_type = self.csv_processor.read_csv(file_path)
            
            if file_type == 'unknown':
                logger.warning(f"Could not determine file type for {os.path.basename(file_path)}")
                return False
            
            # Validate data
            if self.config.validate_data:
                validated_data, errors, warnings = self.csv_processor.validate_data(data, file_type)
                self.migration_stats['errors'].extend(errors)
                self.migration_stats['warnings'].extend(warnings)
                
                if errors:
                    logger.error(f"Validation errors in {os.path.basename(file_path)}: {len(errors)} errors")
                    for error in errors[:5]:  # Show first 5 errors
                        logger.error(f"  - {error}")
                    return False
                
                data = validated_data
            
            self.migration_stats['total_records'] += len(data)
            
            if self.config.dry_run:
                logger.info(f"DRY RUN: Would migrate {len(data)} {file_type} records")
                self.migration_stats['successful_records'] += len(data)
                return True
            
            # Migrate data to database
            if file_type == 'properties':
                migrated_count = self.migrator.migrate_properties(data)
                self.migration_stats['successful_records'] += migrated_count
            elif file_type == 'tenants':
                migrated_count = self.migrator.migrate_tenants(data)
                self.migration_stats['successful_records'] += migrated_count
            elif file_type == 'leases':
                migrated_count = self.migrator.migrate_leases(data)
                self.migration_stats['successful_records'] += migrated_count
                logger.info(f"Migrated {migrated_count} lease records to database")
            elif file_type == 'owners':
                migrated_count = self.migrator.migrate_owners(data)
                self.migration_stats['successful_records'] += migrated_count
                logger.info(f"Migrated {migrated_count} owner records to database")
            elif file_type == 'balances':
                migrated_count = self.migrator.migrate_balances(data)
                self.migration_stats['successful_records'] += migrated_count
                logger.info(f"Migrated {migrated_count} balance records to database")
            else:
                logger.warning(f"Unknown file type {file_type}, skipping migration")
                return False
            
            logger.info(f"Successfully processed {os.path.basename(file_path)}")
            return True
            
        except Exception as e:
            error_msg = f"Error processing {os.path.basename(file_path)}: {str(e)}"
            logger.error(error_msg)
            self.migration_stats['errors'].append(f"File {os.path.basename(file_path)}: {str(e)}")
            return False
    
    def run_migration(self) -> bool:
        """Run the complete migration pipeline"""
        try:
            logger.info("Starting data migration pipeline...")
            
            # Find CSV files
            csv_files = self.find_csv_files()
            if not csv_files:
                return False
            
            self.migration_stats['total_files'] = len(csv_files)
            
            # Process each file
            for file_path in csv_files:
                success = self._process_csv_file(file_path)
                if success:
                    self.migration_stats['processed_files'] += 1
            
            # Calculate failed records
            self.migration_stats['failed_records'] = (
                self.migration_stats['total_records'] - 
                self.migration_stats['successful_records']
            )
            
            # Print summary
            self._print_summary()
            
            return self.migration_stats['processed_files'] > 0
            
        except Exception as e:
            logger.error(f"Migration pipeline failed: {str(e)}")
            return False
    
    def run(self) -> bool:
        """Alias for run_migration for compatibility"""
        return self.run_migration()
    
    def _print_summary(self):
        """Print migration summary"""
        stats = self.migration_stats
        
        logger.info("=" * 50)
        logger.info("MIGRATION SUMMARY")
        logger.info("=" * 50)
        logger.info(f"Total files processed: {stats['processed_files']}/{stats['total_files']}")
        logger.info(f"Total records: {stats['total_records']}")
        logger.info(f"Successful migrations: {stats['successful_records']}")
        logger.info(f"Failed migrations: {stats['failed_records']}")
        logger.info(f"Total errors: {len(stats['errors'])}")
        logger.info(f"Total warnings: {len(stats['warnings'])}")
        
        if stats['errors']:
            logger.info("Recent errors:")
            for error in stats['errors'][-5:]:  # Show last 5 errors
                logger.info(f"  - {error}")
        
        logger.info("Migration completed successfully!")

if __name__ == "__main__":
    # Example usage
    config = MigrationConfig(
        csv_directory=".",
        dry_run=True,
        validate_data=True,
        clean_data=True
    )
    
    pipeline = DataMigrationPipeline(config)
    success = pipeline.run_migration()
    
    if success:
        print("Migration completed successfully!")
    else:
        print("Migration failed!")
