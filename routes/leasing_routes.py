from flask import Blueprint, request, jsonify
from models.leasing import (
    PropertyUnitDetail, PropertyListingStatus, LeasingApplicant, ApplicantGroup,
    ApplicantGroupMember, LeaseDraft, DraftLeaseApprovedApplicant, DraftLeaseRecurringCharge,
    DraftLeaseOneTimeCharge, DraftLeaseRentCharge, DraftLeaseMoveInCharge, DraftLeaseSignature
)
from models.property import Property
from config import db
from routes.auth_routes import token_required
from datetime import datetime

leasing_bp = Blueprint('leasing', __name__)

# =================== LEASING APPLICANTS ===================

@leasing_bp.route('/applicants', methods=['GET'])
@token_required
def get_leasing_applicants(current_user):
    """Get all leasing applicants with filtering options"""
    try:
        # Get query parameters for filtering
        property_id = request.args.get('property_id')
        status = request.args.get('status')
        stage = request.args.get('stage')
        
        query = LeasingApplicant.query
        
        # Apply filters
        if property_id:
            query = query.filter(LeasingApplicant.property_id == property_id)
        if status:
            query = query.filter(LeasingApplicant.application_status == status)
        if stage:
            query = query.filter(LeasingApplicant.stage_in_process == stage)
        
        # Get applicants with property information
        applicants = query.all()
        
        result = []
        for applicant in applicants:
            applicant_data = applicant.to_dict()
            # Add full_name for compatibility
            applicant_data['full_name'] = applicant.get_full_name()
            if applicant.property:
                applicant_data['property'] = {
                    'id': applicant.property.id,
                    'title': applicant.property.title,
                    'address': f"{applicant.property.street_address_1}, {applicant.property.city}, {applicant.property.state}",
                    'monthly_rent': float(applicant.property.rent_amount) if applicant.property.rent_amount else None
                }
            result.append(applicant_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@leasing_bp.route('/applicants', methods=['POST'])
@token_required
def create_leasing_applicant(current_user):
    """Create a new leasing applicant"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Required fields
        required_fields = ['property_id', 'full_name', 'email']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Verify property exists
        property_obj = Property.query.get(data['property_id'])
        if not property_obj:
            return jsonify({'error': 'Property not found'}), 404
        
        # Parse full_name into first_name and last_name
        full_name = data['full_name']
        name_parts = full_name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        # Create new applicant
        applicant = LeasingApplicant(
            property_id=data['property_id'],
            first_name=first_name,
            last_name=last_name,
            email=data['email'],
            phone_number=data.get('phone_number'),
            employment_status=data.get('employment_status'),
            employer_name=data.get('employer_name'),
            monthly_income=data.get('monthly_income'),
            notes=data.get('notes')
        )
        
        db.session.add(applicant)
        db.session.commit()
        
        applicant_data = applicant.to_dict()
        applicant_data['full_name'] = applicant.get_full_name()
        
        return jsonify({
            'message': 'Applicant created successfully',
            'applicant_id': applicant.id,
            'applicant': applicant_data
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@leasing_bp.route('/applicants/<int:applicant_id>', methods=['PUT'])
@token_required
def update_leasing_applicant(current_user, applicant_id):
    """Update an existing leasing applicant"""
    try:
        applicant = LeasingApplicant.query.get(applicant_id)
        if not applicant:
            return jsonify({'error': 'Applicant not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update fields
        updateable_fields = [
            'email', 'phone_number', 'employment_status', 'employer_name',
            'monthly_income', 'application_status', 'background_check_status',
            'credit_check_status', 'references_verified', 'notes'
        ]
        
        for field in updateable_fields:
            if field in data:
                setattr(applicant, field, data[field])
        
        # Handle full_name update
        if 'full_name' in data:
            full_name = data['full_name']
            name_parts = full_name.split(' ', 1)
            applicant.first_name = name_parts[0]
            applicant.last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        # Update the updated_at timestamp
        applicant.updated_at = datetime.utcnow()
        db.session.commit()
        
        applicant_data = applicant.to_dict()
        applicant_data['full_name'] = applicant.get_full_name()
        
        return jsonify({
            'message': 'Applicant updated successfully',
            'applicant': applicant_data
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@leasing_bp.route('/applicants/<int:applicant_id>/status', methods=['PATCH'])
@token_required
def update_applicant_status(current_user, applicant_id):
    """Update applicant application status (approve/reject)"""
    try:
        applicant = LeasingApplicant.query.get(applicant_id)
        if not applicant:
            return jsonify({'error': 'Applicant not found'}), 404
        
        data = request.get_json()
        if not data or 'status' not in data:
            return jsonify({'error': 'Status is required'}), 400
        
        new_status = data['status']
        valid_statuses = ['Approved', 'Rejected', 'Under Review', 'Pending']
        
        if new_status not in valid_statuses:
            return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
        
        # Update the status
        applicant.application_status = new_status
        applicant.updated_at = datetime.utcnow()
        
        # Handle rejection reason
        if new_status == 'Rejected':
            rejection_reason = data.get('rejection_reason', '')
            if not rejection_reason:
                return jsonify({'error': 'Rejection reason is required when rejecting an application'}), 400
            applicant.rejection_reason = rejection_reason
        else:
            # Clear rejection reason if status is not rejected
            applicant.rejection_reason = None
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Application status updated to {new_status}',
            'applicant_id': applicant.id,
            'new_status': new_status,
            'rejection_reason': applicant.rejection_reason if new_status == 'Rejected' else None
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@leasing_bp.route('/applicants/<int:applicant_id>', methods=['DELETE'])
@token_required
def delete_applicant(current_user, applicant_id):
    """Delete a leasing applicant"""
    try:
        applicant = LeasingApplicant.query.get(applicant_id)
        if not applicant:
            return jsonify({'error': 'Applicant not found'}), 404
        
        # Store applicant name for response
        applicant_name = applicant.get_full_name()
        
        # Delete the applicant
        db.session.delete(applicant)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Application for {applicant_name} deleted successfully',
            'applicant_id': applicant_id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# =================== APPLICANT GROUPS ===================

@leasing_bp.route('/applicant-groups', methods=['GET'])
@token_required
def get_applicant_groups(current_user):
    """Get all applicant groups with filtering options"""
    try:
        property_id = request.args.get('property_id')
        status = request.args.get('status')
        
        query = ApplicantGroup.query
        
        if property_id:
            query = query.filter(ApplicantGroup.property_id == property_id)
        if status:
            query = query.filter(ApplicantGroup.group_status == status)
        
        groups = query.all()
        
        result = []
        for group in groups:
            group_data = group.to_dict()
            
            # Add property information
            if group.property:
                group_data['property'] = {
                    'id': group.property.id,
                    'title': group.property.title,
                    'address': f"{group.property.street_address_1}, {group.property.city}, {group.property.state}",
                    'monthly_rent': float(group.property.rent_amount) if group.property.rent_amount else None
                }
            
            # Add member information
            group_data['members'] = []
            for member in group.members:
                member_data = member.to_dict()
                if member.applicant:
                    member_data['applicant'] = {
                        'id': member.applicant.id,
                        'full_name': member.applicant.full_name,
                        'email': member.applicant.email,
                        'phone_number': member.applicant.phone_number
                    }
                group_data['members'].append(member_data)
            
            result.append(group_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@leasing_bp.route('/applicant-groups', methods=['POST'])
@token_required
def create_applicant_group(current_user):
    """Create a new applicant group"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Required fields
        if 'property_id' not in data:
            return jsonify({'error': 'Missing required field: property_id'}), 400
        
        # Verify property exists
        property_obj = Property.query.get(data['property_id'])
        if not property_obj:
            return jsonify({'error': 'Property not found'}), 404
        
        # Create new group
        group = ApplicantGroup(
            property_id=data['property_id'],
            group_name=data.get('group_name'),
            unit_number=data.get('unit_number'),
            group_status=data.get('group_status', 'Pending'),
            percent_complete=data.get('percent_complete', 0),
            max_members=data.get('max_members'),
            is_joint_application=data.get('is_joint_application', True),
            group_notes=data.get('group_notes')
        )
        
        db.session.add(group)
        db.session.flush()  # Get the ID before committing
        
        # Add members if provided
        if 'members' in data and data['members']:
            for member_data in data['members']:
                if 'applicant_id' in member_data:
                    member = ApplicantGroupMember(
                        group_id=group.id,
                        applicant_id=member_data['applicant_id'],
                        member_role=member_data.get('member_role', 'Member'),
                        is_primary=member_data.get('is_primary', False)
                    )
                    db.session.add(member)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Applicant group created successfully',
            'group_id': group.id,
            'group': group.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@leasing_bp.route('/applicant-groups/<int:group_id>/status', methods=['PATCH'])
@token_required
def update_group_status(current_user, group_id):
    """Update applicant group status (approve/reject)"""
    try:
        group = ApplicantGroup.query.get(group_id)
        if not group:
            return jsonify({'error': 'Applicant group not found'}), 404
        
        data = request.get_json()
        if not data or 'status' not in data:
            return jsonify({'error': 'Status is required'}), 400
        
        new_status = data['status']
        valid_statuses = ['Active', 'Inactive', 'Pending']
        
        if new_status not in valid_statuses:
            return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
        
        # Update the status
        group.status = new_status
        group.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Group status updated to {new_status}',
            'group_id': group.id,
            'new_status': new_status
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@leasing_bp.route('/applicant-groups/<int:group_id>', methods=['DELETE'])
@token_required
def delete_applicant_group(current_user, group_id):
    """Delete an applicant group"""
    try:
        group = ApplicantGroup.query.get(group_id)
        if not group:
            return jsonify({'error': 'Applicant group not found'}), 404
        
        # Store group name for response
        group_name = group.name
        
        # Delete the group (this will also delete associated members due to cascade)
        db.session.delete(group)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Group "{group_name}" deleted successfully',
            'group_id': group_id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@leasing_bp.route('/create-lease-from-applicant', methods=['POST'])
@token_required
def create_lease_from_applicant(current_user):
    """Create a lease from an approved applicant"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = [
            'applicant_id', 'property_id', 'tenant_first_name', 'tenant_last_name',
            'tenant_email', 'lease_start_date', 'lease_end_date', 'monthly_rent',
            'security_deposit', 'move_in_date'
        ]
        
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Get the approved applicant
        applicant = LeasingApplicant.query.get(data['applicant_id'])
        if not applicant:
            return jsonify({'error': 'Applicant not found'}), 404
        
        if applicant.application_status != 'Approved':
            return jsonify({'error': 'Only approved applicants can be converted to leases'}), 400
        
        # Get the property
        from models.property import Property
        property = Property.query.get(data['property_id'])
        if not property:
            return jsonify({'error': 'Property not found'}), 404
        
        if property.status != 'available':
            return jsonify({'error': 'Property is not available for lease'}), 400
        
        # Create the tenant record
        from models.tenant import Tenant
        tenant = Tenant(
            full_name=f"{data['tenant_first_name']} {data['tenant_last_name']}".strip(),
            email=data['tenant_email'],
            phone_number=data.get('tenant_phone', ''),
            property_id=data['property_id'],
            lease_start=datetime.strptime(data['lease_start_date'], '%Y-%m-%d').date(),
            lease_end=datetime.strptime(data['lease_end_date'], '%Y-%m-%d').date(),
            rent_amount=float(data['monthly_rent']),
            rent_payment_day=data.get('rent_payment_day', 1)
        )
        
        db.session.add(tenant)
        
        # Update property status to occupied
        property.status = 'occupied'
        property.updated_at = datetime.utcnow()
        
        # Update applicant status to indicate lease created
        applicant.application_status = 'Lease Created'
        applicant.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Lease created successfully for {tenant.full_name}',
            'tenant_id': tenant.id,
            'property_id': property.id
        }), 201
        
    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': f'Invalid date format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# =================== DRAFT LEASES ===================

@leasing_bp.route('/draft-leases', methods=['GET'])
@token_required
def get_draft_leases(current_user):
    """Get all draft leases with filtering options"""
    try:
        property_id = request.args.get('property_id')
        status = request.args.get('status')
        
        query = LeaseDraft.query
        
        if property_id:
            query = query.filter(LeaseDraft.property_id == property_id)
        if status:
            query = query.filter(LeaseDraft.draft_status == status)
        
        drafts = query.all()
        
        result = []
        for draft in drafts:
            draft_data = draft.to_dict()
            
            # Add property information
            if draft.property:
                draft_data['property'] = {
                    'id': draft.property.id,
                    'title': draft.property.title,
                    'address': f"{draft.property.street_address_1}, {draft.property.city}, {draft.property.state}"
                }
            
            # Add applicant information
            if draft.applicant:
                draft_data['applicant'] = {
                    'id': draft.applicant.id,
                    'full_name': draft.applicant.full_name,
                    'email': draft.applicant.email
                }
            
            result.append(draft_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@leasing_bp.route('/draft-leases', methods=['POST'])
@token_required
def create_draft_lease(current_user):
    """Create a new draft lease"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Required fields
        required_fields = ['property_id', 'draft_name', 'monthly_rent']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Verify property exists
        property_obj = Property.query.get(data['property_id'])
        if not property_obj:
            return jsonify({'error': 'Property not found'}), 404
        
        # Create new draft lease
        draft = LeaseDraft(
            property_id=data['property_id'],
            applicant_id=data.get('applicant_id'),
            created_by=current_user.id,
            draft_name=data['draft_name'],
            lease_type=data.get('lease_type', 'Fixed Term'),
            lease_start_date=datetime.strptime(data['lease_start_date'], '%Y-%m-%d').date() if data.get('lease_start_date') else None,
            lease_end_date=datetime.strptime(data['lease_end_date'], '%Y-%m-%d').date() if data.get('lease_end_date') else None,
            lease_term_months=data.get('lease_term_months'),
            monthly_rent=data['monthly_rent'],
            security_deposit=data.get('security_deposit', 0.00),
            first_month_rent=data.get('first_month_rent'),
            last_month_rent=data.get('last_month_rent', 0.00),
            pet_deposit=data.get('pet_deposit', 0.00),
            application_fee=data.get('application_fee', 0.00),
            late_fee_amount=data.get('late_fee_amount', 0.00),
            late_fee_grace_days=data.get('late_fee_grace_days', 5),
            utilities_tenant_pays=data.get('utilities_tenant_pays'),
            utilities_landlord_pays=data.get('utilities_landlord_pays'),
            parking_included=data.get('parking_included', False),
            pet_policy=data.get('pet_policy'),
            subletting_allowed=data.get('subletting_allowed', False),
            smoking_allowed=data.get('smoking_allowed', False),
            special_terms=data.get('special_terms'),
            custom_clauses=data.get('custom_clauses')
        )
        
        db.session.add(draft)
        db.session.commit()
        
        return jsonify({
            'message': 'Draft lease created successfully',
            'draft_id': draft.id,
            'draft': draft.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# =================== PROPERTY LISTING STATUS ===================

@leasing_bp.route('/property-listing-status', methods=['GET'])
@token_required
def get_property_listing_statuses(current_user):
    """Get property listing statuses"""
    try:
        property_id = request.args.get('property_id')
        is_listed = request.args.get('is_listed')
        
        query = PropertyListingStatus.query
        
        if property_id:
            query = query.filter(PropertyListingStatus.property_id == property_id)
        if is_listed is not None:
            query = query.filter(PropertyListingStatus.is_listed == (is_listed.lower() == 'true'))
        
        statuses = query.all()
        
        result = []
        for status in statuses:
            status_data = status.to_dict()
            
            # Add property information
            if status.property:
                status_data['property'] = {
                    'id': status.property.id,
                    'title': status.property.title,
                    'address': f"{status.property.street_address_1}, {status.property.city}, {status.property.state}",
                    'rent_amount': float(status.property.rent_amount) if status.property.rent_amount else 0
                }
            
            result.append(status_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@leasing_bp.route('/property-listing-status', methods=['POST'])
@token_required
def create_property_listing_status(current_user):
    """Create or update property listing status"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if 'property_id' not in data:
            return jsonify({'error': 'Missing required field: property_id'}), 400
        
        # Check if status already exists for this property
        existing_status = PropertyListingStatus.query.filter_by(property_id=data['property_id']).first()
        
        if existing_status:
            # Update existing status
            for field in ['is_listed', 'listing_date', 'listing_rent', 'listing_status', 
                         'availability_date', 'listing_description', 'current_lease_end', 
                         'next_lease_start', 'lease_transition_status']:
                if field in data:
                    if field in ['listing_date', 'availability_date', 'current_lease_end', 'next_lease_start'] and data[field]:
                        setattr(existing_status, field, datetime.strptime(data[field], '%Y-%m-%d').date())
                    else:
                        setattr(existing_status, field, data[field])
            
            db.session.commit()
            
            return jsonify({
                'message': 'Property listing status updated successfully',
                'status': existing_status.to_dict()
            }), 200
        else:
            # Create new status
            status = PropertyListingStatus(
                property_id=data['property_id'],
                is_listed=data.get('is_listed', False),
                listing_date=datetime.strptime(data['listing_date'], '%Y-%m-%d').date() if data.get('listing_date') else None,
                listing_rent=data.get('listing_rent'),
                listing_status=data.get('listing_status', 'Draft'),
                availability_date=datetime.strptime(data['availability_date'], '%Y-%m-%d').date() if data.get('availability_date') else None,
                listing_description=data.get('listing_description'),
                listing_agent_id=data.get('listing_agent_id', current_user.id)
            )
            
            db.session.add(status)
            db.session.commit()
            
            return jsonify({
                'message': 'Property listing status created successfully',
                'status_id': status.id,
                'status': status.to_dict()
            }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# =================== HELPER ENDPOINTS ===================

@leasing_bp.route('/available-properties', methods=['GET'])
@token_required
def get_available_properties(current_user):
    """Get properties that are available for leasing (no active tenants)"""
    try:
        # Get properties owned by the current user that don't have active tenants
        from models.tenant import Tenant
        from datetime import date
        
        # Get all properties owned by the user
        user_properties = Property.query.filter_by(owner_id=current_user.id).all()
        
        available_properties = []
        for property in user_properties:
            # Check if property has any active tenants (lease_end is in the future or null)
            active_tenants = Tenant.query.filter(
                Tenant.property_id == property.id,
                (Tenant.lease_end.is_(None)) | (Tenant.lease_end >= date.today())
            ).count()
            
            # If no active tenants, property is available
            if active_tenants == 0:
                available_properties.append({
                    'id': property.id,
                    'title': property.title,
                    'street_address_1': property.street_address_1,
                    'city': property.city,
                    'state': property.state,
                    'zip_code': property.zip_code,
                    'rent_amount': float(property.rent_amount) if property.rent_amount else 0,
                    'status': property.status
                })
        
        return jsonify(available_properties), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@leasing_bp.route('/dashboard-stats', methods=['GET'])
@token_required
def get_leasing_dashboard_stats(current_user):
    """Get leasing dashboard statistics"""
    try:
        # Get counts for different categories
        total_applicants = LeasingApplicant.query.count()
        pending_applicants = LeasingApplicant.query.filter_by(application_status='Submitted').count()
        approved_applicants = LeasingApplicant.query.filter_by(application_status='Approved').count()
        
        total_groups = ApplicantGroup.query.count()
        pending_groups = ApplicantGroup.query.filter_by(group_status='Pending').count()
        
        total_drafts = LeaseDraft.query.count()
        draft_status = LeaseDraft.query.filter_by(draft_status='Draft').count()
        
        listed_properties = PropertyListingStatus.query.filter_by(is_listed=True).count()
        
        return jsonify({
            'applicants': {
                'total': total_applicants,
                'pending': pending_applicants,
                'approved': approved_applicants
            },
            'groups': {
                'total': total_groups,
                'pending': pending_groups
            },
            'draft_leases': {
                'total': total_drafts,
                'in_draft': draft_status
            },
            'listed_properties': listed_properties
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@leasing_bp.route('/lease-renewals', methods=['GET'])
@token_required
def get_lease_renewals(current_user):
    """Get lease renewals data for the Not Started section"""
    try:
        from datetime import date, timedelta
        from models.tenant import Tenant
        from models.property import Property
        from models.rental_owner import RentalOwner
        
        # Get all properties owned by the current user
        if current_user.role == 'ADMIN' or current_user.username == 'admin':
            properties = Property.query.all()
        else:
            properties = Property.query.filter(Property.owner_id == current_user.id).all()
        
        property_ids = [p.id for p in properties]
        
        # Get tenants with their lease information and property details
        tenants_with_leases = db.session.query(
            Tenant,
            Property.title.label('property_title'),
            Property.street_address_1,
            Property.street_address_2,
            Property.apt_number,
            Property.city,
            Property.state,
            Property.zip_code,
            RentalOwner.company_name.label('rental_owner_company')
        ).join(
            Property, Tenant.property_id == Property.id
        ).outerjoin(
            RentalOwner, Property.rental_owner_id == RentalOwner.id
        ).filter(
            Tenant.property_id.in_(property_ids),
            Tenant.lease_end.isnot(None)  # Only tenants with lease end dates
        ).all()
        
        lease_renewals = []
        today = date.today()
        
        for tenant, property_title, street_address, street_address_2, apt_number, city, state, zip_code, rental_owner_company in tenants_with_leases:
            if tenant.lease_end:
                # Calculate days left until lease completion
                days_left = (tenant.lease_end - today).days
                
                # Include all leases (both active and expired)
                # Format current terms
                lease_start = tenant.lease_start.strftime('%m/%d/%Y') if tenant.lease_start else 'N/A'
                lease_end = tenant.lease_end.strftime('%m/%d/%Y') if tenant.lease_end else 'N/A'
                current_terms = f"{lease_start} - {lease_end}"
                
                # Format property address
                address_parts = [street_address]
                if street_address_2:
                    address_parts.append(street_address_2)
                if apt_number:
                    address_parts.append(f"Apt {apt_number}")
                address_parts.extend([city, state, zip_code])
                full_address = ", ".join(filter(None, address_parts))
                
                # Format lease identifier
                lease_identifier = f"{property_title} - {tenant.full_name}"
                
                lease_renewal = {
                    'id': tenant.id,
                    'daysLeft': days_left,
                    'lease': lease_identifier,
                    'currentTerms': current_terms,
                    'rentalOwners': rental_owner_company or 'N/A',
                    'propertyTitle': property_title,
                    'propertyAddress': full_address,
                    'tenantName': tenant.full_name,
                    'rentAmount': float(tenant.rent_amount) if tenant.rent_amount else 0.0,
                    'leaseStart': lease_start,
                    'leaseEnd': lease_end,
                    'status': 'Active' if days_left > 0 else 'Expired'
                }
                
                lease_renewals.append(lease_renewal)
        
        # Sort by days left (ascending - closest to expiration first)
        lease_renewals.sort(key=lambda x: x['daysLeft'])
        
        return jsonify({
            'lease_renewals': lease_renewals,
            'total_count': len(lease_renewals)
        }), 200
        
    except Exception as e:
        print(f"Error fetching lease renewals: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
