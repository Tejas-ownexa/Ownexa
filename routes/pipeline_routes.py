from flask import Blueprint, request, jsonify, current_app
from models.property import Property
from models.tenant import Tenant
from models.user import User
from config import db
from routes.auth_routes import token_required
import csv
import io
from datetime import datetime

pipeline_bp = Blueprint('pipeline', __name__)

@pipeline_bp.route('/import/<data_type>', methods=['POST'])
@token_required
def import_data(current_user, data_type):
    """
    Universal CSV import pipeline
    Supports: properties, tenants, financials
    """
    try:
        print(f"Pipeline import attempt for {data_type} received")
        print("Current user:", current_user.username)
        
        if 'csv_file' not in request.files:
            return jsonify({'error': 'No CSV file provided'}), 400
        
        csv_file = request.files['csv_file']
        if csv_file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not csv_file.filename.endswith('.csv'):
            return jsonify({'error': 'File must be a CSV'}), 400
        
        # Read and parse CSV
        csv_content = csv_file.read().decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        
        imported_count = 0
        errors = []
        
        # Route to appropriate import handler
        if data_type.lower() == 'properties':
            imported_count, errors = import_properties_csv(current_user, csv_reader)
        elif data_type.lower() == 'tenants':
            imported_count, errors = import_tenants_csv(current_user, csv_reader)
        elif data_type.lower() == 'maintenance':
            imported_count, errors = import_maintenance_csv(current_user, csv_reader)
        elif data_type.lower() == 'vendors':
            imported_count, errors = import_vendors_csv(current_user, csv_reader)
        else:
            return jsonify({'error': f'Unsupported data type: {data_type}'}), 400
        
        # Commit all changes if successful
        if imported_count > 0:
            db.session.commit()
            print(f"Successfully imported {imported_count} {data_type}")
        
        return jsonify({
            'success': True,
            'data_type': data_type,
            'imported_count': imported_count,
            'errors': errors
        }), 200
        
    except Exception as e:
        print(f"Error importing {data_type}:", str(e))
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

def import_properties_csv(current_user, csv_reader):
    """Import properties from CSV data"""
    imported_count = 0
    errors = []
    
    for row_num, row in enumerate(csv_reader, start=2):
        try:
            # Extract data from CSV row
            title = row.get('PROPERTY', '').strip() or row.get('title', '').strip() or row.get('TITLE', '').strip()
            location = row.get('LOCATION', '').strip() or row.get('location', '').strip()
            street_address = row.get('STREET_ADDRESS', '').strip() or row.get('street_address_1', '').strip() or row.get('address', '').strip()
            street_address_2 = row.get('STREET_ADDRESS_2', '').strip() or row.get('street_address_2', '').strip()
            apt_number = row.get('APT_NUMBER', '').strip() or row.get('apt_number', '').strip()
            zip_code = row.get('ZIP_CODE', '').strip() or row.get('zip_code', '').strip()
            description = row.get('DESCRIPTION', '').strip() or row.get('description', '').strip() or 'Imported property'
            rent_amount = row.get('RENT_AMOUNT', '0').strip() or row.get('rent_amount', '0').strip() or row.get('rent', '0').strip()
            status = row.get('STATUS', 'available').strip() or row.get('status', 'available').strip()
            
            # Parse location (assuming format: "City, State")
            city = row.get('CITY', '').strip() or row.get('city', '').strip()
            state = row.get('STATE', '').strip() or row.get('state', '').strip()
            
            if location and ',' in location and not city:
                parts = location.split(',')
                city = parts[0].strip()
                state = parts[1].strip() if len(parts) > 1 else state
            
            # Validate required fields
            if not title:
                errors.append(f"Row {row_num}: Property title is required")
                continue
            
            if not city:
                errors.append(f"Row {row_num}: City is required")
                continue
            
            if not state:
                errors.append(f"Row {row_num}: State is required")
                continue
            
            if not street_address:
                errors.append(f"Row {row_num}: Street address is required")
                continue
            
            # Convert rent_amount to float
            try:
                rent_amount_float = float(rent_amount) if rent_amount else 0.0
            except ValueError:
                rent_amount_float = 0.0
            
            # Create property
            property = Property(
                title=title,
                street_address_1=street_address,
                street_address_2=street_address_2,
                apt_number=apt_number,
                city=city,
                state=state,
                zip_code=zip_code,
                description=description,
                rent_amount=rent_amount_float,
                status=status,
                owner_id=current_user.id
            )
            
            db.session.add(property)
            imported_count += 1
            
        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")
            continue
    
    return imported_count, errors

def import_tenants_csv(current_user, csv_reader):
    """Import tenants from CSV data"""
    imported_count = 0
    errors = []
    
    for row_num, row in enumerate(csv_reader, start=2):
        try:
            # Extract data from CSV row with multiple column name options
            full_name = (row.get('FULL_NAME', '').strip() or 
                        row.get('full_name', '').strip() or 
                        row.get('name', '').strip() or 
                        row.get('NAME', '').strip())
            
            email = (row.get('EMAIL', '').strip() or 
                    row.get('email', '').strip() or
                    row.get('Email', '').strip())
            
            phone_number = (row.get('PHONE_NUMBER', '').strip() or 
                           row.get('phone_number', '').strip() or
                           row.get('phone', '').strip() or
                           row.get('PHONE', '').strip())
            
            property_title = (row.get('PROPERTY', '').strip() or 
                             row.get('property', '').strip() or
                             row.get('property_title', '').strip())
            
            lease_start_str = (row.get('LEASE_START', '').strip() or 
                              row.get('lease_start', '').strip() or
                              row.get('start_date', '').strip())
            
            lease_end_str = (row.get('LEASE_END', '').strip() or 
                            row.get('lease_end', '').strip() or
                            row.get('end_date', '').strip())
            
            rent_amount_str = (row.get('RENT_AMOUNT', '').strip() or 
                              row.get('rent_amount', '').strip() or
                              row.get('rent', '').strip())
            
            payment_status = (row.get('PAYMENT_STATUS', '').strip() or 
                             row.get('payment_status', '').strip() or
                             'current')
            
            # Validate required fields
            if not full_name:
                errors.append(f"Row {row_num}: Tenant name is required")
                continue
            
            if not email:
                errors.append(f"Row {row_num}: Email is required")
                continue
            
            # Find property if specified
            property_id = None
            if property_title:
                property = Property.query.filter_by(
                    title=property_title, 
                    owner_id=current_user.id
                ).first()
                if property:
                    property_id = property.id
                else:
                    errors.append(f"Row {row_num}: Property '{property_title}' not found")
                    continue
            
            # Parse dates
            lease_start = None
            lease_end = None
            
            if lease_start_str:
                try:
                    lease_start = datetime.strptime(lease_start_str, '%Y-%m-%d').date()
                except ValueError:
                    try:
                        lease_start = datetime.strptime(lease_start_str, '%m/%d/%Y').date()
                    except ValueError:
                        errors.append(f"Row {row_num}: Invalid lease start date format")
                        continue
            
            if lease_end_str:
                try:
                    lease_end = datetime.strptime(lease_end_str, '%Y-%m-%d').date()
                except ValueError:
                    try:
                        lease_end = datetime.strptime(lease_end_str, '%m/%d/%Y').date()
                    except ValueError:
                        errors.append(f"Row {row_num}: Invalid lease end date format")
                        continue
            
            # Parse rent amount
            rent_amount = None
            if rent_amount_str:
                try:
                    rent_amount = float(rent_amount_str)
                except ValueError:
                    errors.append(f"Row {row_num}: Invalid rent amount")
                    continue
            
            # Check if tenant already exists
            existing_tenant = Tenant.query.filter_by(email=email).first()
            if existing_tenant:
                errors.append(f"Row {row_num}: Tenant with email {email} already exists")
                continue
            
            # Create tenant
            tenant = Tenant(
                full_name=full_name,
                email=email,
                phone_number=phone_number,
                property_id=property_id,
                lease_start=lease_start,
                lease_end=lease_end,
                rent_amount=rent_amount,
                payment_status=payment_status
            )
            
            db.session.add(tenant)
            imported_count += 1
            
        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")
            continue
    
    return imported_count, errors

def import_maintenance_csv(current_user, csv_reader):
    """Import maintenance requests from CSV data"""
    imported_count = 0
    errors = []
    # TODO: Implement maintenance import logic
    errors.append("Maintenance import not yet implemented")
    return imported_count, errors

def import_vendors_csv(current_user, csv_reader):
    """Import vendors from CSV data"""
    imported_count = 0
    errors = []
    # TODO: Implement vendor import logic
    errors.append("Vendor import not yet implemented")
    return imported_count, errors

@pipeline_bp.route('/template/<data_type>', methods=['GET'])
@token_required
def get_csv_template(current_user, data_type):
    """
    Generate CSV templates for different data types
    """
    try:
        templates = {
            'properties': {
                'filename': 'properties_template.csv',
                'headers': ['PROPERTY', 'STREET_ADDRESS', 'CITY', 'STATE', 'ZIP_CODE', 'DESCRIPTION', 'RENT_AMOUNT', 'STATUS'],
                'sample_row': ['Sample Property', '123 Main St', 'New York', 'NY', '10001', 'Beautiful 2BR apartment', '2500', 'available']
            },
            'tenants': {
                'filename': 'tenants_template.csv',
                'headers': ['FULL_NAME', 'EMAIL', 'PHONE_NUMBER', 'PROPERTY', 'LEASE_START', 'LEASE_END', 'RENT_AMOUNT', 'PAYMENT_STATUS'],
                'sample_row': ['John Doe', 'john.doe@email.com', '555-123-4567', 'Sample Property', '2024-01-01', '2024-12-31', '2500', 'current']
            },
            'maintenance': {
                'filename': 'maintenance_template.csv',
                'headers': ['PROPERTY', 'TENANT_EMAIL', 'DESCRIPTION', 'PRIORITY', 'STATUS', 'VENDOR_TYPE'],
                'sample_row': ['Sample Property', 'john.doe@email.com', 'Leaky faucet in kitchen', 'medium', 'open', 'plumber']
            },
            'vendors': {
                'filename': 'vendors_template.csv',
                'headers': ['BUSINESS_NAME', 'CONTACT_NAME', 'EMAIL', 'PHONE', 'VENDOR_TYPE', 'ADDRESS'],
                'sample_row': ['ABC Plumbing', 'Bob Smith', 'bob@abcplumbing.com', '555-987-6543', 'plumber', '456 Service St']
            }
        }
        
        if data_type.lower() not in templates:
            return jsonify({'error': f'Template not available for {data_type}'}), 400
        
        template = templates[data_type.lower()]
        
        return jsonify({
            'success': True,
            'filename': template['filename'],
            'headers': template['headers'],
            'sample_row': template['sample_row']
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@pipeline_bp.route('/status', methods=['GET'])
@token_required
def get_pipeline_status(current_user):
    """
    Get available pipeline import types and their status
    """
    try:
        import_types = [
            {
                'type': 'properties',
                'name': 'Properties',
                'description': 'Import property listings',
                'available': True
            },
            {
                'type': 'tenants',
                'name': 'Tenants',
                'description': 'Import tenant information',
                'available': True
            },
            {
                'type': 'maintenance',
                'name': 'Maintenance Requests',
                'description': 'Import maintenance requests',
                'available': False  # Not yet implemented
            },
            {
                'type': 'vendors',
                'name': 'Vendors',
                'description': 'Import vendor contacts',
                'available': False  # Not yet implemented
            }
        ]
        
        return jsonify({
            'success': True,
            'import_types': import_types
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400
