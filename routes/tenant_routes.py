from flask import Blueprint, request, jsonify
from models.tenant import Tenant, RentRoll, OutstandingBalance
from models.property import Property
from models.rental_owner import RentalOwner, RentalOwnerManager
from config import db
from datetime import datetime, date
from calendar import monthrange
from decimal import Decimal
from routes.auth_routes import token_required

tenant_bp = Blueprint('tenant_bp', __name__)

def calculate_prorated_rent(monthly_rent, lease_start_date, rent_payment_day=1):
    """
    Calculate prorated rent for a tenant joining mid-month
    
    Args:
        monthly_rent (Decimal): Full monthly rent amount
        lease_start_date (date): Date when tenant moves in
        rent_payment_day (int): Day of month when rent is due (1-31)
    
    Returns:
        dict: {
            'prorated_amount': Decimal,
            'days_in_month': int,
            'days_tenant_stays': int,
            'daily_rate': Decimal,
            'next_full_payment_date': date
        }
    """
    if not isinstance(lease_start_date, date):
        lease_start_date = datetime.strptime(lease_start_date, '%Y-%m-%d').date()
    
    # Get the total days in the move-in month
    year = lease_start_date.year
    month = lease_start_date.month
    _, days_in_month = monthrange(year, month)
    
    # Calculate daily rent rate
    daily_rate = Decimal(str(monthly_rent)) / Decimal(str(days_in_month))
    
    # Determine the billing period for the first month
    # If lease starts before or on payment day, bill from lease start to payment day (same month)
    # If lease starts after payment day, bill from lease start to next payment day (next month)
    
    if lease_start_date.day <= rent_payment_day:
        # Bill from lease start to payment day in same month
        days_to_bill = rent_payment_day - lease_start_date.day + 1
        next_payment_month = month + 1 if month < 12 else 1
        next_payment_year = year if month < 12 else year + 1
    else:
        # Bill from lease start to next payment day
        if month == 12:
            next_payment_month = 1
            next_payment_year = year + 1
        else:
            next_payment_month = month + 1
            next_payment_year = year
        
        # Get days in next month for payment day calculation
        _, days_in_next_month = monthrange(next_payment_year, next_payment_month)
        actual_payment_day = min(rent_payment_day, days_in_next_month)
        
        # Days from lease start to end of current month
        days_current_month = days_in_month - lease_start_date.day + 1
        # Days from start of next month to payment day
        days_next_month = actual_payment_day
        
        days_to_bill = days_current_month + days_next_month
        
        # Recalculate daily rate considering both months
        _, days_in_next_month = monthrange(next_payment_year, next_payment_month)
        avg_days_per_month = (days_in_month + days_in_next_month) / 2
        daily_rate = Decimal(str(monthly_rent)) / Decimal(str(avg_days_per_month))
    
    # Calculate prorated amount
    prorated_amount = daily_rate * Decimal(str(days_to_bill))
    
    # Calculate next full payment date
    try:
        _, days_in_next_month = monthrange(next_payment_year, next_payment_month)
        actual_payment_day = min(rent_payment_day, days_in_next_month)
        next_full_payment_date = date(next_payment_year, next_payment_month, actual_payment_day)
    except ValueError:
        # Fallback to first day of next month
        next_full_payment_date = date(next_payment_year, next_payment_month, 1)
    
    return {
        'prorated_amount': round(prorated_amount, 2),
        'days_in_month': days_in_month,
        'days_tenant_stays': days_to_bill,
        'daily_rate': round(daily_rate, 2),
        'next_full_payment_date': next_full_payment_date,
        'calculation_note': f"Prorated for {days_to_bill} days at ${round(daily_rate, 2)}/day"
    }

@tenant_bp.route('/', methods=['POST'])
@token_required
def create_tenant(current_user):
    try:
        print("Tenant creation attempt received")
        print("Current user:", current_user.username)
        data = request.get_json()
        print("Tenant data received:", data)

        # Map frontend field names to backend field names
        tenant_data = {
            'full_name': data.get('name'),  # Keep for tenant table which still uses full_name
            'email': data.get('email'),
            'phone_number': data.get('phone'),
            'property_id': data.get('propertyId'),
            'lease_start': data.get('leaseStartDate'),
            'lease_end': data.get('leaseEndDate'),
            'rent_amount': data.get('rentAmount'),
            'rent_payment_day': data.get('rentPaymentDay', 1)  # Default to 1st of month
        }
        print("Mapped tenant data:", tenant_data)

        # Validate required fields (property_id is optional for future tenants)
        required_fields = ['full_name', 'email', 'phone_number']
        for field in required_fields:
            if not tenant_data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Check if tenant already exists
        existing_tenant = Tenant.query.filter_by(email=tenant_data['email']).first()
        if existing_tenant:
            # Update existing tenant instead of creating new one
            print(f"Updating existing tenant: {existing_tenant.email}")
            
            # Handle property assignment
            property = None
            if tenant_data.get('property_id'):
                property = Property.query.get(tenant_data['property_id'])
                if not property:
                    return jsonify({'error': 'Property not found'}), 404
                
                # Check if user owns this property
                if property.owner_id != current_user.id:
                    return jsonify({'error': 'Not authorized to add tenants to this property'}), 403

                # Check if property is available
                if property.status != 'available':
                    return jsonify({'error': 'Property is not available for rent'}), 400

                # Update existing tenant with property assignment
                existing_tenant.property_id = tenant_data['property_id']
                existing_tenant.lease_start = datetime.strptime(tenant_data['lease_start'], '%Y-%m-%d').date() if tenant_data.get('lease_start') else None
                existing_tenant.lease_end = datetime.strptime(tenant_data['lease_end'], '%Y-%m-%d').date() if tenant_data.get('lease_end') else None
                existing_tenant.rent_amount = property.rent_amount  # Use property's rent amount
                existing_tenant.rent_payment_day = tenant_data.get('rent_payment_day', 1)
                existing_tenant.payment_status = 'active'
                
                # Update property status
                property.status = 'occupied'
            else:
                # Update tenant without property assignment (future tenant)
                existing_tenant.property_id = None
                existing_tenant.lease_start = datetime.strptime(tenant_data['lease_start'], '%Y-%m-%d').date() if tenant_data.get('lease_start') else None
                existing_tenant.lease_end = datetime.strptime(tenant_data['lease_end'], '%Y-%m-%d').date() if tenant_data.get('lease_end') else None
                existing_tenant.rent_amount = tenant_data.get('rent_amount', 0)
                existing_tenant.rent_payment_day = tenant_data.get('rent_payment_day', 1)
                existing_tenant.payment_status = 'future'
            
            db.session.commit()
            print("Existing tenant updated successfully")
            
            return jsonify({
                'message': 'Tenant updated successfully',
                'tenant': {
                    'id': existing_tenant.id,
                    'full_name': existing_tenant.full_name,
                    'email': existing_tenant.email,
                    'phone_number': existing_tenant.phone_number,
                    'property_id': existing_tenant.property_id,
                    'lease_start': existing_tenant.lease_start.isoformat() if existing_tenant.lease_start else None,
                    'lease_end': existing_tenant.lease_end.isoformat() if existing_tenant.lease_end else None,
                    'rent_amount': float(existing_tenant.rent_amount),
                    'rent_payment_day': existing_tenant.rent_payment_day,
                    'payment_status': existing_tenant.payment_status
                }
            }), 200

        # Handle property assignment (optional for future tenants)
        property = None
        property_rent_amount = 0
        if tenant_data.get('property_id'):
            property = Property.query.get(tenant_data['property_id'])
            if not property:
                return jsonify({'error': 'Property not found'}), 404
            
            # Check if user owns this property
            if property.owner_id != current_user.id:
                return jsonify({'error': 'Not authorized to add tenants to this property'}), 403

            # Check if property is available
            if property.status != 'available':
                return jsonify({'error': 'Property is not available for rent'}), 400

            # Use property's rent amount
            property_rent_amount = property.rent_amount
        else:
            # For future tenants, use provided rent amount or default
            property_rent_amount = tenant_data.get('rent_amount', 0)

        # Create new tenant
        tenant = Tenant(
            full_name=tenant_data['full_name'],
            email=tenant_data['email'],
            phone_number=tenant_data['phone_number'],
            property_id=tenant_data.get('property_id'),  # Can be None for future tenants
            lease_start=datetime.strptime(tenant_data['lease_start'], '%Y-%m-%d').date() if tenant_data.get('lease_start') else None,
            lease_end=datetime.strptime(tenant_data['lease_end'], '%Y-%m-%d').date() if tenant_data.get('lease_end') else None,
            rent_amount=property_rent_amount,
            rent_payment_day=tenant_data.get('rent_payment_day', 1),
            payment_status='future' if not tenant_data.get('property_id') else 'active'
        )

        # Update property status only if property is assigned
        if property:
            property.status = 'occupied'

        print("Attempting to save tenant to database")
        db.session.add(tenant)
        db.session.flush()  # Get the tenant ID before committing
        
        # Calculate and create prorated rent entry if tenant is assigned to a property
        prorated_info = None
        if property and tenant.lease_start:
            lease_start_date = tenant.lease_start
            rent_payment_day = tenant.rent_payment_day
            monthly_rent = property.rent_amount
            
            # Calculate prorated rent for the first month
            prorated_info = calculate_prorated_rent(monthly_rent, lease_start_date, rent_payment_day)
            
            # Create a rent roll entry for the prorated first month
            prorated_rent_entry = RentRoll(
                tenant_id=tenant.id,
                property_id=tenant.property_id,
                payment_date=lease_start_date,  # Due on move-in date
                amount_paid=prorated_info['prorated_amount'],
                payment_method='Pending',
                status='pending',
                remarks=prorated_info['calculation_note']
            )
            
            db.session.add(prorated_rent_entry)
            print(f"Created prorated rent entry: ${prorated_info['prorated_amount']} for {prorated_info['days_tenant_stays']} days")
        
        db.session.commit()
        print("Tenant successfully saved to database")

        response_data = {
            'message': 'Tenant created successfully',
            'tenant': {
                'id': tenant.id,
                'full_name': tenant.full_name,
                'email': tenant.email,
                'phone_number': tenant.phone_number,
                'property_id': tenant.property_id,
                'lease_start': tenant.lease_start.isoformat(),
                'lease_end': tenant.lease_end.isoformat(),
                'rent_amount': float(tenant.rent_amount),
                'rent_payment_day': tenant.rent_payment_day,
                'payment_status': tenant.payment_status
            }
        }
        
        # Include prorated rent information if calculated
        if prorated_info:
            response_data['prorated_rent'] = {
                'first_month_amount': float(prorated_info['prorated_amount']),
                'days_prorated': prorated_info['days_tenant_stays'],
                'daily_rate': float(prorated_info['daily_rate']),
                'next_full_payment_date': prorated_info['next_full_payment_date'].isoformat(),
                'calculation_note': prorated_info['calculation_note']
            }
            response_data['message'] += f" First month prorated: ${prorated_info['prorated_amount']}"
        
        return jsonify(response_data), 201
    except Exception as e:
        print("Error creating tenant:", str(e))
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@tenant_bp.route('/', methods=['GET'])
@token_required
def get_tenants(current_user):
    try:
        print("Fetching tenants for user:", current_user.id)
        # Get all tenants for properties owned by the current user, plus unassigned tenants
        assigned_tenants = Tenant.query.join(Property).filter(
            Property.owner_id == current_user.id
        ).all()
        unassigned_tenants = Tenant.query.filter(Tenant.property_id.is_(None)).all()
        
        # Combine both lists
        tenants = assigned_tenants + unassigned_tenants
        print(f"Found {len(assigned_tenants)} assigned tenants and {len(unassigned_tenants)} unassigned tenants")
        
        tenant_list = []
        for tenant in tenants:
            try:
                tenant_data = {
                    'id': tenant.id,
                    'name': tenant.full_name,
                    'email': tenant.email,
                    'phone': tenant.phone_number,
                    'propertyId': tenant.property_id,
                    'leaseStartDate': tenant.lease_start.isoformat() if tenant.lease_start else None,
                    'leaseEndDate': tenant.lease_end.isoformat() if tenant.lease_end else None,
                    'rentAmount': str(tenant.rent_amount) if tenant.rent_amount else "0",
                    'status': tenant.payment_status or 'pending',
                    'created_at': tenant.created_at.isoformat() if tenant.created_at else None
                }
                
                # Handle property data (can be None for unassigned tenants)
                if tenant.property:
                    # Format address
                    property_address = []
                    if tenant.property.street_address_1:
                        property_address.append(tenant.property.street_address_1)
                    if tenant.property.street_address_2:
                        property_address.append(tenant.property.street_address_2)
                    if tenant.property.city:
                        property_address.append(tenant.property.city)
                    if tenant.property.state:
                        property_address.append(tenant.property.state)
                    if tenant.property.zip_code:
                        property_address.append(tenant.property.zip_code)
                    
                    tenant_data['property'] = {
                        'id': tenant.property.id,
                        'name': tenant.property.title,
                        'address': ', '.join(property_address),
                        'status': tenant.property.status
                    }
                else:
                    # For unassigned tenants
                    tenant_data['property'] = None
                
                tenant_list.append(tenant_data)
            except Exception as e:
                print(f"Error processing tenant {tenant.id}:", str(e))
                continue
                
        print("Successfully processed tenant list")
        response_data = {
            'items': tenant_list,
            'total': len(tenant_list),
            'page': 1,
            'size': len(tenant_list),
            'pages': 1
        }
        return jsonify(response_data), 200
    except Exception as e:
        print("Error fetching tenants:", str(e))
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print("Error fetching tenants:", str(e))
        return jsonify({'error': str(e)}), 400

@tenant_bp.route('/statistics/summary', methods=['GET'])
@token_required
def get_tenant_statistics(current_user):
    try:
        print("Fetching tenant statistics for user:", current_user.id)
        # Get all tenants for properties owned by the current user
        tenants = Tenant.query.join(Property).filter(
            Property.owner_id == current_user.id
        ).all()
        
        total_tenants = len(tenants)
        active_leases = sum(1 for t in tenants if t.payment_status == 'active')
        total_rent = sum(float(t.property.rent_amount) if t.property and t.property.rent_amount else 0 for t in tenants)
        
        stats = {
            'total_tenants': total_tenants,
            'active_leases': active_leases,
            'total_monthly_rent': total_rent,
            'occupancy_rate': round((active_leases / total_tenants * 100), 2) if total_tenants > 0 else 0
        }
        print("Tenant statistics:", stats)
        return jsonify(stats), 200
    except Exception as e:
        print("Error fetching tenant statistics:", str(e))
        return jsonify({'error': str(e)}), 400

@tenant_bp.route('/rent-roll', methods=['GET'])
@token_required
def get_rent_roll(current_user):
    try:
        rent_rolls = RentRoll.query\
            .join(Tenant)\
            .join(Property)\
            .filter(Property.owner_id == current_user.id)\
            .all()
            
        return jsonify([{
            'id': rent.id,
            'tenant_id': rent.tenant_id,
            'tenant_name': rent.tenant.full_name,
            'property_id': rent.property_id,
            'property_title': rent.property.title,
            'payment_date': rent.payment_date.isoformat(),
            'amount_paid': float(rent.amount_paid),
            'payment_method': rent.payment_method,
            'status': rent.status
        } for rent in rent_rolls]), 200
    except Exception as e:
        print("Error fetching rent roll:", str(e))
        return jsonify({'error': str(e)}), 400

@tenant_bp.route('/outstanding-balances', methods=['GET'])
@token_required
def get_outstanding_balances(current_user):
    try:
        balances = OutstandingBalance.query\
            .join(Tenant)\
            .join(Property)\
            .filter(Property.owner_id == current_user.id)\
            .filter(OutstandingBalance.is_resolved == False)\
            .all()
            
        return jsonify([{
            'id': balance.id,
            'tenant_id': balance.tenant_id,
            'tenant_name': balance.tenant.full_name,
            'property_id': balance.property_id,
            'property_title': balance.property.title,
            'due_amount': float(balance.due_amount),
            'due_date': balance.due_date.isoformat()
        } for balance in balances]), 200
    except Exception as e:
        print("Error fetching outstanding balances:", str(e))
        return jsonify({'error': str(e)}), 400

@tenant_bp.route('/my-unit', methods=['GET'])
@token_required
def get_my_unit(current_user):
    """Get tenant's rental unit information"""
    try:
        # Find the tenant record for the current user
        tenant = Tenant.query.filter_by(email=current_user.email).first()
        
        if not tenant:
            return jsonify({'error': 'Tenant record not found'}), 404
            
        # Get property details
        property = Property.query.get(tenant.property_id) if tenant.property_id else None
        
        # Calculate rent due (simple logic - can be enhanced)
        from datetime import date, timedelta
        today = date.today()
        next_month = today.replace(day=1) + timedelta(days=32)
        next_month = next_month.replace(day=1)
        
        tenant_data = {
            'id': tenant.id,
            'full_name': tenant.full_name,
            'email': tenant.email,
            'phone_number': tenant.phone_number,
            'lease_start': tenant.lease_start.isoformat() if tenant.lease_start else None,
            'lease_end': tenant.lease_end.isoformat() if tenant.lease_end else None,
            'rent_amount': float(tenant.rent_amount) if tenant.rent_amount else 0,
            'payment_status': tenant.payment_status or 'active',
            'rent_due_date': next_month.isoformat(),
            'property': {
                'id': property.id,
                'title': property.title,
                'street_address_1': property.street_address_1,
                'street_address_2': property.street_address_2,
                'apt_number': property.apt_number,
                'city': property.city,
                'state': property.state,
                'zip_code': property.zip_code,
                'description': property.description
            } if property else None
        }
        
        return jsonify(tenant_data), 200
        
    except Exception as e:
        print(f"Error fetching tenant unit: {str(e)}")
        return jsonify({'error': 'Failed to fetch tenant information'}), 500

@tenant_bp.route('/my-maintenance-requests', methods=['GET'])
@token_required
def get_my_maintenance_requests(current_user):
    """Get maintenance requests for the current tenant"""
    try:
        # Find the tenant record for the current user
        tenant = Tenant.query.filter_by(email=current_user.email).first()
        
        if not tenant:
            return jsonify({'maintenance_requests': []}), 200
            
        # Get maintenance requests for this tenant
        from models.maintenance import MaintenanceRequest
        requests = MaintenanceRequest.query.filter_by(tenant_id=tenant.id).all()
        
        requests_list = []
        for request in requests:
            requests_list.append({
                'id': request.id,
                'request_title': request.request_title,
                'request_description': request.request_description,
                'priority': request.priority,
                'status': request.status,
                'request_date': request.request_date.strftime('%Y-%m-%d') if request.request_date else None,
                'scheduled_date': request.scheduled_date.strftime('%Y-%m-%d') if request.scheduled_date else None,
                'completion_date': request.completion_date.strftime('%Y-%m-%d') if request.completion_date else None,
                'estimated_cost': float(request.estimated_cost) if request.estimated_cost else None,
                'actual_cost': float(request.actual_cost) if request.actual_cost else None,
                'tenant_notes': request.tenant_notes,
                'vendor_notes': request.vendor_notes,
                'owner_notes': request.owner_notes,
                'assigned_vendor': {
                    'id': request.assigned_vendor.id,
                    'business_name': request.assigned_vendor.business_name,
                    'vendor_type': request.assigned_vendor.vendor_type,
                    'phone_number': request.assigned_vendor.phone_number,
                    'email': request.assigned_vendor.email
                } if request.assigned_vendor else None,
                'property': {
                    'id': request.property.id,
                    'title': request.property.title,
                    'address': f"{request.property.street_address_1}, {request.property.city}"
                } if request.property else None
            })
        
        return jsonify({'maintenance_requests': requests_list}), 200
        
    except Exception as e:
        print(f"Error fetching tenant maintenance requests: {str(e)}")
        return jsonify({'maintenance_requests': []}), 500

@tenant_bp.route('/available-tenants', methods=['GET'])
@token_required
def get_available_tenants(current_user):
    """Get all registered users with TENANT role and unassigned tenants who are not currently assigned to any property"""
    try:
        available_tenants = []
        
        # 1. Get registered users with TENANT role (from user table)
        from models.user import User
        tenant_users = User.query.filter(User.role == 'TENANT').all()
        
        for user in tenant_users:
            # Check if this user is already assigned to a property as a tenant
            existing_tenant = Tenant.query.filter_by(email=user.email).first()
            if not existing_tenant or existing_tenant.property_id is None:
                available_tenants.append({
                    'id': user.id,  # Use numeric ID
                    'full_name': user.full_name,
                    'email': user.email,
                    'phone_number': user.phone_number,
                    'street_address_1': user.street_address_1,
                    'city': user.city,
                    'state': user.state,
                    'zip_code': user.zip_code,
                    'rent_amount': 'N/A',  # Will be set when assigned to property
                    'source': 'user',  # Track source for processing
                    'user_id': user.id  # Store original user ID
                })
        
        # 2. Get unassigned tenants (future tenants) from the tenants table
        unassigned_tenants = Tenant.query.filter(Tenant.property_id.is_(None)).all()
        
        # Start tenant IDs from a high number to avoid conflicts with user IDs
        tenant_id_offset = 10000
        for tenant in unassigned_tenants:
            available_tenants.append({
                'id': tenant_id_offset + tenant.id,  # Offset to avoid conflicts with user IDs
                'full_name': tenant.full_name,
                'email': tenant.email,
                'phone_number': tenant.phone_number,
                'street_address_1': None,  # Future tenants don't have address until assigned
                'city': None,
                'state': None,
                'zip_code': None,
                'rent_amount': str(tenant.rent_amount) if tenant.rent_amount else 'N/A',
                'source': 'tenant',  # Track source for processing
                'tenant_id': tenant.id  # Store original tenant ID
            })
        
        print(f"Found {len(available_tenants)} available tenants:")
        print(f"  - {len(tenant_users)} from user table (TENANT role)")
        print(f"  - {len(unassigned_tenants)} from tenant table (unassigned)")
        return jsonify({'available_tenants': available_tenants}), 200
    except Exception as e:
        print(f"Error fetching available tenants: {str(e)}")
        return jsonify({'error': 'Failed to fetch available tenants'}), 500

@tenant_bp.route('/calculate-prorated-rent', methods=['POST'])
@token_required
def calculate_prorated_rent_preview(current_user):
    """Calculate prorated rent preview for frontend"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['propertyId', 'leaseStartDate', 'rentPaymentDay']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Get property details
        property = Property.query.get(data['propertyId'])
        if not property:
            return jsonify({'error': 'Property not found'}), 404
        
        # Check if user owns this property
        if property.owner_id != current_user.id:
            return jsonify({'error': 'Not authorized to access this property'}), 403
        
        # Calculate prorated rent
        lease_start_date = data['leaseStartDate']
        rent_payment_day = int(data['rentPaymentDay'])
        monthly_rent = property.rent_amount
        
        prorated_info = calculate_prorated_rent(monthly_rent, lease_start_date, rent_payment_day)
        
        return jsonify({
            'success': True,
            'prorated_rent': {
                'monthly_rent': float(monthly_rent),
                'first_month_amount': float(prorated_info['prorated_amount']),
                'days_in_month': prorated_info['days_in_month'],
                'days_prorated': prorated_info['days_tenant_stays'],
                'daily_rate': float(prorated_info['daily_rate']),
                'next_full_payment_date': prorated_info['next_full_payment_date'].isoformat(),
                'calculation_note': prorated_info['calculation_note'],
                'savings': float(monthly_rent) - float(prorated_info['prorated_amount'])
            }
        }), 200
        
    except Exception as e:
        print(f"Error calculating prorated rent: {str(e)}")
        return jsonify({'error': str(e)}), 400

@tenant_bp.route('/import', methods=['POST'])
@token_required
def import_tenants(current_user):
    try:
        print("Tenant import attempt received")
        print("Current user:", current_user.username)
        
        if 'csv_file' not in request.files:
            return jsonify({'error': 'No CSV file provided'}), 400
        
        csv_file = request.files['csv_file']
        if csv_file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not csv_file.filename.endswith('.csv'):
            return jsonify({'error': 'File must be a CSV'}), 400
        
        # Read and parse CSV
        import csv
        import io
        
        # Read the CSV content
        csv_content = csv_file.read().decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        
        imported_count = 0
        errors = []
        
        for row_num, row in enumerate(csv_reader, start=2):  # Start at 2 because row 1 is header
            try:
                # Extract data from CSV row
                full_name = row.get('FULL_NAME', '').strip() if row.get('FULL_NAME') else ''
                email = row.get('EMAIL', '').strip() if row.get('EMAIL') else ''
                phone = row.get('PHONE', '').strip() if row.get('PHONE') else ''
                property_id = row.get('PROPERTY_ID', '').strip() if row.get('PROPERTY_ID') else ''
                lease_start = row.get('LEASE_START_DATE', '').strip() if row.get('LEASE_START_DATE') else ''
                lease_end = row.get('LEASE_END_DATE', '').strip() if row.get('LEASE_END_DATE') else ''
                rent_amount = row.get('RENT_AMOUNT', '0').strip() if row.get('RENT_AMOUNT') else '0'
                payment_status = row.get('PAYMENT_STATUS', 'active').strip() if row.get('PAYMENT_STATUS') else 'active'
                
                # Validate required fields
                if not full_name:
                    errors.append(f"Row {row_num}: Full name is required")
                    continue
                
                if not email:
                    errors.append(f"Row {row_num}: Email is required")
                    continue
                
                # Check if tenant with this email already exists
                existing_tenant = Tenant.query.filter_by(email=email).first()
                if existing_tenant:
                    errors.append(f"Row {row_num}: Tenant with email '{email}' already exists (ID: {existing_tenant.id})")
                    continue
                
                # Handle property assignment (optional for future tenants)
                property = None
                if property_id:
                    # Check if property exists and belongs to current user
                    property = Property.query.get(property_id)
                    if not property:
                        errors.append(f"Row {row_num}: Property with ID {property_id} not found")
                        continue
                    
                    # Check if user owns this property
                    if property.owner_id != current_user.id:
                        errors.append(f"Row {row_num}: Property {property_id} does not belong to you")
                        continue
                    
                    # Check if property is available
                    if property.status != 'available':
                        errors.append(f"Row {row_num}: Property {property_id} is not available")
                        continue
                
                # Convert rent_amount to float
                try:
                    rent_amount_float = float(rent_amount) if rent_amount else 0.0
                except ValueError:
                    rent_amount_float = 0.0
                
                # Create tenant
                tenant = Tenant(
                    full_name=full_name,
                    email=email,
                    phone_number=phone,
                    property_id=int(property_id) if property_id else None,
                    lease_start=datetime.strptime(lease_start, '%Y-%m-%d').date() if lease_start else None,
                    lease_end=datetime.strptime(lease_end, '%Y-%m-%d').date() if lease_end else None,
                    rent_amount=rent_amount_float,
                    payment_status='future' if not property_id else payment_status
                )
                
                # Update property status to occupied only if property is assigned
                if property:
                    property.status = 'occupied'
                
                db.session.add(tenant)
                imported_count += 1
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
                continue
        
        # Commit all tenants
        if imported_count > 0:
            db.session.commit()
            print(f"Successfully imported {imported_count} tenants")
        
        return jsonify({
            'success': True,
            'imported_count': imported_count,
            'errors': errors
        }), 200
        
    except Exception as e:
        print("Error importing tenants:", str(e))
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@tenant_bp.route('/<int:tenant_id>', methods=['DELETE'])
@token_required
def delete_tenant(current_user, tenant_id):
    try:
        print(f"Delete tenant attempt - Tenant ID: {tenant_id}, User: {current_user.username}")
        
        # Find the tenant
        tenant = Tenant.query.get(tenant_id)
        
        if not tenant:
            return jsonify({'error': 'Tenant not found'}), 404
        
        # Handle authorization based on whether tenant is assigned to a property
        if tenant.property_id:
            # For assigned tenants, check if the user can manage the rental owner that owns this property
            property = Property.query.get(tenant.property_id)
            if not property:
                return jsonify({'error': 'Property not found'}), 404
                
            # Check if user owns this property
            if property.owner_id != current_user.id:
                return jsonify({'error': 'Unauthorized to delete this tenant'}), 403
            
            # Update property status back to available
            property.status = 'available'
        else:
            # For future tenants (unassigned), allow deletion by any authenticated user
            # This is a simplified approach - you might want to add additional checks
            print(f"Deleting future tenant (unassigned) - Tenant ID: {tenant_id}")
        
        # Handle related records before deleting tenant
        try:
            # Delete related maintenance requests
            from models.maintenance import MaintenanceRequest
            maintenance_requests = MaintenanceRequest.query.filter_by(tenant_id=tenant_id).all()
            for request in maintenance_requests:
                db.session.delete(request)
            
            # Delete related rent roll entries
            rent_rolls = RentRoll.query.filter_by(tenant_id=tenant_id).all()
            for rent_roll in rent_rolls:
                db.session.delete(rent_roll)
            
            # Delete related outstanding balances
            outstanding_balances = OutstandingBalance.query.filter_by(tenant_id=tenant_id).all()
            for balance in outstanding_balances:
                db.session.delete(balance)
                
            print(f"Deleted {len(maintenance_requests)} maintenance requests, {len(rent_rolls)} rent rolls, {len(outstanding_balances)} outstanding balances")
            
        except Exception as related_error:
            print(f"Warning: Error handling related records: {related_error}")
            # Continue with tenant deletion even if related records fail
        
        # Delete the tenant
        db.session.delete(tenant)
        db.session.commit()
        
        print(f"Tenant {tenant_id} deleted successfully by user {current_user.username}")
        return jsonify({'message': 'Tenant deleted successfully'}), 200
        
    except Exception as e:
        print(f"Error deleting tenant: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 400