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
    """Get all property owners (users who own properties)"""
    try:
        # For admin users, show all property owners
        if current_user.role == 'ADMIN':
            # Get all users who own properties
            property_owners = db.session.query(User).join(
                Property, User.id == Property.owner_id
            ).distinct().all()
        else:
            # For regular users, only show themselves if they own properties
            property_count = Property.query.filter_by(owner_id=current_user.id).count()
            if property_count > 0:
                property_owners = [current_user]
            else:
                property_owners = []
        
        rental_owners_data = []
        for owner in property_owners:
            # Get property count for this owner
            property_count = Property.query.filter_by(owner_id=owner.id).count()
            
            # Get property details
            properties = Property.query.filter_by(owner_id=owner.id).all()
            
            # Create rental owner data structure to match frontend expectations
            rental_owner_dict = {
                'id': owner.id,
                'company_name': owner.full_name or owner.username,
                'business_type': 'Property Owner',
                'contact_email': owner.email,
                'contact_phone': getattr(owner, 'phone', ''),
                'city': '',
                'state': '',
                'property_count': property_count,
                'created_at': owner.created_at.isoformat() if hasattr(owner, 'created_at') and owner.created_at else None,
                'properties': [{
                    'id': prop.id,
                    'title': prop.title,
                    'address': f"{prop.street_address_1}, {prop.city}, {prop.state}",
                    'rent_amount': float(prop.rent_amount) if prop.rent_amount else 0
                } for prop in properties]
            }
            
            # Try to get city/state from first property if available
            if properties:
                first_property = properties[0]
                rental_owner_dict['city'] = first_property.city or ''
                rental_owner_dict['state'] = first_property.state or ''
            
            rental_owners_data.append(rental_owner_dict)
        
        return jsonify({'rental_owners': rental_owners_data}), 200
    except Exception as e:
        print(f"Error fetching rental owners: {str(e)}")
        return jsonify({'error': str(e)}), 400

@rental_owner_bp.route('/rental-owners', methods=['POST'])
@token_required
def create_rental_owner(current_user):
    """Create a new property owner user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['company_name', 'contact_email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check if user with this email already exists
        existing_user = User.query.filter_by(email=data['contact_email']).first()
        if existing_user:
            return jsonify({'error': 'A user with this email already exists'}), 400
        
        # Create new user with OWNER role
        import secrets
        import string
        
        # Generate a temporary password
        temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for i in range(12))
        
        new_owner = User(
            username=data['contact_email'].split('@')[0],  # Use email prefix as username
            email=data['contact_email'],
            full_name=data['company_name'],
            phone_number=data.get('contact_phone', ''),
            street_address_1=data.get('address', 'Not Provided'),
            city=data.get('city', 'Not Provided'),
            state=data.get('state', 'Not Provided'),
            zip_code=data.get('zip_code', '00000'),
            role='OWNER',
            email_verified=False  # They'll need to verify their email
        )
        
        # Hash the temporary password
        from werkzeug.security import generate_password_hash
        new_owner.password = generate_password_hash(temp_password)
        
        db.session.add(new_owner)
        db.session.commit()
        
        print(f"New property owner created: {data['company_name']} ({data['contact_email']}) by user {current_user.username}")
        
        # Return data in format expected by frontend
        owner_data = {
            'id': new_owner.id,
            'company_name': data['company_name'],
            'business_type': data.get('business_type', 'Property Owner'),
            'contact_email': data['contact_email'],
            'contact_phone': data.get('contact_phone', ''),
            'city': data.get('city', ''),
            'state': data.get('state', ''),
            'property_count': 0,
            'created_at': new_owner.created_at.isoformat() if hasattr(new_owner, 'created_at') and new_owner.created_at else None,
            'temp_password': temp_password  # Include temp password for admin reference
        }
        
        return jsonify({
            'success': True,
            'message': f'Property owner created successfully. Temporary password: {temp_password}',
            'rental_owner': owner_data
        }), 201
        
    except Exception as e:
        print(f"Error creating property owner: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@rental_owner_bp.route('/rental-owners/<int:rental_owner_id>', methods=['PUT'])
@token_required
def update_rental_owner(current_user, rental_owner_id):
    """Update a property owner"""
    try:
        # Only admin or the owner themselves can update
        if current_user.role != 'ADMIN' and current_user.id != rental_owner_id:
            return jsonify({'error': 'Unauthorized to update this property owner'}), 403
        
        owner_user = User.query.get(rental_owner_id)
        if not owner_user:
            return jsonify({'error': 'Property owner not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'company_name' in data:
            owner_user.full_name = data['company_name']
        if 'contact_email' in data:
            # Check if email is already taken by another user
            existing_user = User.query.filter(User.email == data['contact_email'], User.id != rental_owner_id).first()
            if existing_user:
                return jsonify({'error': 'Email already taken by another user'}), 400
            owner_user.email = data['contact_email']
        if 'contact_phone' in data:
            owner_user.phone = data['contact_phone']
        
        db.session.commit()
        
        # Return updated data in expected format
        property_count = Property.query.filter_by(owner_id=owner_user.id).count()
        updated_data = {
            'id': owner_user.id,
            'company_name': owner_user.full_name,
            'business_type': 'Property Owner',
            'contact_email': owner_user.email,
            'contact_phone': owner_user.phone or '',
            'city': '',
            'state': '',
            'property_count': property_count
        }
        
        return jsonify({
            'success': True,
            'message': 'Property owner updated successfully',
            'rental_owner': updated_data
        }), 200
        
    except Exception as e:
        print(f"Error updating rental owner: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@rental_owner_bp.route('/rental-owners/<int:rental_owner_id>', methods=['DELETE'])
@token_required
def delete_rental_owner(current_user, rental_owner_id):
    """Delete a property owner"""
    try:
        # Only admin can delete property owners
        if current_user.role != 'ADMIN':
            return jsonify({'error': 'Unauthorized to delete property owners'}), 403
        
        owner_user = User.query.get(rental_owner_id)
        if not owner_user:
            return jsonify({'error': 'Property owner not found'}), 404
        
        # Check if owner has properties
        properties = Property.query.filter_by(owner_id=rental_owner_id).all()
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
                'message': f'This property owner has {property_count} properties. Do you wish to delete it?',
                'property_count': property_count,
                'properties': property_info,
                'rental_owner_name': owner_user.full_name
            }), 400
        
        # If no properties, delete the user
        db.session.delete(owner_user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Property owner deleted successfully'
        }), 200
        
    except Exception as e:
        print(f"Error deleting rental owner: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@rental_owner_bp.route('/rental-owners/<int:rental_owner_id>/force-delete', methods=['DELETE'])
@token_required
def force_delete_rental_owner(current_user, rental_owner_id):
    """Force delete a property owner and all their properties"""
    try:
        # Only admin can force delete property owners
        if current_user.role != 'ADMIN':
            return jsonify({'error': 'Unauthorized to delete property owners'}), 403
        
        owner_user = User.query.get(rental_owner_id)
        if not owner_user:
            return jsonify({'error': 'Property owner not found'}), 404
        
        # Get all properties for this owner
        properties = Property.query.filter_by(owner_id=rental_owner_id).all()
        
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
        
        # Delete the property owner user
        db.session.delete(owner_user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Property owner "{owner_user.full_name}" and {len(properties)} properties deleted successfully'
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
                
                contact_email = row.get('CONTACT_EMAIL', '').strip()
                if not contact_email:
                    errors.append(f"Row {row_num}: Contact email is required")
                    continue
                
                # Check if user already exists
                existing_user = User.query.filter_by(email=contact_email).first()
                if existing_user:
                    errors.append(f"Row {row_num}: User with email '{contact_email}' already exists")
                    continue
                
                # Generate a temporary password
                import secrets
                import string
                temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for i in range(12))
                
                new_owner = User(
                    username=contact_email.split('@')[0],
                    email=contact_email,
                    full_name=company_name,
                    phone=row.get('CONTACT_PHONE', '').strip(),
                    role='OWNER',
                    is_verified=False
                )
                
                # Set password
                new_owner.set_password(temp_password)
                
                db.session.add(new_owner)
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
