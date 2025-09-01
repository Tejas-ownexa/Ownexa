#!/usr/bin/env python3
"""
Excel Data Migration Pipeline for Property Management System
Handles Excel files with property data and converts them to database format
"""

import os
import sys
import logging
import pandas as pd
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from typing import Dict, List, Any, Optional, Tuple
import re
from pathlib import Path
import json

# Add project root to path for imports
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.dirname(project_root))

# Import DataCleaner
from pipeline.data_cleaner import DataCleaner

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('excel_migration.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Import project modules
try:
    from config import app, db
    from models import Property, RentalOwner, Tenant, LeaseAgreement
    logger.info("Successfully imported Flask app and models")
except ImportError as e:
    logger.warning(f"Could not import models: {e}. Running in standalone mode.")
    app = None
    db = None

class ExcelPropertyMapper:
    """Maps Excel property data to database fields"""
    
    @staticmethod
    def map_property_data(row: pd.Series, file_type: str, column_mapping: Dict[str, str]) -> Dict[str, Any]:
        """Map Excel row to property database fields using column mapping"""
        
        # Helper function to get value from row using mapping
        def get_mapped_value(field: str, default: Any = '') -> Any:
            col = column_mapping.get(field)
            return str(row.get(col, default)) if col and pd.notna(row.get(col)) else default
        
        # Get property ID for title
        property_id = get_mapped_value('property_id', 'Unknown')
        
        # Extract address components
        address = get_mapped_value('address')
        address_parts = address.split('\n') if address else []
        
        # Get address components
        street_address = address_parts[0] if len(address_parts) > 0 else address
        
        # Get location data
        city = get_mapped_value('city')
        state = get_mapped_value('state')
        zip_code = get_mapped_value('zip')
        
        # If address contains city/state/zip, parse it
        if len(address_parts) > 1 and not (city and state and zip_code):
            city_state_zip = address_parts[1]
            parts = city_state_zip.split()
            if len(parts) >= 2:
                if not city:
                    city = ' '.join(parts[:-2])
                if not state:
                    state = parts[-2] if len(parts) >= 2 else ''
                if not zip_code:
                    zip_code = parts[-1] if len(parts) >= 1 else ''
        
        # Get rent amount (required field)
        rent_amount = ExcelPropertyMapper._clean_currency(get_mapped_value('rent_amount'))
        if not rent_amount:
            rent_amount = Decimal('0.00')  # Default value for required field
        
        # Get description (required field)
        description = get_mapped_value('description')
        if not description.strip():
            description = f"{file_type} property at {street_address}"  # Default description
        
        # Get status or default to available
        status = get_mapped_value('status', 'available').lower()
        if status not in ['available', 'rented', 'maintenance', 'sold']:
            status = 'available'
        
        # Extract property information
        property_data = {
            'title': f"{file_type} {property_id}",
            'street_address_1': street_address,
            'city': city,
            'state': state,
            'zip_code': zip_code,
            'description': description,
            'rent_amount': rent_amount,  # Required field
            'status': status,  # Required field with default
            'owner_id': 1,  # Required field - default to user ID 1
            # Optional fields
            'street_address_2': '',
            'apt_number': '',
            'image_url': '',
            # Financial fields (optional)
            'purchase_price': ExcelPropertyMapper._clean_currency(get_mapped_value('purchase_price')),
            'external_id': property_id if property_id != 'Unknown' else ''
        }
        
        return property_data
    
    @staticmethod
    def _clean_currency(value) -> Optional[Decimal]:
        """Clean and convert currency values"""
        if pd.isna(value) or value == '':
            return None
        
        try:
            # Remove currency symbols and commas
            if isinstance(value, str):
                value = re.sub(r'[$,]', '', value.strip())
            
            # Convert to Decimal
            return Decimal(str(value))
        except (InvalidOperation, ValueError):
            return None

class ExcelMigrationPipeline:
    """Main Excel migration pipeline"""
    
    def __init__(self, dry_run=False, validate_data=True, clean_data=True):
        self.dry_run = dry_run
        self.validate_data = validate_data
        self.clean_data = clean_data
        self.data_cleaner = DataCleaner()
        self.results = {
            'total_files': 0,
            'processed_files': 0,
            'total_properties': 0,
            'successful_properties': 0,
            'failed_properties': 0,
            'errors': [],
            'warnings': []
        }
    
    def process_excel_file(self, file_path: str) -> Dict[str, Any]:
        """Process a single Excel file"""
        logger.info(f"Processing Excel file: {file_path}")
        
        try:
            # First try to detect the header row
            header_row = self._detect_header_row(file_path)
            logger.info(f"Detected header row at index: {header_row}")
            
            # Read Excel file with detected header
            df = pd.read_excel(file_path, header=header_row)
            
            # Clean column names
            df.columns = [str(col).strip().lower().replace(' ', '_') for col in df.columns]
            
            # Determine file type from filename
            file_type = self._determine_file_type(file_path)
            
            # Get column mapping for this file type
            column_mapping = self._get_column_mapping(df.columns, file_type)
            if not column_mapping:
                error_msg = f"Could not determine column mapping for file type: {file_type}"
                self.results['errors'].append(error_msg)
                logger.error(error_msg)
                return {
                    'file_path': file_path,
                    'error': error_msg,
                    'properties': []
                }
            
            # Process properties
            properties = []
            for index, row in df.iterrows():
                if pd.notna(row.get(column_mapping.get('property_id', 'id'))) and str(row.get(column_mapping.get('property_id', 'id'))).strip() != 'nan':
                    try:
                        # Map data using the column mapping
                        property_data = ExcelPropertyMapper.map_property_data(row, file_type, column_mapping)
                        
                        if self.clean_data:
                            property_data = self.data_cleaner.clean_property_data(property_data)
                        
                        if self.validate_data:
                            validation_result = self._validate_property_data(property_data)
                            if not validation_result['is_valid']:
                                self.results['errors'].extend(validation_result['errors'])
                                self.results['failed_properties'] += 1
                                continue
                        
                        properties.append(property_data)
                        self.results['successful_properties'] += 1
                        
                    except Exception as e:
                        error_msg = f"Error processing row {index}: {str(e)}"
                        self.results['errors'].append(error_msg)
                        self.results['failed_properties'] += 1
                        logger.error(error_msg)
            
            self.results['total_properties'] += len(df)
            self.results['processed_files'] += 1
            
            return {
                'file_path': file_path,
                'file_type': file_type,
                'properties': properties,
                'total_rows': len(df),
                'successful_properties': len(properties)
            }
            
        except Exception as e:
            error_msg = f"Error processing file {file_path}: {str(e)}"
            self.results['errors'].append(error_msg)
            logger.error(error_msg)
            return {
                'file_path': file_path,
                'error': error_msg,
                'properties': []
            }
    
    def _detect_header_row(self, file_path: str) -> int:
        """
        Detect the header row in an Excel file by looking for common column names
        Returns the index of the header row (0-based)
        """
        # Read first 10 rows to find header
        df = pd.read_excel(file_path, header=None, nrows=10)
        
        # Common column names to look for (case insensitive)
        header_indicators = [
            'property', 'address', 'city', 'state', 'zip', 'rent',
            'price', 'status', 'description', 'id', 'type', 'owner'
        ]
        
        # Check each row for header indicators
        for idx in range(len(df)):
            row_values = [str(val).strip().lower() for val in df.iloc[idx] if pd.notna(val)]
            matches = sum(1 for val in row_values if any(ind in val for ind in header_indicators))
            if matches >= 3:  # If we find 3 or more matches, consider it a header row
                return idx
        
        return 0  # Default to first row if no header found
    
    def _get_column_mapping(self, columns: List[str], file_type: str) -> Dict[str, str]:
        """
        Get column mapping based on file type and actual columns in the file
        Returns a dictionary mapping standard field names to actual column names
        """
        # Standard mappings for different file types
        type_mappings = {
            'ATK': {
                'property_id': ['id', 'property_id', 'property_number', 'number'],
                'address': ['address', 'property_address', 'location'],
                'city': ['city', 'property_city'],
                'state': ['state', 'property_state'],
                'zip': ['zip', 'zip_code', 'postal_code'],
                'purchase_price': ['purchase_price', 'price', 'cost'],
                'rent_amount': ['rent', 'rent_amount', 'monthly_rent'],
                'description': ['description', 'property_description', 'details'],
                'status': ['status', 'property_status', 'condition']
            },
            'KT': {
                'property_id': ['id', 'property_id', 'kt_number'],
                'address': ['address', 'property_address'],
                'city': ['city', 'property_city'],
                'state': ['state', 'property_state'],
                'zip': ['zip', 'zip_code'],
                'purchase_price': ['purchase_price', 'acquisition_cost'],
                'rent_amount': ['rent', 'monthly_rent'],
                'description': ['description', 'notes'],
                'status': ['status', 'current_status']
            },
            'RAS': {
                'property_id': ['id', 'property_id', 'ras_number'],
                'address': ['address', 'street_address'],
                'city': ['city'],
                'state': ['state'],
                'zip': ['zip', 'postal'],
                'purchase_price': ['purchase_price', 'cost'],
                'rent_amount': ['rent', 'rental_amount'],
                'description': ['description', 'property_notes'],
                'status': ['status', 'availability']
            }
        }
        
        # Get default mapping for unknown file types
        default_mapping = type_mappings.get('ATK')  # Use ATK as default
        type_mapping = type_mappings.get(file_type, default_mapping)
        
        # Build actual mapping based on file columns
        column_mapping = {}
        columns_lower = [col.lower() for col in columns]
        
        for field, possible_names in type_mapping.items():
            # Find first matching column name
            for name in possible_names:
                matches = [col for col in columns_lower if name in col]
                if matches:
                    column_mapping[field] = columns[columns_lower.index(matches[0])]
                    break
        
        return column_mapping if len(column_mapping) >= 4 else None  # Require at least 4 mapped fields
    
    def _determine_file_type(self, file_path: str) -> str:
        """Determine the type of property file based on filename"""
        filename = os.path.basename(file_path).upper()
        
        if 'ATK' in filename:
            return 'ATK'
        elif 'KT' in filename:
            return 'KT'
        elif 'RAS' in filename:
            return 'RAS'
        elif 'COMPRA' in filename or 'FECHAS' in filename:
            return 'ATK_COMM'
        else:
            return 'UNKNOWN'
    
    def _validate_property_data(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate property data with detailed error messages"""
        errors = []
        warnings = []
        
        # Required fields validation with detailed messages
        required_fields = {
            'title': "Property title",
            'street_address_1': "Street address",
            'rent_amount': "Rent amount",
            'status': "Property status"
        }
        
        for field, label in required_fields.items():
            if not property_data.get(field):
                errors.append(f"{label} is required but was not provided")
        
        # Address validation
        if property_data.get('street_address_1'):
            if len(property_data['street_address_1']) < 5:
                warnings.append("Street address seems too short, please verify")
            if not any(char.isdigit() for char in property_data['street_address_1']):
                warnings.append("Street address should typically include a number")
        
        # Location validation
        if not property_data.get('city'):
            warnings.append("City is missing - this may affect property visibility in searches")
        
        if not property_data.get('state'):
            warnings.append("State is missing - this may affect property visibility in searches")
            
        if property_data.get('zip_code'):
            if not re.match(r'^\d{5}(-\d{4})?$', str(property_data['zip_code']).strip()):
                warnings.append("ZIP code format is invalid (should be 5 digits or ZIP+4)")
        else:
            warnings.append("ZIP code is missing - this may affect property visibility in searches")
        
        # Financial validation
        if property_data.get('rent_amount'):
            if not isinstance(property_data['rent_amount'], (int, float, Decimal)):
                errors.append("Rent amount must be a number")
            elif property_data['rent_amount'] <= 0:
                errors.append("Rent amount must be greater than zero")
            elif property_data['rent_amount'] > 100000:
                warnings.append("Rent amount seems unusually high, please verify")
        
        if property_data.get('purchase_price'):
            if not isinstance(property_data['purchase_price'], (int, float, Decimal)):
                errors.append("Purchase price must be a number")
            elif property_data['purchase_price'] <= 0:
                warnings.append("Purchase price should be greater than zero")
        
        # Status validation
        valid_statuses = ['available', 'rented', 'maintenance', 'sold']
        if property_data.get('status') and property_data['status'].lower() not in valid_statuses:
            errors.append(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
        
        # Description validation
        if property_data.get('description'):
            if len(property_data['description']) < 10:
                warnings.append("Description is very short - consider adding more details")
            elif len(property_data['description']) > 1000:
                warnings.append("Description is very long - consider shortening it")
        
        # External ID validation
        if property_data.get('external_id'):
            if not isinstance(property_data['external_id'], str):
                warnings.append("External ID should be a string")
            elif len(property_data['external_id']) > 50:
                warnings.append("External ID is unusually long")
        
        return {
            'is_valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'property_id': property_data.get('external_id') or property_data.get('title', 'Unknown')
        }
    
    def save_to_database(self, properties: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Save properties to database with improved transaction handling and duplicate checking"""
        if self.dry_run:
            logger.info(f"DRY RUN: Would save {len(properties)} properties to database")
            return {
                'saved': 0,
                'skipped': 0,
                'failed': 0,
                'dry_run': True,
                'errors': [],
                'warnings': []
            }
        
        if not app or not db:
            logger.error("Flask app or database not available")
            return {
                'saved': 0,
                'skipped': 0,
                'failed': 0,
                'error': 'Database not available',
                'errors': ['Database connection not available'],
                'warnings': []
            }
        
        saved_count = 0
        skipped_count = 0
        failed_count = 0
        errors = []
        warnings = []
        property_objects = []
        
        try:
            # Use the current Flask app context
            from flask import current_app
            current_app.app_context().push()
            
            # First pass: Check for duplicates and validate all properties
            existing_properties = {}
            titles_to_check = [p['title'] for p in properties]
            addresses_to_check = [p['street_address_1'] for p in properties]
            
            # Batch query existing properties
            existing_by_title = Property.query.filter(Property.title.in_(titles_to_check)).all()
            existing_by_address = Property.query.filter(Property.street_address_1.in_(addresses_to_check)).all()
            
            # Create lookup dictionaries
            for prop in existing_by_title:
                existing_properties[prop.title] = prop
            for prop in existing_by_address:
                existing_properties[prop.street_address_1] = prop
            
            # Process each property
            for property_data in properties:
                try:
                    # Check for duplicates
                    duplicate = False
                    if property_data['title'] in existing_properties:
                        warnings.append(f"Property with title '{property_data['title']}' already exists, skipping")
                        skipped_count += 1
                        duplicate = True
                    elif property_data['street_address_1'] in existing_properties:
                        warnings.append(f"Property at address '{property_data['street_address_1']}' already exists, skipping")
                        skipped_count += 1
                        duplicate = True
                    
                    if duplicate:
                        continue
                    
                    # Create property fields dictionary
                    property_fields = {
                        # Required fields
                        'title': property_data['title'],
                        'street_address_1': property_data['street_address_1'],
                        'description': property_data['description'],
                        'rent_amount': property_data['rent_amount'],
                        'status': property_data['status'],
                        'owner_id': property_data['owner_id'],
                        # Optional fields with defaults
                        'city': property_data.get('city', ''),
                        'state': property_data.get('state', ''),
                        'zip_code': property_data.get('zip_code', ''),
                        'street_address_2': property_data.get('street_address_2', ''),
                        'apt_number': property_data.get('apt_number', ''),
                        'image_url': property_data.get('image_url', ''),
                        'purchase_price': property_data.get('purchase_price'),
                        'external_id': property_data.get('external_id', '')
                    }
                    
                    # Create property object but don't add to session yet
                    property_obj = Property(**property_fields)
                    property_objects.append(property_obj)
                    
                except Exception as e:
                    error_msg = f"Error preparing property {property_data.get('title', 'Unknown')}: {str(e)}"
                    errors.append(error_msg)
                    failed_count += 1
                    logger.error(error_msg)
            
            # If we have valid properties to save, start a transaction
            if property_objects:
                try:
                    # Begin transaction
                    db.session.begin_nested()
                    
                    # Add all properties in bulk
                    db.session.bulk_save_objects(property_objects)
                    
                    # Commit the transaction
                    db.session.commit()
                    saved_count = len(property_objects)
                    logger.info(f"Successfully saved {saved_count} properties to database")
                    
                except Exception as e:
                    # Roll back the nested transaction
                    db.session.rollback()
                    error_msg = f"Database error during bulk save: {str(e)}"
                    errors.append(error_msg)
                    failed_count = len(property_objects)
                    saved_count = 0
                    logger.error(error_msg)
            
        except Exception as e:
            # Roll back the main transaction
            db.session.rollback()
            error_msg = f"Critical database error: {str(e)}"
            errors.append(error_msg)
            failed_count = len(properties)
            saved_count = 0
            logger.error(error_msg)
        
        return {
            'saved': saved_count,
            'skipped': skipped_count,
            'failed': failed_count,
            'total_processed': len(properties),
            'errors': errors,
            'warnings': warnings,
            'dry_run': False
        }
    
    def get_results(self) -> Dict[str, Any]:
        """Get migration results"""
        return self.results.copy()

def process_excel_files(file_paths: List[str], dry_run=False, validate_data=True, clean_data=True) -> Dict[str, Any]:
    """Process multiple Excel files"""
    pipeline = ExcelMigrationPipeline(dry_run=dry_run, validate_data=validate_data, clean_data=clean_data)
    
    all_properties = []
    file_results = []
    
    for file_path in file_paths:
        result = pipeline.process_excel_file(file_path)
        file_results.append(result)
        if 'properties' in result:
            all_properties.extend(result['properties'])
    
    # Save to database (only if not dry run)
    save_result = pipeline.save_to_database(all_properties)
    
    # Combine results
    final_results = pipeline.get_results()
    final_results.update(save_result)
    final_results['total_properties_processed'] = len(all_properties)
    final_results['file_results'] = file_results
    
    return final_results

if __name__ == "__main__":
    # Example usage
    test_files = [
        "../1 ATK PROPERTIES OCT 30  2024  (1) (1).xlsx",
        "../1 KT PROPERTIES 2025  (1) (1).xlsx",
        "../1 RAS PROPERTIES 2025.xlsx",
        "../PROPIEDADES COMPRA FECHAS.xlsx"
    ]
    
    results = process_excel_files(test_files, dry_run=True)
    print(json.dumps(results, indent=2, default=str))
