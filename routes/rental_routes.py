from flask import Blueprint, request, jsonify
from models.tenant import Tenant, RentRoll, OutstandingBalance, DraftLease, LeaseRenewal
from models.property import Property
from models.rental_owner import RentalOwner, RentalOwnerManager
from models.financial import FinancialTransaction
from config import db
from datetime import datetime, date
from routes.auth_routes import token_required
from sqlalchemy import func, and_, or_

rental_bp = Blueprint('rental_bp', __name__)

@rental_bp.route('/', methods=['GET'])
@token_required
def get_rental_data(current_user):
    """Get comprehensive rental data for the dashboard"""
    try:
        # Get all properties managed by the current user through rental owners
        properties = Property.query.join(
            RentalOwnerManager, Property.rental_owner_id == RentalOwnerManager.rental_owner_id
        ).filter(
            RentalOwnerManager.user_id == current_user.id
        ).all()
        property_ids = [p.id for p in properties]
        
        # Get all tenants for these properties
        tenants = Tenant.query.filter(Tenant.property_id.in_(property_ids)).all()
        
        # Get rent roll data
        rent_roll = RentRoll.query.filter(RentRoll.property_id.in_(property_ids)).all()
        
        # Get outstanding balances
        outstanding_balances = OutstandingBalance.query.filter(
            OutstandingBalance.property_id.in_(property_ids)
        ).all()
        
        # Calculate statistics
        total_monthly_rent = sum(float(tenant.rent_amount or 0) for tenant in tenants)
        total_collected = sum(float(payment.amount_paid or 0) for payment in rent_roll)
        total_outstanding = sum(float(balance.due_amount or 0) for balance in outstanding_balances)
        occupancy_rate = (len(tenants) / len(properties)) * 100 if properties else 0
        
        return jsonify({
            'properties': [p.to_dict() for p in properties],
            'tenants': [t.to_dict() for t in tenants],
            'rent_roll': [r.to_dict() for r in rent_roll],
            'outstanding_balances': [b.to_dict() for b in outstanding_balances],
            'statistics': {
                'total_monthly_rent': total_monthly_rent,
                'total_collected': total_collected,
                'total_outstanding': total_outstanding,
                'occupancy_rate': occupancy_rate,
                'active_tenants': len(tenants),
                'total_properties': len(properties)
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rental_bp.route('/rent-roll', methods=['GET'])
@token_required
def get_rent_roll(current_user):
    """Get rent roll (lease data) for the current user"""
    try:
        from datetime import date, datetime
        
        # Get all properties managed by the current user through rental owners
        if current_user.role == 'ADMIN' or current_user.username == 'admin':
            properties = Property.query.all()
        else:
            properties = Property.query.join(
                RentalOwnerManager, Property.rental_owner_id == RentalOwnerManager.rental_owner_id
            ).filter(
                RentalOwnerManager.user_id == current_user.id
            ).all()
        
        property_ids = [p.id for p in properties]
        
        # Get tenants with property information
        tenants = db.session.query(
            Tenant,
            Property.title.label('property_title'),
            Property.street_address_1,
            Property.city,
            Property.state
        ).join(
            Property, Tenant.property_id == Property.id
        ).filter(
            Tenant.property_id.in_(property_ids)
        ).all()
        
        rent_roll_data = []
        today = date.today()
        
        for tenant, property_title, street_address, city, state in tenants:
            # Determine lease status
            if tenant.lease_start and tenant.lease_end:
                if tenant.lease_start <= today <= tenant.lease_end:
                    status = 'Active'
                elif tenant.lease_start > today:
                    status = 'Future'
                else:
                    status = 'Expired'
            else:
                status = 'No Lease'
            
            # Calculate days left
            days_left = 0
            if tenant.lease_end and tenant.lease_end > today:
                days_left = (tenant.lease_end - today).days
            
            # Format lease dates
            lease_dates = f"{tenant.lease_start.strftime('%m/%d/%Y') if tenant.lease_start else 'N/A'} - {tenant.lease_end.strftime('%m/%d/%Y') if tenant.lease_end else 'N/A'}"
            
            # Format address
            address = f"{street_address}, {city}, {state}" if street_address and city and state else "Address not available"
            
            rent_roll_data.append({
                'id': tenant.id,
                'lease': f"{tenant.full_name} - {property_title}",
                'leaseId': f"LEASE-{tenant.id:04d}",
                'status': status,
                'type': 'Residential',
                'leaseDates': lease_dates,
                'daysLeft': days_left,
                'rent': float(tenant.rent_amount) if tenant.rent_amount else 0,
                'tenant_name': tenant.full_name,
                'property_title': property_title,
                'address': address,
                'email': tenant.email,
                'phone': tenant.phone_number
            })
        
        return jsonify(rent_roll_data), 200
    except Exception as e:
        print(f"Error fetching rent roll: {str(e)}")
        return jsonify({'error': str(e)}), 400

@rental_bp.route('/outstanding-balances', methods=['GET'])
@token_required
def get_outstanding_balances(current_user):
    """Get outstanding balances for all properties"""
    try:
        # Get all properties managed by the current user through rental owners
        properties = Property.query.join(
            RentalOwnerManager, Property.rental_owner_id == RentalOwnerManager.rental_owner_id
        ).filter(
            RentalOwnerManager.user_id == current_user.id
        ).all()
        property_ids = [p.id for p in properties]
        
        # Get outstanding balances with tenant and property information
        balances = db.session.query(
            OutstandingBalance,
            Tenant.full_name.label('tenant_name'),
            Tenant.email.label('tenant_email'),
            Property.title.label('property_title')
        ).join(
            Tenant, OutstandingBalance.tenant_id == Tenant.id
        ).join(
            Property, OutstandingBalance.property_id == Property.id
        ).filter(
            OutstandingBalance.property_id.in_(property_ids)
        ).order_by(OutstandingBalance.due_date.asc()).all()
        
        result = []
        for balance, tenant_name, tenant_email, property_title in balances:
            balance_dict = balance.to_dict()
            balance_dict['tenant_name'] = tenant_name
            balance_dict['tenant_email'] = tenant_email
            balance_dict['property_title'] = property_title
            
            # Calculate days overdue
            if balance.due_date:
                from datetime import date
                today = date.today()
                days_overdue = (today - balance.due_date).days
                balance_dict['days_overdue'] = days_overdue if days_overdue > 0 else 0
            else:
                balance_dict['days_overdue'] = 0
                
            result.append(balance_dict)
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rental_bp.route('/statistics', methods=['GET'])
@token_required
def get_rental_statistics(current_user):
    """Get rental statistics and analytics"""
    try:
        # Get all properties managed by the current user through rental owners
        properties = Property.query.join(
            RentalOwnerManager, Property.rental_owner_id == RentalOwnerManager.rental_owner_id
        ).filter(
            RentalOwnerManager.user_id == current_user.id
        ).all()
        property_ids = [p.id for p in properties]
        
        # Get current month and year
        current_date = date.today()
        current_month = current_date.month
        current_year = current_date.year
        
        # Get tenants
        tenants = Tenant.query.filter(Tenant.property_id.in_(property_ids)).all()
        
        # Get rent roll for current month
        current_month_payments = RentRoll.query.filter(
            and_(
                RentRoll.property_id.in_(property_ids),
                func.extract('month', RentRoll.payment_date) == current_month,
                func.extract('year', RentRoll.payment_date) == current_year
            )
        ).all()
        
        # Get outstanding balances
        outstanding_balances = OutstandingBalance.query.filter(
            and_(
                OutstandingBalance.property_id.in_(property_ids),
                OutstandingBalance.is_resolved == False
            )
        ).all()
        
        # Calculate statistics
        total_monthly_rent = sum(float(tenant.rent_amount or 0) for tenant in tenants)
        current_month_collected = sum(float(payment.amount_paid or 0) for payment in current_month_payments)
        total_outstanding = sum(float(balance.due_amount or 0) for balance in outstanding_balances)
        occupancy_rate = (len(tenants) / len(properties)) * 100 if properties else 0
        
        # Get lease expirations in next 90 days
        lease_expirations = Tenant.query.filter(
            and_(
                Tenant.property_id.in_(property_ids),
                Tenant.lease_end >= current_date,
                Tenant.lease_end <= current_date + datetime.timedelta(days=90)
            )
        ).all()
        
        # Get payment trends (last 6 months)
        payment_trends = []
        for i in range(6):
            month_date = current_date.replace(day=1) - datetime.timedelta(days=30*i)
            month_payments = RentRoll.query.filter(
                and_(
                    RentRoll.property_id.in_(property_ids),
                    func.extract('month', RentRoll.payment_date) == month_date.month,
                    func.extract('year', RentRoll.payment_date) == month_date.year
                )
            ).all()
            
            month_total = sum(float(payment.amount_paid or 0) for payment in month_payments)
            payment_trends.append({
                'month': month_date.strftime('%B %Y'),
                'total': month_total
            })
        
        return jsonify({
            'total_monthly_rent': total_monthly_rent,
            'current_month_collected': current_month_collected,
            'total_outstanding': total_outstanding,
            'occupancy_rate': occupancy_rate,
            'active_tenants': len(tenants),
            'total_properties': len(properties),
            'lease_expirations_count': len(lease_expirations),
            'payment_trends': payment_trends,
            'collection_rate': (current_month_collected / total_monthly_rent * 100) if total_monthly_rent > 0 else 0
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rental_bp.route('/payments', methods=['POST'])
@token_required
def record_payment(current_user):
    """Record a new rent payment"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['tenant_id', 'property_id', 'amount_paid', 'payment_date', 'payment_method']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Verify the property belongs to the current user
        property = Property.query.get(data['property_id'])
        if not property or property.owner_id != current_user.id:
            return jsonify({'error': 'Property not found or not authorized'}), 404
        
        # Verify the tenant exists and is associated with the property
        tenant = Tenant.query.get(data['tenant_id'])
        if not tenant or tenant.property_id != data['property_id']:
            return jsonify({'error': 'Tenant not found or not associated with this property'}), 404
        
        # Create new rent roll entry
        payment = RentRoll(
            tenant_id=data['tenant_id'],
            property_id=data['property_id'],
            payment_date=datetime.strptime(data['payment_date'], '%Y-%m-%d').date(),
            amount_paid=data['amount_paid'],
            payment_method=data['payment_method'],
            status='paid',
            remarks=data.get('remarks', '')
        )
        
        db.session.add(payment)
        db.session.commit()
        
        return jsonify({
            'message': 'Payment recorded successfully',
            'payment': payment.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@rental_bp.route('/payments/<int:payment_id>', methods=['PUT'])
@token_required
def update_payment(current_user, payment_id):
    """Update an existing rent payment"""
    try:
        payment = RentRoll.query.get(payment_id)
        if not payment:
            return jsonify({'error': 'Payment not found'}), 404
        
        # Verify the property belongs to the current user
        property = Property.query.get(payment.property_id)
        if not property or property.owner_id != current_user.id:
            return jsonify({'error': 'Not authorized to modify this payment'}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'amount_paid' in data:
            payment.amount_paid = data['amount_paid']
        if 'payment_date' in data:
            payment.payment_date = datetime.strptime(data['payment_date'], '%Y-%m-%d').date()
        if 'payment_method' in data:
            payment.payment_method = data['payment_method']
        if 'status' in data:
            payment.status = data['status']
        if 'remarks' in data:
            payment.remarks = data['remarks']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Payment updated successfully',
            'payment': payment.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@rental_bp.route('/outstanding-balances', methods=['POST'])
@token_required
def create_outstanding_balance(current_user):
    """Create a new outstanding balance record"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['tenant_id', 'property_id', 'due_amount', 'due_date']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Verify the property belongs to the current user
        property = Property.query.get(data['property_id'])
        if not property or property.owner_id != current_user.id:
            return jsonify({'error': 'Property not found or not authorized'}), 404
        
        # Create new outstanding balance
        balance = OutstandingBalance(
            tenant_id=data['tenant_id'],
            property_id=data['property_id'],
            due_amount=data['due_amount'],
            due_date=datetime.strptime(data['due_date'], '%Y-%m-%d').date(),
            is_resolved=False
        )
        
        db.session.add(balance)
        db.session.commit()
        
        return jsonify({
            'message': 'Outstanding balance created successfully',
            'balance': balance.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@rental_bp.route('/outstanding-balances/<int:balance_id>', methods=['PUT'])
@token_required
def update_outstanding_balance(current_user, balance_id):
    """Update an outstanding balance record"""
    try:
        balance = OutstandingBalance.query.get(balance_id)
        if not balance:
            return jsonify({'error': 'Outstanding balance not found'}), 404
        
        # Verify the property belongs to the current user
        property = Property.query.get(balance.property_id)
        if not property or property.owner_id != current_user.id:
            return jsonify({'error': 'Not authorized to modify this balance'}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'due_amount' in data:
            balance.due_amount = data['due_amount']
        if 'due_date' in data:
            balance.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
        if 'is_resolved' in data:
            balance.is_resolved = data['is_resolved']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Outstanding balance updated successfully',
            'balance': balance.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@rental_bp.route('/lease-expirations', methods=['GET'])
@token_required
def get_lease_expirations(current_user):
    """Get upcoming lease expirations"""
    try:
        # Get all properties owned by the current user
        properties = Property.query.filter_by(owner_id=current_user.id).all()
        property_ids = [p.id for p in properties]
        
        # Get current date
        current_date = date.today()
        
        # Get leases expiring in next 90 days
        expiring_leases = db.session.query(
            Tenant,
            Property.title.label('property_title')
        ).join(
            Property, Tenant.property_id == Property.id
        ).filter(
            and_(
                Tenant.property_id.in_(property_ids),
                Tenant.lease_end >= current_date,
                Tenant.lease_end <= current_date + datetime.timedelta(days=90)
            )
        ).order_by(Tenant.lease_end.asc()).all()
        
        result = []
        for tenant, property_title in expiring_leases:
            tenant_dict = tenant.to_dict()
            tenant_dict['property_title'] = property_title
            
            # Calculate days until expiration
            days_until_expiration = (tenant.lease_end - current_date).days
            tenant_dict['days_until_expiration'] = days_until_expiration
            
            result.append(tenant_dict)
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@rental_bp.route('/reports/rental-summary', methods=['GET'])
@token_required
def generate_rental_summary_report(current_user):
    """Generate a comprehensive rental summary report"""
    try:
        # Get all properties owned by the current user
        properties = Property.query.filter_by(owner_id=current_user.id).all()
        property_ids = [p.id for p in properties]
        
        # Get current date
        current_date = date.today()
        current_month = current_date.month
        current_year = current_date.year
        
        # Get all tenants
        tenants = Tenant.query.filter(Tenant.property_id.in_(property_ids)).all()
        
        # Get rent roll for current month
        current_month_payments = RentRoll.query.filter(
            and_(
                RentRoll.property_id.in_(property_ids),
                func.extract('month', RentRoll.payment_date) == current_month,
                func.extract('year', RentRoll.payment_date) == current_year
            )
        ).all()
        
        # Get outstanding balances
        outstanding_balances = OutstandingBalance.query.filter(
            and_(
                OutstandingBalance.property_id.in_(property_ids),
                OutstandingBalance.is_resolved == False
            )
        ).all()
        
        # Calculate summary statistics
        total_monthly_rent = sum(float(tenant.rent_amount or 0) for tenant in tenants)
        current_month_collected = sum(float(payment.amount_paid or 0) for payment in current_month_payments)
        total_outstanding = sum(float(balance.due_amount or 0) for balance in outstanding_balances)
        occupancy_rate = (len(tenants) / len(properties)) * 100 if properties else 0
        
        # Get property-wise breakdown
        property_breakdown = []
        for property in properties:
            property_tenants = [t for t in tenants if t.property_id == property.id]
            property_payments = [p for p in current_month_payments if p.property_id == property.id]
            property_balances = [b for b in outstanding_balances if b.property_id == property.id]
            
            property_breakdown.append({
                'property_id': property.id,
                'property_title': property.title,
                'monthly_rent': sum(float(t.rent_amount or 0) for t in property_tenants),
                'collected': sum(float(p.amount_paid or 0) for p in property_payments),
                'outstanding': sum(float(b.due_amount or 0) for b in property_balances),
                'tenant_count': len(property_tenants),
                'status': property.status
            })
        
        report = {
            'generated_date': current_date.isoformat(),
            'summary': {
                'total_properties': len(properties),
                'active_tenants': len(tenants),
                'total_monthly_rent': total_monthly_rent,
                'current_month_collected': current_month_collected,
                'total_outstanding': total_outstanding,
                'occupancy_rate': occupancy_rate,
                'collection_rate': (current_month_collected / total_monthly_rent * 100) if total_monthly_rent > 0 else 0
            },
            'property_breakdown': property_breakdown,
            'recent_payments': [p.to_dict() for p in current_month_payments[-10:]],  # Last 10 payments
            'outstanding_balances': [b.to_dict() for b in outstanding_balances]
        }
        
        return jsonify(report), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
