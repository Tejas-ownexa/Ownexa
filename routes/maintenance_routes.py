from flask import Blueprint, request, jsonify
from models.maintenance import MaintenanceRequest
from models.property import Property
from models.tenant import Tenant
from models.vendor import Vendor
from config import db
from routes.auth_routes import token_required
from datetime import datetime
from sqlalchemy.orm import joinedload
from sqlalchemy import or_
from utils.tenant_utils import get_comprehensive_tenant_info

maintenance_bp = Blueprint('maintenance_bp', __name__)

@maintenance_bp.route('/requests', methods=['POST'])
@token_required
def create_maintenance_request(current_user):
    """Create a new maintenance request"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['property_id', 'request_title', 'request_description', 'priority']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Find tenant for this user and property
        tenant = Tenant.query.filter_by(
            property_id=data['property_id']
        ).filter(
            Tenant.email == current_user.email
        ).first()
        
        if not tenant:
            return jsonify({'error': 'Tenant not found for this property'}), 404
        
        # Create maintenance request
        maintenance_request = MaintenanceRequest(
            tenant_id=tenant.id,
            property_id=data['property_id'],
            request_title=data['request_title'],
            request_description=data['request_description'],
            priority=data['priority'],
            status=MaintenanceRequest.STATUS_PENDING,
            tenant_notes=data.get('tenant_notes'),
            request_date=datetime.strptime(data.get('request_date', datetime.now().strftime('%Y-%m-%d')), '%Y-%m-%d').date()
        )
        
        db.session.add(maintenance_request)
        db.session.commit()
        
        return jsonify({
            'message': 'Maintenance request created successfully',
            'request_id': maintenance_request.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating maintenance request: {str(e)}")
        return jsonify({'error': str(e)}), 400

@maintenance_bp.route('/requests', methods=['GET'])
@token_required
def get_maintenance_requests(current_user):
    """Get maintenance requests based on user role"""
    try:
        print("Getting maintenance requests for user:", current_user.id)
        
        if current_user.role in ['OWNER', 'AGENT']:
            # Property owners see all requests for their properties
            requests = MaintenanceRequest.query.join(Property).filter(
                Property.owner_id == current_user.id
            ).options(
                joinedload(MaintenanceRequest.property),
                joinedload(MaintenanceRequest.tenant).joinedload(Tenant.property),
                joinedload(MaintenanceRequest.assigned_vendor)
            ).all()
        elif current_user.role == 'VENDOR':
            # Vendors see their assigned requests AND pending requests matching their vendor types
            vendors = Vendor.query.filter_by(user_id=current_user.id).all()
            if not vendors:
                return jsonify({'error': 'Vendor profile not found'}), 404
            
            # Get all vendor IDs and types for this user
            vendor_ids = [v.id for v in vendors]
            vendor_types = [v.vendor_type for v in vendors]
            
            # Get assigned requests for any of this user's vendor profiles
            assigned_requests = MaintenanceRequest.query.filter(
                MaintenanceRequest.assigned_vendor_id.in_(vendor_ids)
            ).options(
                joinedload(MaintenanceRequest.property),
                joinedload(MaintenanceRequest.tenant).joinedload(Tenant.property)
            ).all()
            
            # Get pending requests that match any of this user's vendor types or are general
            vendor_type_conditions = [MaintenanceRequest.vendor_type_needed == vtype for vtype in vendor_types]
            vendor_type_conditions.append(MaintenanceRequest.vendor_type_needed == 'general')
            # Removed legacy condition - all requests should now have vendor_type_needed set
            
            pending_requests = MaintenanceRequest.query.filter_by(
                status=MaintenanceRequest.STATUS_PENDING
            ).filter(
                MaintenanceRequest.assigned_vendor_id.is_(None)
            ).filter(
                or_(*vendor_type_conditions)
            ).options(
                joinedload(MaintenanceRequest.property),
                joinedload(MaintenanceRequest.tenant).joinedload(Tenant.property)
            ).all()
            
            # Combine both lists
            requests = assigned_requests + pending_requests
        else:
            # Tenants see their own requests
            tenant = Tenant.query.filter_by(email=current_user.email).first()
            if not tenant:
                return jsonify({'error': 'Tenant not found'}), 404
            
            requests = MaintenanceRequest.query.filter_by(
                tenant_id=tenant.id
            ).options(
                joinedload(MaintenanceRequest.property),
                joinedload(MaintenanceRequest.assigned_vendor)
            ).all()
        
        print(f"Found {len(requests)} maintenance requests")
        
        requests_data = []
        for req in requests:
            request_data = {
                'id': req.id,
                'request_title': req.request_title,
                'request_description': req.request_description,
                'priority': req.priority,
                'status': req.status,
                'request_date': req.request_date.isoformat() if req.request_date else None,
                'scheduled_date': req.scheduled_date.isoformat() if req.scheduled_date else None,
                'completion_date': req.completion_date.isoformat() if req.completion_date else None,
                'estimated_cost': float(req.estimated_cost) if req.estimated_cost else None,
                'actual_cost': float(req.actual_cost) if req.actual_cost else None,
                'tenant_notes': req.tenant_notes,
                'vendor_notes': req.vendor_notes,
                'owner_notes': req.owner_notes,
                'property': {
                    'id': req.property.id,
                    'title': req.property.title,
                    'address': f"{req.property.street_address_1}, {req.property.city}"
                } if req.property else None,
                'tenant': get_comprehensive_tenant_info(req.tenant),
                'assigned_vendor': {
                    'id': req.assigned_vendor.id,
                    'business_name': req.assigned_vendor.business_name,
                    'vendor_type': req.assigned_vendor.vendor_type,
                    'phone_number': req.assigned_vendor.phone_number,
                    'email': req.assigned_vendor.email
                } if req.assigned_vendor else None
            }
            requests_data.append(request_data)
        
        print("Successfully processed maintenance requests")
        return jsonify(requests_data), 200
        
    except Exception as e:
        print(f"Error fetching maintenance requests: {str(e)}")
        return jsonify({'error': str(e)}), 400

@maintenance_bp.route('/requests/<int:request_id>/assign-vendor', methods=['POST'])
@token_required
def assign_vendor_to_request(current_user, request_id):
    """Assign a vendor to a maintenance request (property owners only)"""
    try:
        # Only property owners can assign vendors
        if current_user.role not in ['OWNER', 'AGENT']:
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        vendor_id = data.get('vendor_id')
        
        if not vendor_id:
            return jsonify({'error': 'Vendor ID is required'}), 400
        
        # Get the maintenance request
        maintenance_request = MaintenanceRequest.query.get_or_404(request_id)
        
        # Verify the property belongs to the current user
        if maintenance_request.property.owner_id != current_user.id:
            return jsonify({'error': 'Access denied to this maintenance request'}), 403
        
        # Get the vendor
        vendor = Vendor.query.get_or_404(vendor_id)
        
        # Assign vendor to request
        maintenance_request.assigned_vendor_id = vendor_id
        maintenance_request.status = MaintenanceRequest.STATUS_ASSIGNED
        
        if 'scheduled_date' in data:
            maintenance_request.scheduled_date = datetime.strptime(data['scheduled_date'], '%Y-%m-%d').date()
        
        if 'estimated_cost' in data:
            maintenance_request.estimated_cost = data['estimated_cost']
        
        if 'owner_notes' in data:
            maintenance_request.owner_notes = data['owner_notes']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Vendor assigned successfully',
            'request_id': maintenance_request.id,
            'vendor': {
                'id': vendor.id,
                'business_name': vendor.business_name,
                'vendor_type': vendor.vendor_type
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error assigning vendor: {str(e)}")
        return jsonify({'error': str(e)}), 400

@maintenance_bp.route('/requests/<int:request_id>/update-status', methods=['PUT'])
@token_required
def update_request_status(current_user, request_id):
    """Update maintenance request status"""
    try:
        data = request.get_json()
        new_status = data.get('status')
        notes = data.get('notes')
        
        if not new_status:
            return jsonify({'error': 'Status is required'}), 400
        
        maintenance_request = MaintenanceRequest.query.get_or_404(request_id)
        
        # Check permissions based on user role
        if current_user.role in ['OWNER', 'AGENT']:
            # Property owners can update any request for their properties
            if maintenance_request.property.owner_id != current_user.id:
                return jsonify({'error': 'Access denied'}), 403
            maintenance_request.owner_notes = notes
        elif current_user.role == 'VENDOR':
            # Vendors can update their assigned requests
            vendor = Vendor.query.filter_by(user_id=current_user.id).first()
            if not vendor or maintenance_request.assigned_vendor_id != vendor.id:
                return jsonify({'error': 'Access denied'}), 403
            maintenance_request.vendor_notes = notes
        else:
            # Tenants can update their own requests
            tenant = Tenant.query.filter_by(email=current_user.email).first()
            if not tenant or maintenance_request.tenant_id != tenant.id:
                return jsonify({'error': 'Access denied'}), 403
            maintenance_request.tenant_notes = notes
        
        # Update status
        maintenance_request.status = new_status
        
        # Update completion date if completed
        if new_status == MaintenanceRequest.STATUS_COMPLETED:
            maintenance_request.completion_date = datetime.now().date()
        
        # Update actual cost if provided
        if 'actual_cost' in data:
            maintenance_request.actual_cost = data['actual_cost']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Maintenance request status updated successfully',
            'request_id': maintenance_request.id,
            'status': maintenance_request.status
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating maintenance request status: {str(e)}")
        return jsonify({'error': str(e)}), 400

@maintenance_bp.route('/requests/<int:request_id>/self-assign', methods=['POST'])
@token_required
def self_assign_request(current_user, request_id):
    """Allow vendors to self-assign to pending maintenance requests"""
    try:
        # Only vendors can self-assign
        if current_user.role != 'VENDOR':
            return jsonify({'error': 'Access denied'}), 403
        
        # Get vendor profile
        vendor = Vendor.query.filter_by(user_id=current_user.id).first()
        if not vendor:
            return jsonify({'error': 'Vendor profile not found'}), 404
        
        # Get the maintenance request
        maintenance_request = MaintenanceRequest.query.get_or_404(request_id)
        
        # Check if request is pending and not assigned
        if maintenance_request.status != MaintenanceRequest.STATUS_PENDING:
            return jsonify({'error': 'Request is not available for assignment'}), 400
        
        if maintenance_request.assigned_vendor_id is not None:
            return jsonify({'error': 'Request is already assigned to another vendor'}), 400
        
        # Assign vendor to request
        maintenance_request.assigned_vendor_id = vendor.id
        maintenance_request.status = MaintenanceRequest.STATUS_ASSIGNED
        
        db.session.commit()
        
        return jsonify({
            'message': 'Successfully assigned to maintenance request',
            'request_id': maintenance_request.id,
            'vendor': {
                'id': vendor.id,
                'business_name': vendor.business_name,
                'vendor_type': vendor.vendor_type
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error self-assigning to request: {str(e)}")
        return jsonify({'error': str(e)}), 400

@maintenance_bp.route('/vendors', methods=['GET'])
@token_required
def get_available_vendors(current_user):
    """Get available vendors for maintenance requests"""
    try:
        # Only property owners can view vendors
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
                'full_name': f"{vendor.user.first_name} {vendor.user.last_name}"
            } if vendor.user else None
        } for vendor in vendors]), 200
        
    except Exception as e:
        print(f"Error fetching vendors: {str(e)}")
        return jsonify({'error': str(e)}), 400