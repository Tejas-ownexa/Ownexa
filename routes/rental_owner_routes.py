from flask import Blueprint, request, jsonify
from models.rental_owner import RentalOwner, RentalOwnerManager
from models.property import Property
from models.user import User
from config import db
from routes.auth_routes import token_required
import csv
import io
from datetime import datetime

rental_owner_bp = Blueprint('rental_owner_bp', __name__)

@rental_owner_bp.route('/rental-owners', methods=['GET'])
@token_required
def get_rental_owners(current_user):
    """Get all rental owners that the current user can manage"""
    try:
        # Get rental owners that the current user manages
        rental_owners = db.session.query(RentalOwner).join(
            RentalOwnerManager, RentalOwner.id == RentalOwnerManager.rental_owner_id
        ).filter(
            RentalOwnerManager.user_id == current_user.id
        ).all()
        
        rental_owners_data = []
        for rental_owner in rental_owners:
            # Get property count for this rental owner
            property_count = Property.query.filter_by(rental_owner_id=rental_owner.id).count()
            
            # Get managers for this rental owner
            managers = db.session.query(User).join(
                RentalOwnerManager, User.id == RentalOwnerManager.user_id
            ).filter(
                RentalOwnerManager.rental_owner_id == rental_owner.id
            ).all()
            
            managers_data = [{
                'id': manager.id,
                'username': manager.username,
                'full_name': manager.full_name,
                'email': manager.email
            } for manager in managers]
            
            rental_owner_dict = rental_owner.to_dict()
            rental_owner_dict['property_count'] = property_count
            rental_owner_dict['managers'] = managers_data
            rental_owners_data.append(rental_owner_dict)
        
        return jsonify({'rental_owners': rental_owners_data}), 200
    except Exception as e:
        print(f"Error fetching rental owners: {str(e)}")
        return jsonify({'error': str(e)}), 400

@rental_owner_bp.route('/rental-owners', methods=['POST'])
@token_required
def create_rental_owner(current_user):
    """Create a new rental owner"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['company_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create rental owner
        rental_owner = RentalOwner(
            company_name=data['company_name'],
            business_type=data.get('business_type'),
            tax_id=data.get('tax_id'),
            business_address=data.get('business_address'),
            city=data.get('city'),
            state=data.get('state'),
            zip_code=data.get('zip_code'),
            phone_number=data.get('phone_number'),
            email=data.get('email'),
            website=data.get('website'),
            contact_person=data.get('contact_person'),
            contact_phone=data.get('contact_phone'),
            contact_email=data.get('contact_email'),
            bank_account_info=data.get('bank_account_info'),
            insurance_info=data.get('insurance_info'),
            management_fee_percentage=data.get('management_fee_percentage', 0.00),
            notes=data.get('notes')
        )
        
        db.session.add(rental_owner)
        db.session.flush()  # Get the ID
        
        # Create manager relationship (current user becomes primary manager)
        manager = RentalOwnerManager(
            rental_owner_id=rental_owner.id,
            user_id=current_user.id,
            role='MANAGER',
            is_primary=True
        )
        
        db.session.add(manager)
        db.session.commit()
        
        print(f"New rental owner created: {rental_owner.company_name} by user {current_user.username}")
        return jsonify({
            'success': True,
            'message': 'Rental owner created successfully',
            'rental_owner': rental_owner.to_dict()
        }), 201
        
    except Exception as e:
        print(f"Error creating rental owner: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@rental_owner_bp.route('/rental-owners/<int:rental_owner_id>', methods=['PUT'])
@token_required
def update_rental_owner(current_user, rental_owner_id):
    """Update a rental owner"""
    try:
        # Check if user can manage this rental owner
        manager = RentalOwnerManager.query.filter_by(
            rental_owner_id=rental_owner_id,
            user_id=current_user.id
        ).first()
        
        if not manager:
            return jsonify({'error': 'Unauthorized to update this rental owner'}), 403
        
        rental_owner = RentalOwner.query.get(rental_owner_id)
        if not rental_owner:
            return jsonify({'error': 'Rental owner not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'company_name' in data:
            rental_owner.company_name = data['company_name']
        if 'business_type' in data:
            rental_owner.business_type = data['business_type']
        if 'tax_id' in data:
            rental_owner.tax_id = data['tax_id']
        if 'business_address' in data:
            rental_owner.business_address = data['business_address']
        if 'city' in data:
            rental_owner.city = data['city']
        if 'state' in data:
            rental_owner.state = data['state']
        if 'zip_code' in data:
            rental_owner.zip_code = data['zip_code']
        if 'phone_number' in data:
            rental_owner.phone_number = data['phone_number']
        if 'email' in data:
            rental_owner.email = data['email']
        if 'website' in data:
            rental_owner.website = data['website']
        if 'contact_person' in data:
            rental_owner.contact_person = data['contact_person']
        if 'contact_phone' in data:
            rental_owner.contact_phone = data['contact_phone']
        if 'contact_email' in data:
            rental_owner.contact_email = data['contact_email']
        if 'bank_account_info' in data:
            rental_owner.bank_account_info = data['bank_account_info']
        if 'insurance_info' in data:
            rental_owner.insurance_info = data['insurance_info']
        if 'management_fee_percentage' in data:
            rental_owner.management_fee_percentage = data['management_fee_percentage']
        if 'notes' in data:
            rental_owner.notes = data['notes']
        if 'is_active' in data:
            rental_owner.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Rental owner updated successfully',
            'rental_owner': rental_owner.to_dict()
        }), 200
        
    except Exception as e:
        print(f"Error updating rental owner: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@rental_owner_bp.route('/rental-owners/<int:rental_owner_id>', methods=['DELETE'])
@token_required
def delete_rental_owner(current_user, rental_owner_id):
    """Delete a rental owner"""
    try:
        # Check if user can manage this rental owner
        manager = RentalOwnerManager.query.filter_by(
            rental_owner_id=rental_owner_id,
            user_id=current_user.id
        ).first()
        
        if not manager:
            return jsonify({'error': 'Unauthorized to delete this rental owner'}), 403
        
        rental_owner = RentalOwner.query.get(rental_owner_id)
        if not rental_owner:
            return jsonify({'error': 'Rental owner not found'}), 404
        
        # Check if rental owner has properties
        properties = Property.query.filter_by(rental_owner_id=rental_owner_id).all()
        property_count = len(properties)
        
        # If properties exist, return property information for confirmation
        if property_count > 0:
            property_info = []
            for prop in properties:
                property_info.append({
                    'id': prop.id,
                    'title': prop.title,
                    'address': f"{prop.street_address_1}, {prop.city}, {prop.state}",
                    'status': prop.status
                })
            
            return jsonify({
                'error': 'confirmation_required',
                'message': f'This rental owner has {property_count} properties. Do you wish to delete it?',
                'property_count': property_count,
                'properties': property_info,
                'rental_owner_name': rental_owner.company_name
            }), 400
        
        # Manually delete related records to avoid cascade issues
        # Delete rental owner managers first
        RentalOwnerManager.query.filter_by(rental_owner_id=rental_owner_id).delete()
        
        # Then delete the rental owner
        db.session.delete(rental_owner)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Rental owner deleted successfully'
        }), 200
        
    except Exception as e:
        print(f"Error deleting rental owner: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@rental_owner_bp.route('/rental-owners/<int:rental_owner_id>/force-delete', methods=['DELETE'])
@token_required
def force_delete_rental_owner(current_user, rental_owner_id):
    """Force delete a rental owner and all its properties"""
    try:
        # Check if user can manage this rental owner
        manager = RentalOwnerManager.query.filter_by(
            rental_owner_id=rental_owner_id,
            user_id=current_user.id
        ).first()
        
        if not manager:
            return jsonify({'error': 'Unauthorized to delete this rental owner'}), 403
        
        rental_owner = RentalOwner.query.get(rental_owner_id)
        if not rental_owner:
            return jsonify({'error': 'Rental owner not found'}), 404
        
        # Get all properties for this rental owner
        properties = Property.query.filter_by(rental_owner_id=rental_owner_id).all()
        
        # Delete all properties and their related data
        for property in properties:
            # Delete tenants for this property
            from models.tenant import Tenant, OutstandingBalance
            from models.maintenance import MaintenanceRequest
            
            # Delete tenants
            Tenant.query.filter_by(property_id=property.id).delete()
            
            # Delete outstanding balances
            OutstandingBalance.query.filter_by(property_id=property.id).delete()
            
            # Delete maintenance requests
            MaintenanceRequest.query.filter_by(property_id=property.id).delete()
            
            # Delete the property
            db.session.delete(property)
        
        # Manually delete related records to avoid cascade issues
        # Delete rental owner managers first
        RentalOwnerManager.query.filter_by(rental_owner_id=rental_owner_id).delete()
        
        # Then delete the rental owner
        db.session.delete(rental_owner)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Rental owner "{rental_owner.company_name}" and {len(properties)} properties deleted successfully'
        }), 200
        
    except Exception as e:
        print(f"Error force deleting rental owner: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@rental_owner_bp.route('/rental-owners/import', methods=['POST'])
@token_required
def import_rental_owners(current_user):
    """Import rental owners from CSV file"""
    try:
        if 'csv_file' not in request.files:
            return jsonify({'error': 'No CSV file provided'}), 400
        
        csv_file = request.files['csv_file']
        if csv_file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not csv_file.filename.endswith('.csv'):
            return jsonify({'error': 'File must be a CSV'}), 400
        
        csv_content = csv_file.read().decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        
        imported_count = 0
        errors = []
        
        for row_num, row in enumerate(csv_reader, start=2):
            try:
                company_name = row.get('COMPANY_NAME', '').strip()
                if not company_name:
                    errors.append(f"Row {row_num}: Company name is required")
                    continue
                
                # Check if rental owner already exists
                existing_rental_owner = RentalOwner.query.filter_by(company_name=company_name).first()
                if existing_rental_owner:
                    errors.append(f"Row {row_num}: Rental owner with company name '{company_name}' already exists")
                    continue
                
                rental_owner = RentalOwner(
                    company_name=company_name,
                    business_type=row.get('BUSINESS_TYPE', '').strip(),
                    tax_id=row.get('TAX_ID', '').strip(),
                    business_address=row.get('BUSINESS_ADDRESS', '').strip(),
                    city=row.get('CITY', '').strip(),
                    state=row.get('STATE', '').strip(),
                    zip_code=row.get('ZIP_CODE', '').strip(),
                    phone_number=row.get('PHONE_NUMBER', '').strip(),
                    email=row.get('EMAIL', '').strip(),
                    website=row.get('WEBSITE', '').strip(),
                    contact_person=row.get('CONTACT_PERSON', '').strip(),
                    contact_phone=row.get('CONTACT_PHONE', '').strip(),
                    contact_email=row.get('CONTACT_EMAIL', '').strip(),
                    bank_account_info=row.get('BANK_ACCOUNT_INFO', '').strip(),
                    insurance_info=row.get('INSURANCE_INFO', '').strip(),
                    management_fee_percentage=float(row.get('MANAGEMENT_FEE_PERCENTAGE', 0)),
                    notes=row.get('NOTES', '').strip()
                )
                
                db.session.add(rental_owner)
                db.session.flush()  # Get the ID
                
                # Create manager relationship
                manager = RentalOwnerManager(
                    rental_owner_id=rental_owner.id,
                    user_id=current_user.id,
                    role='MANAGER',
                    is_primary=True
                )
                
                db.session.add(manager)
                imported_count += 1
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
                continue
        
        if errors:
            db.session.rollback()
            return jsonify({
                'success': False,
                'error': 'Import failed due to validation errors',
                'errors': errors
            }), 400
        
        db.session.commit()
        
        print(f"Successfully imported {imported_count} rental owners")
        return jsonify({
            'success': True,
            'imported_count': imported_count,
            'message': f'Successfully imported {imported_count} rental owners'
        }), 200
        
    except Exception as e:
        print(f"Error importing rental owners: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@rental_owner_bp.route('/rental-owners/export', methods=['GET'])
@token_required
def export_rental_owners(current_user):
    """Export rental owners to CSV"""
    try:
        # Get rental owners that the current user manages
        rental_owners = db.session.query(RentalOwner).join(
            RentalOwnerManager, RentalOwner.id == RentalOwnerManager.rental_owner_id
        ).filter(
            RentalOwnerManager.user_id == current_user.id
        ).all()
        
        # Create CSV content
        csv_content = [
            ['COMPANY_NAME', 'BUSINESS_TYPE', 'TAX_ID', 'BUSINESS_ADDRESS', 'CITY', 'STATE', 'ZIP_CODE', 
             'PHONE_NUMBER', 'EMAIL', 'WEBSITE', 'CONTACT_PERSON', 'CONTACT_PHONE', 'CONTACT_EMAIL', 
             'BANK_ACCOUNT_INFO', 'INSURANCE_INFO', 'MANAGEMENT_FEE_PERCENTAGE', 'NOTES']
        ]
        
        for rental_owner in rental_owners:
            csv_content.append([
                rental_owner.company_name or '',
                rental_owner.business_type or '',
                rental_owner.tax_id or '',
                rental_owner.business_address or '',
                rental_owner.city or '',
                rental_owner.state or '',
                rental_owner.zip_code or '',
                rental_owner.phone_number or '',
                rental_owner.email or '',
                rental_owner.website or '',
                rental_owner.contact_person or '',
                rental_owner.contact_phone or '',
                rental_owner.contact_email or '',
                rental_owner.bank_account_info or '',
                rental_owner.insurance_info or '',
                rental_owner.management_fee_percentage or 0,
                rental_owner.notes or ''
            ])
        
        csv_string = '\n'.join([','.join([f'"{cell}"' for cell in row]) for row in csv_content])
        
        return jsonify({
            'success': True,
            'csv_data': csv_string,
            'filename': f'rental_owners_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        }), 200
        
    except Exception as e:
        print(f"Error exporting rental owners: {str(e)}")
        return jsonify({'error': str(e)}), 400
