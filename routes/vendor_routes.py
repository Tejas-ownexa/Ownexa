from flask import Blueprint, request, jsonify
from models.vendor import Vendor
from models.user import User
from config import db
from routes.auth_routes import token_required
from datetime import datetime

vendor_bp = Blueprint('vendor_bp', __name__)

@vendor_bp.route('/register', methods=['POST'])
@token_required
def register_vendor(current_user):
    """Register a new vendor profile"""
    try:
        # Check if user already has a vendor profile
        existing_vendor = Vendor.query.filter_by(user_id=current_user.id).first()
        if existing_vendor:
            return jsonify({'error': 'Vendor profile already exists for this user'}), 400
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['vendor_type', 'business_name', 'phone_number', 'email', 'address']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate vendor type
        valid_types = [vt['value'] for vt in Vendor.get_vendor_types()]
        if data['vendor_type'] not in valid_types:
            return jsonify({'error': 'Invalid vendor type'}), 400
        
        # Create vendor profile
        vendor = Vendor(
            user_id=current_user.id,
            vendor_type=data['vendor_type'],
            business_name=data['business_name'],
            phone_number=data['phone_number'],
            email=data['email'],
            address=data['address'],
            license_number=data.get('license_number'),
            insurance_info=data.get('insurance_info'),
            hourly_rate=data.get('hourly_rate'),
            is_verified=False,
            is_active=True
        )
        
        db.session.add(vendor)
        db.session.commit()
        
        return jsonify({
            'message': 'Vendor profile created successfully',
            'vendor': {
                'id': vendor.id,
                'vendor_type': vendor.vendor_type,
                'business_name': vendor.business_name,
                'phone_number': vendor.phone_number,
                'email': vendor.email,
                'is_verified': vendor.is_verified,
                'is_active': vendor.is_active
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating vendor profile: {str(e)}")
        return jsonify({'error': str(e)}), 400

@vendor_bp.route('/profile', methods=['GET'])
@token_required
def get_vendor_profile(current_user):
    """Get vendor profile for current user"""
    try:
        vendor = Vendor.query.filter_by(user_id=current_user.id).first()
        if not vendor:
            return jsonify({'error': 'Vendor profile not found'}), 404
        
        return jsonify({
            'id': vendor.id,
            'vendor_type': vendor.vendor_type,
            'business_name': vendor.business_name,
            'phone_number': vendor.phone_number,
            'email': vendor.email,
            'address': vendor.address,
            'license_number': vendor.license_number,
            'insurance_info': vendor.insurance_info,
            'hourly_rate': float(vendor.hourly_rate) if vendor.hourly_rate else None,
            'is_verified': vendor.is_verified,
            'is_active': vendor.is_active,
            'created_at': vendor.created_at.isoformat() if vendor.created_at else None
        }), 200
        
    except Exception as e:
        print(f"Error fetching vendor profile: {str(e)}")
        return jsonify({'error': str(e)}), 400

@vendor_bp.route('/profile', methods=['PUT'])
@token_required
def update_vendor_profile(current_user):
    """Update vendor profile"""
    try:
        vendor = Vendor.query.filter_by(user_id=current_user.id).first()
        if not vendor:
            return jsonify({'error': 'Vendor profile not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'business_name' in data:
            vendor.business_name = data['business_name']
        if 'phone_number' in data:
            vendor.phone_number = data['phone_number']
        if 'email' in data:
            vendor.email = data['email']
        if 'address' in data:
            vendor.address = data['address']
        if 'license_number' in data:
            vendor.license_number = data['license_number']
        if 'insurance_info' in data:
            vendor.insurance_info = data['insurance_info']
        if 'hourly_rate' in data:
            vendor.hourly_rate = data['hourly_rate']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Vendor profile updated successfully',
            'vendor': {
                'id': vendor.id,
                'business_name': vendor.business_name,
                'phone_number': vendor.phone_number,
                'email': vendor.email,
                'is_verified': vendor.is_verified,
                'is_active': vendor.is_active
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating vendor profile: {str(e)}")
        return jsonify({'error': str(e)}), 400

@vendor_bp.route('/types', methods=['GET'])
def get_vendor_types():
    """Get all available vendor types"""
    try:
        vendor_types = Vendor.get_vendor_types()
        return jsonify(vendor_types), 200
    except Exception as e:
        print(f"Error fetching vendor types: {str(e)}")
        return jsonify({'error': str(e)}), 400

@vendor_bp.route('/list', methods=['GET'])
@token_required
def get_vendors(current_user):
    """Get all active vendors (for property owners)"""
    try:
        # Only property owners can view vendor list
        if current_user.role not in ['OWNER', 'AGENT']:
            return jsonify({'error': 'Access denied'}), 403
        
        vendor_type = request.args.get('type')
        query = Vendor.query.filter_by(is_active=True)
        
        if vendor_type:
            query = query.filter_by(vendor_type=vendor_type)
        
        vendors = query.all()
        
        return jsonify([{
            'id': vendor.id,
            'vendor_type': vendor.vendor_type,
            'business_name': vendor.business_name,
            'phone_number': vendor.phone_number,
            'email': vendor.email,
            'hourly_rate': float(vendor.hourly_rate) if vendor.hourly_rate else None,
            'is_verified': vendor.is_verified,
            'user': {
                'id': vendor.user.id,
                'full_name': f"{vendor.user.first_name} {vendor.user.last_name}",
                'username': vendor.user.username
            } if vendor.user else None
        } for vendor in vendors]), 200
        
    except Exception as e:
        print(f"Error fetching vendors: {str(e)}")
        return jsonify({'error': str(e)}), 400

@vendor_bp.route('/<int:vendor_id>/assignments', methods=['GET'])
@token_required
def get_vendor_assignments(current_user, vendor_id):
    """Get maintenance assignments for a vendor"""
    try:
        vendor = Vendor.query.get_or_404(vendor_id)
        
        # Check if current user is the vendor or a property owner
        if vendor.user_id != current_user.id and current_user.role not in ['OWNER', 'AGENT']:
            return jsonify({'error': 'Access denied'}), 403
        
        from models.maintenance import MaintenanceRequest
        assignments = MaintenanceRequest.query.filter_by(assigned_vendor_id=vendor_id).all()
        
        return jsonify([{
            'id': assignment.id,
            'request_title': assignment.request_title,
            'request_description': assignment.request_description,
            'priority': assignment.priority,
            'status': assignment.status,
            'request_date': assignment.request_date.isoformat() if assignment.request_date else None,
            'scheduled_date': assignment.scheduled_date.isoformat() if assignment.scheduled_date else None,
            'estimated_cost': float(assignment.estimated_cost) if assignment.estimated_cost else None,
            'actual_cost': float(assignment.actual_cost) if assignment.actual_cost else None,
            'property': {
                'id': assignment.property.id,
                'title': assignment.property.title,
                'address': f"{assignment.property.street_address_1}, {assignment.property.city}"
            } if assignment.property else None,
            'tenant': {
                'id': assignment.tenant.id,
                'full_name': f"{assignment.tenant.first_name} {assignment.tenant.last_name}",
                'phone_number': assignment.tenant.phone_number
            } if assignment.tenant else None
        } for assignment in assignments]), 200
        
    except Exception as e:
        print(f"Error fetching vendor assignments: {str(e)}")
        return jsonify({'error': str(e)}), 400
