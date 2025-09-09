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
            if applicant.property:
                applicant_data['property'] = {
                    'id': applicant.property.id,
                    'title': applicant.property.title,
                    'address': f"{applicant.property.street_address_1}, {applicant.property.city}, {applicant.property.state}"
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
        
        # Create new applicant
        applicant = LeasingApplicant(
            property_id=data['property_id'],
            full_name=data['full_name'],
            email=data['email'],
            phone_number=data.get('phone_number'),
            unit_number=data.get('unit_number'),
            move_in_date=datetime.strptime(data['move_in_date'], '%Y-%m-%d').date() if data.get('move_in_date') else None,
            desired_lease_term=data.get('desired_lease_term'),
            monthly_income=data.get('monthly_income'),
            employment_status=data.get('employment_status'),
            employer_name=data.get('employer_name'),
            notes=data.get('notes')
        )
        
        db.session.add(applicant)
        db.session.commit()
        
        return jsonify({
            'message': 'Applicant created successfully',
            'applicant_id': applicant.id,
            'applicant': applicant.to_dict()
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
            'full_name', 'email', 'phone_number', 'unit_number', 'move_in_date',
            'desired_lease_term', 'monthly_income', 'employment_status', 'employer_name',
            'application_status', 'stage_in_process', 'background_check_status',
            'credit_score', 'references_checked', 'notes'
        ]
        
        for field in updateable_fields:
            if field in data:
                if field == 'move_in_date' and data[field]:
                    setattr(applicant, field, datetime.strptime(data[field], '%Y-%m-%d').date())
                else:
                    setattr(applicant, field, data[field])
        
        applicant.last_updated = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Applicant updated successfully',
            'applicant': applicant.to_dict()
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
                    'address': f"{group.property.street_address_1}, {group.property.city}, {group.property.state}"
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
