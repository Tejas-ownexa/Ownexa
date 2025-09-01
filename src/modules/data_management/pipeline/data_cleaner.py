#!/usr/bin/env python3
"""
Data Cleaning Utilities for the Migration Pipeline
Handles data transformation, cleaning, and standardization
"""

import re
import string
from typing import Any, Dict, List, Optional, Union
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
import unicodedata
import logging

logger = logging.getLogger(__name__)

class DataCleaner:
    """Main data cleaning class with various cleaning methods"""
    
    @staticmethod
    def clean_string(value: Any, 
                    trim_whitespace: bool = True,
                    remove_extra_spaces: bool = True,
                    convert_to_title_case: bool = False,
                    remove_special_chars: bool = False,
                    max_length: Optional[int] = None) -> str:
        """
        Clean string values with various options
        
        Args:
            value: Input value to clean
            trim_whitespace: Remove leading/trailing whitespace
            remove_extra_spaces: Remove multiple consecutive spaces
            convert_to_title_case: Convert to title case
            remove_special_chars: Remove special characters
            max_length: Maximum length of output string
            
        Returns:
            Cleaned string
        """
        if value is None:
            return ""
        
        # Convert to string
        cleaned = str(value)
        
        # Trim whitespace
        if trim_whitespace:
            cleaned = cleaned.strip()
        
        # Remove extra spaces
        if remove_extra_spaces:
            cleaned = re.sub(r'\s+', ' ', cleaned)
        
        # Convert to title case
        if convert_to_title_case:
            cleaned = cleaned.title()
        
        # Remove special characters
        if remove_special_chars:
            # Keep alphanumeric, spaces, and common punctuation
            cleaned = re.sub(r'[^\w\s\-\.\,\']', '', cleaned)
        
        # Truncate if max length specified
        if max_length and len(cleaned) > max_length:
            cleaned = cleaned[:max_length]
            logger.warning(f"String truncated to {max_length} characters")
        
        return cleaned
    
    @staticmethod
    def clean_property_data(property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Clean property data dictionary
        
        Args:
            property_data: Dictionary containing property data
            
        Returns:
            Cleaned property data dictionary
        """
        cleaned_data = {}
        
        for key, value in property_data.items():
            if key in ['title', 'street_address_1', 'street_address_2', 'city', 'state', 'description']:
                # Clean string fields
                cleaned_data[key] = DataCleaner.clean_string(
                    value, 
                    trim_whitespace=True,
                    remove_extra_spaces=True,
                    convert_to_title_case=False,
                    remove_special_chars=False
                )
            elif key in ['zip_code']:
                # Clean zip code - remove non-digits
                if value:
                    cleaned_data[key] = re.sub(r'\D', '', str(value))
                else:
                    cleaned_data[key] = value
            elif key in ['purchase_price', 'sale_price', 'rent_amount', 'annual_rent', 'hoa_fee', 'annual_hoa', 'property_tax']:
                # Clean currency fields
                cleaned_data[key] = DataCleaner.clean_currency(value)
            elif key in ['external_id']:
                # Clean external ID
                cleaned_data[key] = DataCleaner.clean_string(
                    value,
                    trim_whitespace=True,
                    remove_extra_spaces=True,
                    remove_special_chars=True
                )
            else:
                # Keep other fields as is
                cleaned_data[key] = value
        
        return cleaned_data
    
    @staticmethod
    def clean_email(email: str, 
                   convert_to_lowercase: bool = True,
                   remove_spaces: bool = True) -> str:
        """
        Clean email addresses
        
        Args:
            email: Email address to clean
            convert_to_lowercase: Convert to lowercase
            remove_spaces: Remove all spaces
            
        Returns:
            Cleaned email address
        """
        if not email:
            return ""
        
        cleaned = str(email).strip()
        
        if remove_spaces:
            cleaned = re.sub(r'\s+', '', cleaned)
        
        if convert_to_lowercase:
            cleaned = cleaned.lower()
        
        # Basic email validation
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, cleaned):
            logger.warning(f"Email format may be invalid: {cleaned}")
        
        return cleaned
    
    @staticmethod
    def clean_phone(phone: str,
                   remove_non_digits: bool = True,
                   format_phone: bool = True,
                   country_code: str = "US") -> str:
        """
        Clean phone numbers
        
        Args:
            phone: Phone number to clean
            remove_non_digits: Remove all non-digit characters
            format_phone: Format phone number
            country_code: Country code for formatting
            
        Returns:
            Cleaned phone number
        """
        if not phone:
            return ""
        
        cleaned = str(phone).strip()
        
        if remove_non_digits:
            # Remove all non-digit characters except + and -
            cleaned = re.sub(r'[^\d+\-\(\)\s]', '', cleaned)
            # Remove parentheses and spaces
            cleaned = re.sub(r'[\(\)\s]', '', cleaned)
        
        if format_phone and country_code == "US":
            # Format US phone numbers: (XXX) XXX-XXXX
            digits_only = re.sub(r'\D', '', cleaned)
            if len(digits_only) == 10:
                cleaned = f"({digits_only[:3]}) {digits_only[3:6]}-{digits_only[6:]}"
            elif len(digits_only) == 11 and digits_only[0] == '1':
                cleaned = f"+1 ({digits_only[1:4]}) {digits_only[4:7]}-{digits_only[7:]}"
        
        return cleaned
    
    @staticmethod
    def clean_address(address: str,
                     standardize_abbreviations: bool = True,
                     remove_extra_spaces: bool = True) -> str:
        """
        Clean address strings
        
        Args:
            address: Address to clean
            standardize_abbreviations: Standardize common abbreviations
            remove_extra_spaces: Remove multiple consecutive spaces
            
        Returns:
            Cleaned address
        """
        if not address:
            return ""
        
        cleaned = str(address).strip()
        
        if remove_extra_spaces:
            cleaned = re.sub(r'\s+', ' ', cleaned)
        
        if standardize_abbreviations:
            # Common address abbreviations
            abbreviations = {
                r'\bSt\b': 'Street',
                r'\bAve\b': 'Avenue',
                r'\bBlvd\b': 'Boulevard',
                r'\bDr\b': 'Drive',
                r'\bLn\b': 'Lane',
                r'\bRd\b': 'Road',
                r'\bCt\b': 'Court',
                r'\bPl\b': 'Place',
                r'\bCir\b': 'Circle',
                r'\bWay\b': 'Way',
                r'\bTer\b': 'Terrace',
                r'\bApt\b': 'Apartment',
                r'\bUnit\b': 'Unit',
                r'\bSte\b': 'Suite',
                r'\bFl\b': 'Floor',
                r'\bN\b': 'North',
                r'\bS\b': 'South',
                r'\bE\b': 'East',
                r'\bW\b': 'West',
                r'\bNE\b': 'Northeast',
                r'\bNW\b': 'Northwest',
                r'\bSE\b': 'Southeast',
                r'\bSW\b': 'Southwest',
            }
            
            for pattern, replacement in abbreviations.items():
                cleaned = re.sub(pattern, replacement, cleaned, flags=re.IGNORECASE)
        
        return cleaned
    
    @staticmethod
    def clean_currency(amount: Any,
                      remove_currency_symbols: bool = True,
                      remove_commas: bool = True,
                      remove_spaces: bool = True,
                      validate_decimal: bool = True) -> Optional[Decimal]:
        """
        Clean currency amounts
        
        Args:
            amount: Amount to clean
            remove_currency_symbols: Remove currency symbols
            remove_commas: Remove commas
            remove_spaces: Remove spaces
            validate_decimal: Validate decimal format
            
        Returns:
            Cleaned decimal amount or None if invalid
        """
        if amount is None:
            return None
        
        cleaned = str(amount).strip()
        
        if remove_currency_symbols:
            # Remove common currency symbols
            cleaned = re.sub(r'[\$\€\£\¥\₹]', '', cleaned)
        
        if remove_commas:
            cleaned = cleaned.replace(',', '')
        
        if remove_spaces:
            cleaned = cleaned.replace(' ', '')
        
        try:
            decimal_val = Decimal(cleaned)
            if validate_decimal:
                # Check if it's a reasonable amount
                if decimal_val < 0:
                    logger.warning(f"Negative amount found: {decimal_val}")
                if decimal_val > 1000000:  # $1M limit
                    logger.warning(f"Very large amount found: {decimal_val}")
            
            return decimal_val
            
        except (InvalidOperation, ValueError):
            logger.warning(f"Could not parse currency amount: {amount}")
            return None
    
    @staticmethod
    def clean_date(date_str: Any,
                  input_formats: Optional[List[str]] = None,
                  output_format: str = "%Y-%m-%d") -> Optional[date]:
        """
        Clean and parse date strings
        
        Args:
            date_str: Date string to clean
            input_formats: List of input date formats to try
            output_format: Output date format
            
        Returns:
            Parsed date object or None if invalid
        """
        if not date_str:
            return None
        
        if input_formats is None:
            input_formats = [
                '%m/%d/%Y', '%Y-%m-%d', '%m-%d-%Y',
                '%d/%m/%Y', '%Y/%m/%d', '%m/%d/%y',
                '%B %d, %Y', '%b %d, %Y',
                '%d %B %Y', '%d %b %Y'
            ]
        
        cleaned = str(date_str).strip()
        
        # Try to parse with different formats
        for fmt in input_formats:
            try:
                parsed_date = datetime.strptime(cleaned, fmt)
                return parsed_date.date()
            except ValueError:
                continue
        
        # Try to parse with dateutil if available
        try:
            from dateutil import parser
            parsed_date = parser.parse(cleaned)
            return parsed_date.date()
        except (ImportError, ValueError):
            pass
        
        logger.warning(f"Could not parse date: {date_str}")
        return None
    
    @staticmethod
    def clean_integer(value: Any,
                     allow_negative: bool = False,
                     min_value: Optional[int] = None,
                     max_value: Optional[int] = None) -> Optional[int]:
        """
        Clean integer values
        
        Args:
            value: Value to clean
            allow_negative: Allow negative values
            min_value: Minimum allowed value
            max_value: Maximum allowed value
            
        Returns:
            Cleaned integer or None if invalid
        """
        if value is None:
            return None
        
        try:
            # Try to convert to int
            cleaned = int(float(value))
            
            # Check negative
            if not allow_negative and cleaned < 0:
                logger.warning(f"Negative value not allowed: {cleaned}")
                return None
            
            # Check min/max bounds
            if min_value is not None and cleaned < min_value:
                logger.warning(f"Value below minimum {min_value}: {cleaned}")
                return None
            
            if max_value is not None and cleaned > max_value:
                logger.warning(f"Value above maximum {max_value}: {cleaned}")
                return None
            
            return cleaned
            
        except (ValueError, TypeError):
            logger.warning(f"Could not parse integer: {value}")
            return None
    
    @staticmethod
    def clean_boolean(value: Any,
                     true_values: Optional[List[str]] = None,
                     false_values: Optional[List[str]] = None) -> Optional[bool]:
        """
        Clean boolean values
        
        Args:
            value: Value to clean
            true_values: List of strings that represent True
            false_values: List of strings that represent False
            
        Returns:
            Cleaned boolean or None if ambiguous
        """
        if true_values is None:
            true_values = ['true', 'yes', '1', 'on', 'active', 'enabled']
        
        if false_values is None:
            false_values = ['false', 'no', '0', 'off', 'inactive', 'disabled']
        
        if value is None:
            return None
        
        cleaned = str(value).strip().lower()
        
        if cleaned in true_values:
            return True
        elif cleaned in false_values:
            return False
        else:
            logger.warning(f"Ambiguous boolean value: {value}")
            return None
    
    @staticmethod
    def clean_name(name: str,
                  title_case: bool = True,
                  remove_extra_spaces: bool = True,
                  standardize_suffixes: bool = True) -> str:
        """
        Clean person names
        
        Args:
            name: Name to clean
            title_case: Convert to title case
            remove_extra_spaces: Remove multiple spaces
            standardize_suffixes: Standardize name suffixes
            
        Returns:
            Cleaned name
        """
        if not name:
            return ""
        
        cleaned = str(name).strip()
        
        if remove_extra_spaces:
            cleaned = re.sub(r'\s+', ' ', cleaned)
        
        if standardize_suffixes:
            # Standardize common name suffixes
            suffixes = {
                r'\bJr\b': 'Jr.',
                r'\bSr\b': 'Sr.',
                r'\bII\b': 'II',
                r'\bIII\b': 'III',
                r'\bIV\b': 'IV',
                r'\bPhD\b': 'Ph.D.',
                r'\bMD\b': 'M.D.',
                r'\bEsq\b': 'Esq.',
            }
            
            for pattern, replacement in suffixes.items():
                cleaned = re.sub(pattern, replacement, cleaned, flags=re.IGNORECASE)
        
        if title_case:
            cleaned = cleaned.title()
        
        return cleaned
    
    @staticmethod
    def clean_postal_code(postal_code: str,
                          country: str = "US",
                          format_code: bool = True) -> str:
        """
        Clean postal codes
        
        Args:
            postal_code: Postal code to clean
            country: Country code
            format_code: Format the postal code
            
        Returns:
            Cleaned postal code
        """
        if not postal_code:
            return ""
        
        cleaned = str(postal_code).strip().upper()
        
        if country == "US":
            # Remove all non-alphanumeric characters
            cleaned = re.sub(r'[^\w]', '', cleaned)
            
            if format_code and len(cleaned) == 9:
                # Format as XXXXX-XXXX
                cleaned = f"{cleaned[:5]}-{cleaned[5:]}"
        
        return cleaned
    
    @staticmethod
    def clean_state(state: str,
                   standardize_abbreviations: bool = True,
                   country: str = "US") -> str:
        """
        Clean state/province names
        
        Args:
            state: State to clean
            standardize_abbreviations: Standardize abbreviations
            country: Country code
            
        Returns:
            Cleaned state
        """
        if not state:
            return ""
        
        cleaned = str(state).strip().upper()
        
        if country == "US" and standardize_abbreviations:
            # US state abbreviations
            state_mappings = {
                'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR',
                'CALIFORNIA': 'CA', 'COLORADO': 'CO', 'CONNECTICUT': 'CT', 'DELAWARE': 'DE',
                'FLORIDA': 'FL', 'GEORGIA': 'GA', 'HAWAII': 'HI', 'IDAHO': 'ID',
                'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA', 'KANSAS': 'KS',
                'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME', 'MARYLAND': 'MD',
                'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'MISSISSIPPI': 'MS',
                'MISSOURI': 'MO', 'MONTANA': 'MT', 'NEBRASKA': 'NE', 'NEVADA': 'NV',
                'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM', 'NEW YORK': 'NY',
                'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', 'OHIO': 'OH', 'OKLAHOMA': 'OK',
                'OREGON': 'OR', 'PENNSYLVANIA': 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
                'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN', 'TEXAS': 'TX', 'UTAH': 'UT',
                'VERMONT': 'VT', 'VIRGINIA': 'VA', 'WASHINGTON': 'WA', 'WEST VIRGINIA': 'WV',
                'WISCONSIN': 'WI', 'WYOMING': 'WY'
            }
            
            cleaned = state_mappings.get(cleaned, cleaned)
        
        return cleaned
    
    @staticmethod
    def clean_building_type(building_type: str,
                           standardize_types: bool = True) -> str:
        """
        Clean building type strings
        
        Args:
            building_type: Building type to clean
            standardize_types: Standardize building type names
            
        Returns:
            Cleaned building type
        """
        if not building_type:
            return ""
        
        cleaned = str(building_type).strip()
        
        if standardize_types:
            # Standardize building types
            type_mappings = {
                'Condo/Townhome': 'condo',
                'Single-Family': 'single_family',
                'Office': 'office',
                'Industrial': 'industrial',
                'Warehouse': 'warehouse',
                'Retail': 'retail',
                'Mixed Use': 'mixed_use',
                'Apartment': 'apartment',
                'Townhouse': 'townhouse',
                'Villa': 'villa',
                'Condo': 'condo',
                'Townhome': 'townhome',
                'Single Family': 'single_family',
                'Multi-Family': 'multi_family',
                'Commercial': 'commercial',
                'Residential': 'residential',
            }
            
            cleaned = type_mappings.get(cleaned, cleaned.lower().replace(' ', '_'))
        
        return cleaned
    
    @staticmethod
    def clean_unicode(text: str,
                     normalize: bool = True,
                     remove_accents: bool = False) -> str:
        """
        Clean Unicode text
        
        Args:
            text: Text to clean
            normalize: Normalize Unicode
            remove_accents: Remove accents
            
        Returns:
            Cleaned text
        """
        if not text:
            return ""
        
        cleaned = str(text)
        
        if normalize:
            cleaned = unicodedata.normalize('NFKC', cleaned)
        
        if remove_accents:
            # Remove accents but keep letters
            cleaned = ''.join(
                c for c in cleaned
                if not unicodedata.combining(c)
            )
        
        return cleaned
    
    @staticmethod
    def clean_record(record: Dict[str, Any],
                    field_mappings: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """
        Clean an entire record based on field mappings
        
        Args:
            record: Record to clean
            field_mappings: Field-specific cleaning rules
            
        Returns:
            Cleaned record
        """
        cleaned_record = {}
        
        for field_name, field_config in field_mappings.items():
            if field_name in record:
                value = record[field_name]
                data_type = field_config.get('data_type', 'string')
                
                try:
                    if data_type == 'string':
                        cleaned_value = DataCleaner.clean_string(
                            value,
                            **field_config.get('string_options', {})
                        )
                    elif data_type == 'email':
                        cleaned_value = DataCleaner.clean_email(
                            value,
                            **field_config.get('email_options', {})
                        )
                    elif data_type == 'phone':
                        cleaned_value = DataCleaner.clean_phone(
                            value,
                            **field_config.get('phone_options', {})
                        )
                    elif data_type == 'address':
                        cleaned_value = DataCleaner.clean_address(
                            value,
                            **field_config.get('address_options', {})
                        )
                    elif data_type == 'currency':
                        cleaned_value = DataCleaner.clean_currency(
                            value,
                            **field_config.get('currency_options', {})
                        )
                    elif data_type == 'date':
                        cleaned_value = DataCleaner.clean_date(
                            value,
                            **field_config.get('date_options', {})
                        )
                    elif data_type == 'integer':
                        cleaned_value = DataCleaner.clean_integer(
                            value,
                            **field_config.get('integer_options', {})
                        )
                    elif data_type == 'boolean':
                        cleaned_value = DataCleaner.clean_boolean(
                            value,
                            **field_config.get('boolean_options', {})
                        )
                    elif data_type == 'name':
                        cleaned_value = DataCleaner.clean_name(
                            value,
                            **field_config.get('name_options', {})
                        )
                    elif data_type == 'postal_code':
                        cleaned_value = DataCleaner.clean_postal_code(
                            value,
                            **field_config.get('postal_code_options', {})
                        )
                    elif data_type == 'state':
                        cleaned_value = DataCleaner.clean_state(
                            value,
                            **field_config.get('state_options', {})
                        )
                    elif data_type == 'building_type':
                        cleaned_value = DataCleaner.clean_building_type(
                            value,
                            **field_config.get('building_type_options', {})
                        )
                    else:
                        cleaned_value = value
                    
                    cleaned_record[field_name] = cleaned_value
                    
                except Exception as e:
                    logger.error(f"Error cleaning field {field_name}: {str(e)}")
                    cleaned_record[field_name] = value  # Keep original value
        
        return cleaned_record

def clean_csv_data(data: List[Dict[str, Any]],
                   field_mappings: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Clean a list of CSV records
    
    Args:
        data: List of records to clean
        field_mappings: Field-specific cleaning rules
        
    Returns:
        List of cleaned records
    """
    cleaned_data = []
    
    for i, record in enumerate(data):
        try:
            cleaned_record = DataCleaner.clean_record(record, field_mappings)
            cleaned_data.append(cleaned_record)
        except Exception as e:
            logger.error(f"Error cleaning record {i}: {str(e)}")
            cleaned_data.append(record)  # Keep original record
    
    return cleaned_data
