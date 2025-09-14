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

def _get_rental_owners_data(current_user):
    """Shared function to get rental owners data"""
    try:
        # Get all rental owners from the RentalOwner model
        rental_owners = RentalOwner.query.filter_by(is_active=True).all()
        
        rental_owners_data = []
        for owner in rental_owners:
            # Get properties directly linked to this rental owner
            linked_properties = []
            for prop in owner.properties:
                linked_properties.append({
                    'id': prop.id,
                    'title': prop.title,
                    'address': f"{prop.street_address_1}, {prop.city}, {prop.state}",
                    'rent_amount': float(prop.rent_amount) if prop.rent_amount else 0,
                    'status': prop.status,
                    'city': prop.city,
                    'state': prop.state
                })
            
            # Create rental owner data structure to match frontend expectations
            rental_owner_dict = {
                'id': owner.id,
                'company_name': owner.company_name,
                'business_type': owner.business_type or 'Property Owner',
                'contact_email': owner.contact_email or owner.email,
                'contact_phone': owner.contact_phone or owner.phone_number,
                'city': owner.city or '',
                'state': owner.state or '',
                'property_count': len(linked_properties),
                'created_at': owner.created_at.isoformat() if owner.created_at else None,
                'properties': linked_properties
            }
            rental_owners_data.append(rental_owner_dict)
        
        return jsonify({'rental_owners': rental_owners_data}), 200
    except Exception as e:
        print(f"Error fetching rental owners: {str(e)}")
        return jsonify({'error': str(e)}), 400

@rental_owner_bp.route('/', methods=['GET'])
@token_required
def get_rental_owners_root(current_user):
    """Get all rental owner companies - root endpoint"""
    return _get_rental_owners_data(current_user)

@rental_owner_bp.route('/rental-owners', methods=['GET'])
@token_required
def get_rental_owners(current_user):
    """Get all rental owner companies"""
    return _get_rental_owners_data(current_user)

def _create_rental_owner_data(current_user):
    """Shared function to create rental owner data"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['company_name', 'contact_email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check if rental owner with this email already exists
        existing_owner = RentalOwner.query.filter_by(contact_email=data['contact_email']).first()
        if existing_owner:
            return jsonify({'error': 'A rental owner with this email already exists'}), 400
        
        # Create new rental owner
        new_owner = RentalOwner(
            company_name=data['company_name'],
            business_type=data.get('business_type', 'Property Owner'),
            contact_email=data['contact_email'],
            contact_phone=data.get('contact_phone', ''),
            email=data.get('contact_email', ''),  # Also store in email field for compatibility
            phone_number=data.get('contact_phone', ''),  # Also store in phone_number field
            city=data.get('city', ''),
            state=data.get('state', ''),
            zip_code=data.get('zip_code', ''),
            is_active=True
        )
        
        db.session.add(new_owner)
        db.session.commit()
        
        print(f"New rental owner created: {data['company_name']} ({data['contact_email']}) by user {current_user.username}")
        
        # Return data in format expected by frontend
        owner_data = {
            'id': new_owner.id,
            'company_name': new_owner.company_name,
            'business_type': new_owner.business_type,
            'contact_email': new_owner.contact_email,
            'contact_phone': new_owner.contact_phone,
            'city': new_owner.city,
            'state': new_owner.state,
            'property_count': 0,
            'created_at': new_owner.created_at.isoformat() if new_owner.created_at else None
        }
        
        return jsonify({
            'success': True,
            'message': 'Rental owner created successfully',
            'rental_owner': owner_data
        }), 201
        
    except Exception as e:
        print(f"Error creating property owner: {str(e)}")
        db.session.rollback()
        
        # Provide more user-friendly error messages
        error_message = str(e)
        if 'duplicate key value violates unique constraint' in error_message:
            if 'user_username_key' in error_message:
                return jsonify({'error': 'A user with this username already exists. Please try a different email address.'}), 400
            elif 'user_email_key' in error_message:
                return jsonify({'error': 'A user with this email already exists.'}), 400
            else:
                return jsonify({'error': 'A user with this information already exists. Please check your details.'}), 400
        else:
            return jsonify({'error': f'Failed to create rental owner: {error_message}'}), 400

@rental_owner_bp.route('/', methods=['POST'])
@token_required
def create_rental_owner_root(current_user):
    """Create a new rental owner company - root endpoint"""
    return _create_rental_owner_data(current_user)

@rental_owner_bp.route('/rental-owners', methods=['POST'])
@token_required
def create_rental_owner(current_user):
    """Create a new rental owner company"""
    return _create_rental_owner_data(current_user)

@rental_owner_bp.route('/rental-owners/<int:rental_owner_id>', methods=['PUT'])
@token_required
def update_rental_owner(current_user, rental_owner_id):
    """Update a property owner"""
    try:
        rental_owner = RentalOwner.query.get_or_404(rental_owner_id)
        data = request.get_json()
        
        # Update fields
        if 'company_name' in data:
            rental_owner.company_name = data['company_name']
        if 'business_type' in data:
            rental_owner.business_type = data['business_type']
        if 'contact_email' in data:
            rental_owner.contact_email = data['contact_email']
        if 'contact_phone' in data:
            rental_owner.contact_phone = data['contact_phone']
        if 'city' in data:
            rental_owner.city = data['city']
        if 'state' in data:
            rental_owner.state = data['state']
        if 'zip_code' in data:
            rental_owner.zip_code = data['zip_code']
        
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
        rental_owner = RentalOwner.query.get_or_404(rental_owner_id)
        
        # Check if rental owner has properties
        if rental_owner.properties:
            return jsonify({
                'error': 'Cannot delete rental owner with properties. Please transfer or delete properties first.',
                'confirmation_required': True,
                'property_count': len(rental_owner.properties)
            }), 400
        
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
    """Force delete a rental owner and all associated properties"""
    try:
        rental_owner = RentalOwner.query.get_or_404(rental_owner_id)
        
        # Delete all associated properties
        for property in rental_owner.properties:
            db.session.delete(property)
        
        # Delete the rental owner
        db.session.delete(rental_owner)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Rental owner and all associated properties deleted successfully'
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
            return jsonify({'error': 'Please upload a CSV file'}), 400
        
        # Read CSV content
        csv_content = csv_file.read().decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        
        imported_count = 0
        errors = []
        
        for row_num, row in enumerate(csv_reader, start=2):  # Start at 2 because row 1 is header
            try:
                # Validate required fields
                if not row.get('company_name') or not row.get('contact_email'):
                    errors.append(f"Row {row_num}: Missing required fields (company_name, contact_email)")
                    continue
                
                # Check if rental owner already exists
                existing_owner = RentalOwner.query.filter_by(contact_email=row['contact_email']).first()
                if existing_owner:
                    errors.append(f"Row {row_num}: Rental owner with email {row['contact_email']} already exists")
                    continue
                
                # Create new rental owner
                rental_owner = RentalOwner(
                    company_name=row['company_name'],
                    business_type=row.get('business_type', 'Property Owner'),
                    contact_email=row['contact_email'],
                    contact_phone=row.get('contact_phone', ''),
                    email=row['contact_email'],
                    phone_number=row.get('contact_phone', ''),
                    city=row.get('city', ''),
                    state=row.get('state', ''),
                    zip_code=row.get('zip_code', ''),
                    is_active=True
                )
                
                db.session.add(rental_owner)
                imported_count += 1
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Successfully imported {imported_count} rental owners',
            'imported_count': imported_count,
            'errors': errors
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
        rental_owners = RentalOwner.query.filter_by(is_active=True).all()
        
        # Create CSV content
        output = io.StringIO()
        fieldnames = ['company_name', 'business_type', 'contact_email', 'contact_phone', 'city', 'state', 'zip_code']
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        
        writer.writeheader()
        for owner in rental_owners:
            writer.writerow({
                'company_name': owner.company_name,
                'business_type': owner.business_type,
                'contact_email': owner.contact_email,
                'contact_phone': owner.contact_phone,
                'city': owner.city,
                'state': owner.state,
                'zip_code': owner.zip_code
            })
        
        csv_content = output.getvalue()
        output.close()
        
        return jsonify({
            'success': True,
            'csv_content': csv_content,
            'filename': f'rental_owners_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        }), 200
        
    except Exception as e:
        print(f"Error exporting rental owners: {str(e)}")
        return jsonify({'error': str(e)}), 400