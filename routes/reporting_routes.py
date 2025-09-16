from flask import Blueprint, request, jsonify, send_file
from datetime import datetime, date, timedelta
from sqlalchemy import and_, func, desc
from models import db, User, Property, Tenant, MaintenanceRequest, FinancialTransaction, Vendor, Association, AssociationMembership
from models.rental_owner import RentalOwner, RentalOwnerManager
from utils.pdf_generator import PropertyReportPDFGenerator
from functools import wraps
import jwt
import io
import os
from config import app

reporting_bp = Blueprint('reporting', __name__)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
        except:
            return jsonify({'message': 'Token is invalid'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@reporting_bp.route('/types', methods=['GET'])
@token_required
def get_report_types(current_user):
    """Get available report types"""
    user = current_user
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    report_types = [
        {
            'id': 'property_summary',
            'name': 'Property Summary Report',
            'description': 'Overview of all properties with key metrics',
            'icon': '🏠',
            'available_for': ['OWNER', 'AGENT']
        },
        {
            'id': 'tenant_report',
            'name': 'Tenant Report',
            'description': 'Detailed tenant information and lease status',
            'icon': '👥',
            'available_for': ['OWNER', 'AGENT']
        },
        {
            'id': 'maintenance_report',
            'name': 'Maintenance Report',
            'description': 'Maintenance requests and vendor performance',
            'icon': '🔧',
            'available_for': ['OWNER', 'AGENT', 'VENDOR']
        },
        {
            'id': 'financial_report',
            'name': 'Financial Report',
            'description': 'Income, expenses, and financial performance',
            'icon': '💰',
            'available_for': ['OWNER', 'AGENT']
        },
        {
            'id': 'rental_report',
            'name': 'Rental Report',
            'description': 'Rental income and occupancy analysis',
            'icon': '📊',
            'available_for': ['OWNER', 'AGENT']
        },
        {
            'id': 'vendor_report',
            'name': 'Vendor Report',
            'description': 'Vendor performance and service history',
            'icon': '🏢',
            'available_for': ['OWNER', 'AGENT']
        },
        {
            'id': 'association_report',
            'name': 'Association Report',
            'description': 'HOA and association management data',
            'icon': '🏘️',
            'available_for': ['OWNER', 'AGENT']
        },
        {
            'id': 'comprehensive_report',
            'name': 'Comprehensive Report',
            'description': 'Complete overview of all property management data',
            'icon': '📋',
            'available_for': ['OWNER', 'AGENT']
        }
    ]
    
    # Filter based on user role
    available_reports = [rt for rt in report_types if user.role in rt['available_for']]
    
    return jsonify({
        'report_types': available_reports,
        'user_role': user.role
    })

@reporting_bp.route('/generate', methods=['POST'])
@token_required
def generate_report(current_user):
    """Generate a report based on type and date range"""
    print(f"🔍 Generate report called for user: {current_user.username}")
    user = current_user
    
    if not user:
        print("❌ User not found")
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    print(f"🔍 Request data: {data}")
    report_type = data.get('report_type')
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    format_type = data.get('format', 'json')  # json or pdf
    print(f"🔍 Report type: {report_type}, Date range: {start_date} to {end_date}, Format: {format_type}")
    
    # Validate date range
    try:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date() if start_date else date.today() - timedelta(days=30)
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date() if end_date else date.today()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    if start_date > end_date:
        return jsonify({'error': 'Start date must be before end date'}), 400
    
    # Generate report data based on type
    report_data = None
    
    try:
        print(f"🔍 Starting report generation for type: {report_type}")
        
        if report_type == 'property_summary':
            report_data = generate_property_summary_report(user, start_date, end_date)
        elif report_type == 'tenant_report':
            report_data = generate_tenant_report(user, start_date, end_date)
        elif report_type == 'maintenance_report':
            report_data = generate_maintenance_report(user, start_date, end_date)
        elif report_type == 'financial_report':
            report_data = generate_financial_report(user, start_date, end_date)
        elif report_type == 'rental_report':
            report_data = generate_rental_report(user, start_date, end_date)
        elif report_type == 'vendor_report':
            report_data = generate_vendor_report(user, start_date, end_date)
        elif report_type == 'association_report':
            report_data = generate_association_report(user, start_date, end_date)
        elif report_type == 'comprehensive_report':
            report_data = generate_comprehensive_report(user, start_date, end_date)
        else:
            print(f"❌ Invalid report type: {report_type}")
            return jsonify({'error': 'Invalid report type'}), 400
        
        print(f"✅ Report data generated successfully: {type(report_data)}")
        
        if format_type == 'pdf':
            return generate_pdf_report(report_data, report_type, start_date, end_date)
        else:
            return jsonify(report_data)
    except Exception as e:
        print(f"❌ Error generating report: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Error generating {report_type} report: {str(e)}'}), 500

def generate_property_summary_report(user, start_date, end_date):
    """Generate property summary report"""
    # Get properties based on user role using owner_id relationship
    if user.role == 'ADMIN' or user.username == 'admin':
        properties = Property.query.all()
    elif user.role == 'OWNER':
        properties = Property.query.filter_by(owner_id=user.id).all()
    elif user.role == 'AGENT':
        # Note: Property model doesn't have agent_id field, so agents see all properties for now
        # In a real system, you'd need to add agent_id to Property model or use a different relationship
        properties = Property.query.all()
    else:
        properties = []
    
    property_data = []
    total_value = 0
    total_rent = 0
    occupied_count = 0
    
    for prop in properties:
        # Get tenant info - Tenant model doesn't have status field, so we'll get the first tenant
        tenant = Tenant.query.filter_by(property_id=prop.id).first()
        monthly_rent = tenant.rent_amount if tenant else 0
        
        # Construct full address
        address_parts = [prop.street_address_1]
        if prop.street_address_2:
            address_parts.append(prop.street_address_2)
        if prop.apt_number:
            address_parts.append(f"Apt {prop.apt_number}")
        address_parts.extend([prop.city, prop.state, prop.zip_code])
        full_address = ", ".join(address_parts)
        
        property_data.append({
            'id': prop.id,
            'title': prop.title,
            'address': full_address,
            'property_type': 'Residential',  # Default since property_type field doesn't exist
            'status': prop.status,
            'monthly_rent': monthly_rent,
            'occupied': tenant is not None,
            'tenant_name': tenant.full_name if tenant else 'Vacant',
            'last_maintenance': get_last_maintenance_date(prop.id)
        })
        
        # Property model doesn't have purchase_price, so we'll use rent_amount as a proxy
        total_value += prop.rent_amount or 0
        total_rent += monthly_rent
        if tenant:
            occupied_count += 1
    
    occupancy_rate = (occupied_count / len(properties) * 100) if properties else 0
    
    return {
        'report_type': 'Property Summary Report',
        'generated_by': user.full_name,
        'date_range': {
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d')
        },
        'summary': {
            'total_properties': len(properties),
            'total_value': total_value,
            'total_monthly_rent': total_rent,
            'occupied_properties': occupied_count,
            'vacant_properties': len(properties) - occupied_count,
            'occupancy_rate': round(occupancy_rate, 2)
        },
        'properties': property_data
    }

def generate_tenant_report(user, start_date, end_date):
    """Generate tenant report"""
    if user.role == 'ADMIN' or user.username == 'admin':
        tenants = Tenant.query.join(Property).all()
    elif user.role == 'OWNER':
        tenants = Tenant.query.join(Property).filter(Property.owner_id == user.id).all()
    elif user.role == 'AGENT':
        # Note: Property model doesn't have agent_id field, so agents see all tenants for now
        tenants = Tenant.query.join(Property).all()
    else:
        tenants = []
    
    tenant_data = []
    total_rent = 0
    active_leases = 0
    
    for tenant in tenants:
        # Get lease info
        lease_start = tenant.lease_start
        lease_end = tenant.lease_end
        is_active = lease_start and lease_end and lease_start <= date.today() <= lease_end
        
        tenant_data.append({
            'id': tenant.id,
            'full_name': tenant.full_name,
            'email': tenant.email,
            'phone': tenant.phone_number,
            'property_title': tenant.property.title if tenant.property else 'N/A',
            'monthly_rent': tenant.rent_amount,
            'lease_start': lease_start.strftime('%Y-%m-%d') if lease_start else 'N/A',
            'lease_end': lease_end.strftime('%Y-%m-%d') if lease_end else 'N/A',
            'status': tenant.payment_status,
            'is_active': is_active,
            'days_remaining': (lease_end - date.today()).days if lease_end and lease_end > date.today() else 0
        })
        
        total_rent += tenant.rent_amount or 0
        if is_active:
            active_leases += 1
    
    return {
        'report_type': 'Tenant Report',
        'generated_by': user.full_name,
        'date_range': {
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d')
        },
        'summary': {
            'total_tenants': len(tenants),
            'active_leases': active_leases,
            'total_monthly_rent': total_rent,
            'average_rent': round(total_rent / len(tenants), 2) if tenants else 0
        },
        'tenants': tenant_data
    }

def generate_maintenance_report(user, start_date, end_date):
    """Generate maintenance report"""
    print(f"🔍 Generating maintenance report for user {user.username} (role: {user.role})")
    print(f"🔍 Date range: {start_date} to {end_date}")
    
    if user.role == 'ADMIN' or user.username == 'admin':
        requests = MaintenanceRequest.query.filter(
            and_(
                MaintenanceRequest.request_date >= start_date,
                MaintenanceRequest.request_date <= end_date
            )
        ).all()
    elif user.role == 'OWNER':
        requests = MaintenanceRequest.query.filter(
            and_(
                MaintenanceRequest.property_id.in_(
                    Property.query.filter_by(owner_id=user.id).with_entities(Property.id)
                ),
                MaintenanceRequest.request_date >= start_date,
                MaintenanceRequest.request_date <= end_date
            )
        ).all()
    elif user.role == 'AGENT':
        # Note: Property model doesn't have agent_id field, so agents see all maintenance requests for now
        requests = MaintenanceRequest.query.filter(
            and_(
                MaintenanceRequest.request_date >= start_date,
                MaintenanceRequest.request_date <= end_date
            )
        ).all()
    elif user.role == 'VENDOR':
        requests = MaintenanceRequest.query.filter(
            and_(
                MaintenanceRequest.assigned_vendor_id == user.id,
                MaintenanceRequest.request_date >= start_date,
                MaintenanceRequest.request_date <= end_date
            )
        ).all()
    else:
        requests = []
    
    print(f"🔍 Found {len(requests)} maintenance requests")
    
    request_data = []
    total_requests = len(requests)
    completed_requests = 0
    pending_requests = 0
    total_cost = 0
    
    for req in requests:
        request_data.append({
            'id': req.id,
            'title': req.request_title,
            'description': req.request_description,
            'priority': req.priority,
            'status': req.status,
            'created_at': req.request_date.strftime('%Y-%m-%d'),
            'completed_at': req.completion_date.strftime('%Y-%m-%d') if req.completion_date else 'N/A',
            'property_title': req.property.title if req.property else 'N/A',
            'tenant_name': req.tenant.full_name if req.tenant else 'N/A',
            'vendor_name': req.assigned_vendor.business_name if req.assigned_vendor else 'N/A',
            'cost': req.actual_cost or 0
        })
        
        if req.status == 'completed':
            completed_requests += 1
        elif req.status in ['pending', 'in_progress']:
            pending_requests += 1
        
        total_cost += req.actual_cost or 0
    
    completion_rate = (completed_requests / total_requests * 100) if total_requests > 0 else 0
    
    return {
        'report_type': 'Maintenance Report',
        'generated_by': user.full_name,
        'date_range': {
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d')
        },
        'summary': {
            'total_requests': total_requests,
            'completed_requests': completed_requests,
            'pending_requests': pending_requests,
            'completion_rate': round(completion_rate, 2),
            'total_cost': total_cost,
            'average_cost': round(total_cost / total_requests, 2) if total_requests > 0 else 0
        },
        'requests': request_data
    }

def generate_financial_report(user, start_date, end_date):
    """Generate financial report"""
    if user.role == 'ADMIN' or user.username == 'admin':
        transactions = FinancialTransaction.query.filter(
            and_(
                FinancialTransaction.transaction_date >= start_date,
                FinancialTransaction.transaction_date <= end_date
            )
        ).all()
    elif user.role == 'OWNER':
        transactions = FinancialTransaction.query.filter(
            and_(
                FinancialTransaction.property_id.in_(
                    Property.query.filter_by(owner_id=user.id).with_entities(Property.id)
                ),
                FinancialTransaction.transaction_date >= start_date,
                FinancialTransaction.transaction_date <= end_date
            )
        ).all()
    elif user.role == 'AGENT':
        # Note: Property model doesn't have agent_id field, so agents see all financial transactions for now
        transactions = FinancialTransaction.query.filter(
            and_(
                FinancialTransaction.transaction_date >= start_date,
                FinancialTransaction.transaction_date <= end_date
            )
        ).all()
    else:
        transactions = []
    
    transaction_data = []
    total_income = 0
    total_expenses = 0
    
    for trans in transactions:
        transaction_data.append({
            'id': trans.id,
            'type': trans.transaction_type,
            'amount': trans.amount,
            'description': trans.description,
            'date': trans.transaction_date.strftime('%Y-%m-%d'),
            'property_title': trans.property.title if trans.property else 'N/A',
            'category': trans.category
        })
        
        if trans.transaction_type == 'INCOME':
            total_income += trans.amount
        else:
            total_expenses += trans.amount
    
    net_income = total_income - total_expenses
    
    return {
        'report_type': 'Financial Report',
        'generated_by': user.full_name,
        'date_range': {
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d')
        },
        'summary': {
            'total_income': total_income,
            'total_expenses': total_expenses,
            'net_income': net_income,
            'profit_margin': round((net_income / total_income * 100), 2) if total_income > 0 else 0,
            'total_transactions': len(transactions)
        },
        'transactions': transaction_data
    }

def generate_rental_report(user, start_date, end_date):
    """Generate rental report"""
    if user.role == 'ADMIN' or user.username == 'admin':
        properties = Property.query.all()
    elif user.role == 'OWNER':
        properties = Property.query.filter_by(owner_id=user.id).all()
    elif user.role == 'AGENT':
        # Note: Property model doesn't have agent_id field, so agents see all properties for now
        properties = Property.query.all()
    else:
        properties = []
    
    rental_data = []
    total_rental_income = 0
    occupied_properties = 0
    
    for prop in properties:
        tenant = Tenant.query.filter_by(property_id=prop.id).first()
        monthly_rent = tenant.rent_amount if tenant else 0
        
        # Construct full address
        address_parts = [prop.street_address_1]
        if prop.street_address_2:
            address_parts.append(prop.street_address_2)
        if prop.apt_number:
            address_parts.append(f"Apt {prop.apt_number}")
        address_parts.extend([prop.city, prop.state, prop.zip_code])
        full_address = ", ".join(address_parts)
        
        rental_data.append({
            'property_id': prop.id,
            'property_title': prop.title,
            'address': full_address,
            'monthly_rent': monthly_rent,
            'occupied': tenant is not None,
            'tenant_name': tenant.full_name if tenant else 'Vacant',
            'lease_start': tenant.lease_start.strftime('%Y-%m-%d') if tenant and tenant.lease_start else 'N/A',
            'lease_end': tenant.lease_end.strftime('%Y-%m-%d') if tenant and tenant.lease_end else 'N/A',
            'days_vacant': calculate_vacant_days(prop.id, start_date, end_date)
        })
        
        total_rental_income += monthly_rent
        if tenant:
            occupied_properties += 1
    
    occupancy_rate = (occupied_properties / len(properties) * 100) if properties else 0
    
    return {
        'report_type': 'Rental Report',
        'generated_by': user.full_name,
        'date_range': {
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d')
        },
        'summary': {
            'total_properties': len(properties),
            'occupied_properties': occupied_properties,
            'vacant_properties': len(properties) - occupied_properties,
            'occupancy_rate': round(occupancy_rate, 2),
            'total_monthly_rent': total_rental_income,
            'average_rent': round(total_rental_income / len(properties), 2) if properties else 0
        },
        'rentals': rental_data
    }

def generate_vendor_report(user, start_date, end_date):
    """Generate vendor report"""
    if user.role == 'ADMIN' or user.username == 'admin':
        vendors = Vendor.query.all()
        requests = MaintenanceRequest.query.filter(
            and_(
                MaintenanceRequest.request_date >= start_date,
                MaintenanceRequest.request_date <= end_date
            )
        ).all()
    elif user.role == 'OWNER':
        vendors = Vendor.query.all()
        requests = MaintenanceRequest.query.filter(
            and_(
                MaintenanceRequest.property_id.in_(
                    Property.query.filter_by(owner_id=user.id).with_entities(Property.id)
                ),
                MaintenanceRequest.request_date >= start_date,
                MaintenanceRequest.request_date <= end_date
            )
        ).all()
    elif user.role == 'AGENT':
        vendors = Vendor.query.all()
        # Note: Property model doesn't have agent_id field, so agents see all maintenance requests for now
        requests = MaintenanceRequest.query.filter(
            and_(
                MaintenanceRequest.request_date >= start_date,
                MaintenanceRequest.request_date <= end_date
            )
        ).all()
    else:
        vendors = []
        requests = []
    
    vendor_data = []
    
    for vendor in vendors:
        vendor_requests = [req for req in requests if req.assigned_vendor_id == vendor.id]
        completed_requests = [req for req in vendor_requests if req.status == 'completed']
        total_cost = sum(req.actual_cost or 0 for req in vendor_requests)
        
        vendor_data.append({
            'id': vendor.id,
            'name': vendor.business_name,
            'email': vendor.email,
            'phone': vendor.phone_number,
            'vendor_type': vendor.vendor_type,
            'total_requests': len(vendor_requests),
            'completed_requests': len(completed_requests),
            'completion_rate': round((len(completed_requests) / len(vendor_requests) * 100), 2) if vendor_requests else 0,
            'total_cost': total_cost,
            'average_cost': round(total_cost / len(vendor_requests), 2) if vendor_requests else 0,
            'last_service': get_last_service_date(vendor.id)
        })
    
    return {
        'report_type': 'Vendor Report',
        'generated_by': user.full_name,
        'date_range': {
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d')
        },
        'summary': {
            'total_vendors': len(vendors),
            'total_requests': len(requests),
            'total_cost': sum(req.actual_cost or 0 for req in requests),
            'average_completion_rate': round(sum(v['completion_rate'] for v in vendor_data) / len(vendor_data), 2) if vendor_data else 0
        },
        'vendors': vendor_data
    }

def generate_association_report(user, start_date, end_date):
    """Generate association report"""
    # For now, get all associations since the relationship is complex
    associations = Association.query.all()
    
    association_data = []
    total_dues = 0
    total_paid = 0
    
    for assoc in associations:
        association_data.append({
            'id': assoc.id,
            'name': assoc.name,
            'property_title': assoc.property.title if assoc.property else 'N/A',
            'monthly_dues': assoc.monthly_dues,
            'total_dues': assoc.total_dues,
            'amount_paid': assoc.amount_paid,
            'outstanding_balance': assoc.outstanding_balance,
            'last_payment_date': assoc.last_payment_date.strftime('%Y-%m-%d') if assoc.last_payment_date else 'N/A',
            'status': assoc.status
        })
        
        total_dues += assoc.total_dues or 0
        total_paid += assoc.amount_paid or 0
    
    return {
        'report_type': 'Association Report',
        'generated_by': user.full_name,
        'date_range': {
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d')
        },
        'summary': {
            'total_associations': len(associations),
            'total_dues': total_dues,
            'total_paid': total_paid,
            'outstanding_balance': total_dues - total_paid,
            'payment_rate': round((total_paid / total_dues * 100), 2) if total_dues > 0 else 0
        },
        'associations': association_data
    }

def generate_comprehensive_report(user, start_date, end_date):
    """Generate comprehensive report combining all data"""
    print(f"🔍 Generating comprehensive report for user {user.username} (role: {user.role})")
    print(f"🔍 Date range: {start_date} to {end_date}")
    
    try:
        print("🔍 Generating property summary report...")
        try:
            property_summary = generate_property_summary_report(user, start_date, end_date)
            print("✅ Property summary report generated successfully")
        except Exception as e:
            print(f"⚠️ Property summary report failed: {str(e)}")
            property_summary = {'summary': {'total_properties': 0, 'occupancy_rate': 0}}
        
        print("🔍 Generating tenant report...")
        try:
            tenant_report = generate_tenant_report(user, start_date, end_date)
            print("✅ Tenant report generated successfully")
        except Exception as e:
            print(f"⚠️ Tenant report failed: {str(e)}")
            tenant_report = {'summary': {'total_tenants': 0}}
        
        print("🔍 Generating maintenance report...")
        try:
            maintenance_report = generate_maintenance_report(user, start_date, end_date)
            print("✅ Maintenance report generated successfully")
        except Exception as e:
            print(f"⚠️ Maintenance report failed: {str(e)}")
            maintenance_report = {'summary': {'total_requests': 0}}
        
        print("🔍 Generating financial report...")
        try:
            financial_report = generate_financial_report(user, start_date, end_date)
            print("✅ Financial report generated successfully")
        except Exception as e:
            print(f"⚠️ Financial report failed: {str(e)}")
            financial_report = {'summary': {'total_income': 0, 'total_expenses': 0, 'net_income': 0}}
        
        print("🔍 Generating rental report...")
        try:
            rental_report = generate_rental_report(user, start_date, end_date)
            print("✅ Rental report generated successfully")
        except Exception as e:
            print(f"⚠️ Rental report failed: {str(e)}")
            rental_report = {'summary': {}}
        
        print("🔍 Generating vendor report...")
        try:
            vendor_report = generate_vendor_report(user, start_date, end_date)
            print("✅ Vendor report generated successfully")
        except Exception as e:
            print(f"⚠️ Vendor report failed: {str(e)}")
            vendor_report = {'summary': {}}
        
        print("🔍 Generating association report...")
        try:
            association_report = generate_association_report(user, start_date, end_date)
            print("✅ Association report generated successfully")
        except Exception as e:
            print(f"⚠️ Association report failed: {str(e)}")
            association_report = {'summary': {}}
    
        print("🔍 Compiling comprehensive report...")
        comprehensive_data = {
            'report_type': 'Comprehensive Property Management Report',
            'generated_by': user.full_name,
            'date_range': {
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d')
            },
            'overview': {
                'total_properties': property_summary['summary']['total_properties'],
                'total_tenants': tenant_report['summary']['total_tenants'],
                'total_maintenance_requests': maintenance_report['summary']['total_requests'],
                'total_income': financial_report['summary']['total_income'],
                'total_expenses': financial_report['summary']['total_expenses'],
                'net_income': financial_report['summary']['net_income'],
                'occupancy_rate': property_summary['summary']['occupancy_rate']
            },
            'sections': {
                'properties': property_summary,
                'tenants': tenant_report,
                'maintenance': maintenance_report,
                'financial': financial_report,
                'rentals': rental_report,
                'vendors': vendor_report,
                'associations': association_report
            }
        }
        print("✅ Comprehensive report compiled successfully")
        return comprehensive_data
        
    except Exception as e:
        print(f"❌ Error generating comprehensive report: {str(e)}")
        import traceback
        traceback.print_exc()
        raise e

def generate_pdf_report(report_data, report_type, start_date, end_date):
    """Generate PDF report using the existing PDF generator"""
    try:
        pdf_generator = PropertyReportPDFGenerator()
        
        if report_type == 'tenant_report':
            pdf_buffer = pdf_generator.generate_tenant_report_pdf(report_data)
        elif report_type == 'comprehensive_report':
            # Use enhanced comprehensive PDF generator
            pdf_buffer = generate_comprehensive_pdf(report_data, report_type)
        else:
            # For other report types, use a generic PDF generator
            pdf_buffer = generate_generic_pdf(report_data, report_type)
        
        pdf_buffer.seek(0)
        
        filename = f"{report_type}_{start_date.strftime('%Y%m%d')}_{end_date.strftime('%Y%m%d')}.pdf"
        
        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )
    
    except Exception as e:
        return jsonify({'error': f'PDF generation failed: {str(e)}'}), 500

def generate_generic_pdf(report_data, report_type):
    """Generate a highly interactive and visually appealing PDF report"""
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
    from reportlab.platypus.flowables import HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from reportlab.lib.units import inch
    from reportlab.graphics.shapes import Drawing, Rect, String
    from reportlab.graphics.charts.barcharts import VerticalBarChart
    from reportlab.graphics.charts.piecharts import Pie
    from reportlab.graphics import renderPDF
    from reportlab.platypus import Image
    import matplotlib.pyplot as plt
    import matplotlib.patches as patches
    from io import BytesIO
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter, 
        topMargin=0.5*inch, 
        bottomMargin=0.5*inch,
        leftMargin=0.5*inch,
        rightMargin=0.5*inch
    )
    styles = getSampleStyleSheet()
    story = []
    
    # Create compact custom styles
    title_style = ParagraphStyle(
        'EnhancedTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=10,
        spaceBefore=5,
        alignment=1,  # Center alignment
        textColor=colors.HexColor('#1e40af'),  # Blue-800
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=8,
        alignment=1,
        textColor=colors.HexColor('#64748b'),  # Slate-500
        fontName='Helvetica'
    )
    
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=12,
        spaceAfter=8,
        spaceBefore=12,
        textColor=colors.HexColor('#1e40af'),
        fontName='Helvetica-Bold',
        borderWidth=1,
        borderColor=colors.HexColor('#3b82f6'),
        borderPadding=4,
        backColor=colors.HexColor('#eff6ff'),  # Blue-50
        borderRadius=4
    )
    
    metric_style = ParagraphStyle(
        'MetricStyle',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=8,
        leftIndent=15,
        fontName='Helvetica'
    )
    
    # Compact header
    header_text = f"🏢 PROPERTY MANAGEMENT REPORT"
    story.append(Paragraph(header_text, title_style))
    
    # Report metadata in a simple format
    metadata_text = f"""
    <b>Generated:</b> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}<br/>
    <b>Generated by:</b> {report_data.get('generated_by', 'System')}<br/>
    <b>Period:</b> {report_data.get('date_range', {}).get('start_date', 'N/A')} to {report_data.get('date_range', {}).get('end_date', 'N/A')}
    """
    story.append(Paragraph(metadata_text, styles['Normal']))
    story.append(Spacer(1, 8))
    
    # Executive Summary with visual metrics
    story.append(Paragraph("📊 EXECUTIVE SUMMARY", section_style))
    
    if 'summary' in report_data:
        # Create metric cards
        summary_items = list(report_data['summary'].items())
        if len(summary_items) > 0:
            # Split into rows of 2 metrics each
            for i in range(0, len(summary_items), 2):
                row_items = summary_items[i:i+2]
                metric_data = []
                
                for key, value in row_items:
                    formatted_key = key.replace('_', ' ').title()
                    if isinstance(value, (int, float)) and 'rate' in key.lower():
                        formatted_value = f"{value}%"
                        color = colors.HexColor('#059669')  # Green for rates
                    elif isinstance(value, (int, float)) and any(term in key.lower() for term in ['cost', 'rent', 'income', 'expense', 'value']):
                        formatted_value = f"${value:,.2f}"
                        color = colors.HexColor('#dc2626') if 'expense' in key.lower() else colors.HexColor('#059669')
                    else:
                        formatted_value = str(value)
                        color = colors.HexColor('#1e40af')
                    
                    metric_data.append([formatted_key, formatted_value, color])
                
                # Pad with empty cells if odd number
                while len(metric_data) < 2:
                    metric_data.append(['', '', colors.white])
                
                metric_table = Table([
                    [metric_data[0][0], metric_data[1][0]],
                    [metric_data[0][1], metric_data[1][1]]
                ], colWidths=[3*inch, 3*inch])
                
                metric_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#f1f5f9')),
                    ('BACKGROUND', (1, 0), (1, 0), colors.HexColor('#f1f5f9')),
                    ('BACKGROUND', (0, 1), (0, 1), colors.HexColor('#ffffff')),
                    ('BACKGROUND', (1, 1), (1, 1), colors.HexColor('#ffffff')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#64748b')),
                    ('TEXTCOLOR', (0, 1), (0, 1), metric_data[0][2]),
                    ('TEXTCOLOR', (1, 1), (1, 1), metric_data[1][2]),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('FONTSIZE', (0, 1), (-1, 1), 14),
                    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 10),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 10),
                    ('TOPPADDING', (0, 0), (-1, -1), 8),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 8)
                ]))
                story.append(metric_table)
                story.append(Spacer(1, 10))
    
    story.append(Spacer(1, 20))
    
    # Visual Charts Section
    if 'summary' in report_data and any(key in report_data['summary'] for key in ['total_income', 'total_expenses', 'occupancy_rate']):
        story.append(Paragraph("📈 PERFORMANCE CHARTS", section_style))
        
        # Create a simple bar chart for financial data
        drawing = Drawing(400, 200)
        
        # Financial comparison chart
        if 'total_income' in report_data['summary'] and 'total_expenses' in report_data['summary']:
            chart = VerticalBarChart()
            chart.x = 50
            chart.y = 50
            chart.height = 120
            chart.width = 300
            chart.data = [
                [report_data['summary'].get('total_income', 0)],
                [report_data['summary'].get('total_expenses', 0)]
            ]
            chart.categoryAxis.categoryNames = ['Income', 'Expenses']
            chart.bars[0].fillColor = colors.HexColor('#059669')  # Green for income
            chart.bars[1].fillColor = colors.HexColor('#dc2626')  # Red for expenses
            drawing.add(chart)
            
            # Add chart title
            title = String(200, 180, 'Financial Overview', textAnchor='middle')
            title.fontName = 'Helvetica-Bold'
            title.fontSize = 12
            title.fillColor = colors.HexColor('#1e40af')
            drawing.add(title)
            
            story.append(drawing)
    story.append(Spacer(1, 20))
    
    # Properties section with enhanced styling
    if 'properties' in report_data and report_data['properties']:
        story.append(Paragraph("🏠 PROPERTIES OVERVIEW", section_style))
        
        prop_data = [['Property Name', 'Address', 'Status', 'Monthly Rent', 'Tenant']]
        for prop in report_data['properties'][:15]:  # Show more properties
            status_color = '🟢' if prop.get('status') == 'ACTIVE' else '🔴'
            prop_data.append([
                prop.get('title', 'N/A'),
                prop.get('address', 'N/A')[:35] + '...' if len(prop.get('address', '')) > 35 else prop.get('address', 'N/A'),
                f"{status_color} {prop.get('status', 'N/A')}",
                f"${prop.get('monthly_rent', 0):,.2f}" if prop.get('monthly_rent') else 'N/A',
                prop.get('tenant_name', 'Vacant')
            ])
        
        prop_table = Table(prop_data, colWidths=[1.4*inch, 2.2*inch, 1*inch, 1*inch, 1.2*inch])
        prop_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6)
        ]))
        story.append(prop_table)
        story.append(Spacer(1, 20))
    
    # Tenants section
    if 'tenants' in report_data and report_data['tenants']:
        story.append(Paragraph("👥 TENANTS OVERVIEW", section_style))
        
        tenant_data = [['Name', 'Property', 'Monthly Rent', 'Lease End', 'Status']]
        for tenant in report_data['tenants'][:15]:
            status_icon = '🟢' if tenant.get('is_active') else '🔴'
            tenant_data.append([
                tenant.get('full_name', 'N/A'),
                tenant.get('property_title', 'N/A')[:25] + '...' if len(tenant.get('property_title', '')) > 25 else tenant.get('property_title', 'N/A'),
                f"${tenant.get('monthly_rent', 0):,.2f}" if tenant.get('monthly_rent') else 'N/A',
                tenant.get('lease_end', 'N/A'),
                f"{status_icon} {'Active' if tenant.get('is_active') else 'Inactive'}"
            ])
        
        tenant_table = Table(tenant_data, colWidths=[1.5*inch, 1.8*inch, 1*inch, 1*inch, 0.9*inch])
        tenant_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#059669')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f0fdf4')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1fae5')),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0fdf4')]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6)
        ]))
        story.append(tenant_table)
        story.append(Spacer(1, 20))
    
    # Maintenance requests section
    if 'requests' in report_data and report_data['requests']:
        story.append(Paragraph("🔧 MAINTENANCE REQUESTS", section_style))
        
        maint_data = [['Title', 'Property', 'Priority', 'Status', 'Cost']]
        for req in report_data['requests'][:15]:
            priority_icon = '🔴' if req.get('priority') == 'HIGH' else '🟡' if req.get('priority') == 'MEDIUM' else '🟢'
            status_icon = '✅' if req.get('status') == 'COMPLETED' else '🔄' if req.get('status') == 'IN_PROGRESS' else '⏳'
            maint_data.append([
                req.get('title', 'N/A')[:30] + '...' if len(req.get('title', '')) > 30 else req.get('title', 'N/A'),
                req.get('property_title', 'N/A')[:25] + '...' if len(req.get('property_title', '')) > 25 else req.get('property_title', 'N/A'),
                f"{priority_icon} {req.get('priority', 'N/A')}",
                f"{status_icon} {req.get('status', 'N/A')}",
                f"${req.get('cost', 0):,.2f}" if req.get('cost') else 'N/A'
            ])
        
        maint_table = Table(maint_data, colWidths=[1.8*inch, 1.5*inch, 1*inch, 1*inch, 0.9*inch])
        maint_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ea580c')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#fff7ed')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#fed7aa')),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fff7ed')]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6)
        ]))
        story.append(maint_table)
        story.append(Spacer(1, 20))
    
    # Financial transactions section
    if 'transactions' in report_data and report_data['transactions']:
        story.append(Paragraph("💰 FINANCIAL TRANSACTIONS", section_style))
        
        trans_data = [['Type', 'Amount', 'Description', 'Date', 'Property']]
        for trans in report_data['transactions'][:15]:
            type_icon = '💰' if trans.get('type') == 'INCOME' else '💸'
            trans_data.append([
                f"{type_icon} {trans.get('type', 'N/A')}",
                f"${trans.get('amount', 0):,.2f}" if trans.get('amount') else 'N/A',
                trans.get('description', 'N/A')[:30] + '...' if len(trans.get('description', '')) > 30 else trans.get('description', 'N/A'),
                trans.get('date', 'N/A'),
                trans.get('property_title', 'N/A')[:20] + '...' if len(trans.get('property_title', '')) > 20 else trans.get('property_title', 'N/A')
            ])
        
        trans_table = Table(trans_data, colWidths=[1*inch, 1*inch, 1.8*inch, 1*inch, 1.2*inch])
        trans_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#7c3aed')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#faf5ff')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e9d5ff')),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#faf5ff')]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6)
        ]))
        story.append(trans_table)
    
    # Footer
    story.append(Spacer(1, 30))
    footer_data = [
        ['📊 Property Management System', 'Generated on ' + datetime.now().strftime('%B %d, %Y')],
        ['', 'This report contains confidential information']
    ]
    
    footer_table = Table(footer_data, colWidths=[4*inch, 2*inch])
    footer_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f1f5f9')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#64748b')),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 15),
        ('RIGHTPADDING', (0, 0), (-1, -1), 15),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0'))
    ]))
    story.append(footer_table)
    
    doc.build(story)
    return buffer

def generate_comprehensive_pdf(report_data, report_type):
    """Generate a highly interactive and visually appealing comprehensive PDF report"""
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
    from reportlab.platypus.flowables import HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from reportlab.lib.units import inch
    from reportlab.graphics.shapes import Drawing, Rect, String
    from reportlab.graphics.charts.barcharts import VerticalBarChart
    from reportlab.graphics.charts.piecharts import Pie
    from reportlab.graphics import renderPDF
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter, 
        topMargin=0.75*inch, 
        bottomMargin=0.75*inch,
        leftMargin=0.75*inch,
        rightMargin=0.75*inch
    )
    styles = getSampleStyleSheet()
    story = []
    
    # Professional styles for comprehensive report
    title_style = ParagraphStyle(
        'ProfessionalTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=12,
        spaceBefore=8,
        alignment=1,
        textColor=colors.HexColor('#1e40af'),
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'ProfessionalSubtitle',
        parent=styles['Normal'],
        fontSize=14,
        spaceAfter=20,
        alignment=1,
        textColor=colors.HexColor('#64748b'),
        fontName='Helvetica'
    )
    
    section_style = ParagraphStyle(
        'ProfessionalSection',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=12,
        spaceBefore=20,
        textColor=colors.HexColor('#1e40af'),
        fontName='Helvetica-Bold',
        borderWidth=2,
        borderColor=colors.HexColor('#3b82f6'),
        borderPadding=8,
        backColor=colors.HexColor('#eff6ff'),
        borderRadius=6
    )
    
    kpi_title_style = ParagraphStyle(
        'KPITitle',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=4,
        alignment=1,
        textColor=colors.HexColor('#64748b'),
        fontName='Helvetica'
    )
    
    kpi_value_style = ParagraphStyle(
        'KPIValue',
        parent=styles['Normal'],
        fontSize=20,
        spaceAfter=0,
        alignment=1,
        textColor=colors.HexColor('#1e40af'),
        fontName='Helvetica-Bold'
    )
    
    # Professional header
    header_text = f"Comprehensive Property Management Report"
    story.append(Paragraph(header_text, title_style))
    
    # Reporting period subtitle
    period_text = f"{report_data.get('date_range', {}).get('start_date', 'N/A')} to {report_data.get('date_range', {}).get('end_date', 'N/A')}"
    story.append(Paragraph(period_text, subtitle_style))
    
    # Report metadata
    metadata_text = f"""
    <b>Generated:</b> {datetime.now().strftime('%B %d, %Y at %I:%M %p')} | 
    <b>Generated by:</b> {report_data.get('generated_by', 'System')}
    """
    story.append(Paragraph(metadata_text, styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Executive Overview with professional KPI cards
    story.append(Paragraph("Executive Overview", section_style))
    
    if 'overview' in report_data:
        overview = report_data['overview']
        
        # Create professional KPI cards in a 2x2 grid
        kpi_cards = []
        
        # Card 1: Total Properties
        card1_data = [
            [Paragraph("Total Properties", kpi_title_style)],
            [Paragraph(str(overview.get('total_properties', 0)), kpi_value_style)]
        ]
        card1_table = Table(card1_data, colWidths=[2.5*inch])
        card1_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#eff6ff')),
            ('BACKGROUND', (0, 1), (-1, 1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#3b82f6')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8)
        ]))
        
        # Card 2: Total Tenants
        card2_data = [
            [Paragraph("Total Tenants", kpi_title_style)],
            [Paragraph(str(overview.get('total_tenants', 0)), kpi_value_style)]
        ]
        card2_table = Table(card2_data, colWidths=[2.5*inch])
        card2_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f0fdf4')),
            ('BACKGROUND', (0, 1), (-1, 1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#059669')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8)
        ]))
        
        # Card 3: Net Income
        card3_data = [
            [Paragraph("Net Income", kpi_title_style)],
            [Paragraph(f"${overview.get('net_income', 0):,.2f}", kpi_value_style)]
        ]
        card3_table = Table(card3_data, colWidths=[2.5*inch])
        card3_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#faf5ff')),
            ('BACKGROUND', (0, 1), (-1, 1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#7c3aed')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8)
        ]))
        
        # Card 4: Occupancy Rate
        card4_data = [
            [Paragraph("Occupancy Rate", kpi_title_style)],
            [Paragraph(f"{overview.get('occupancy_rate', 0):.1f}%", kpi_value_style)]
        ]
        card4_table = Table(card4_data, colWidths=[2.5*inch])
        card4_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#fff7ed')),
            ('BACKGROUND', (0, 1), (-1, 1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#ea580c')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8)
        ]))
        
        # Arrange cards in 2x2 grid
        kpi_grid = Table([
            [card1_table, card2_table],
            [card3_table, card4_table]
        ], colWidths=[2.5*inch, 2.5*inch])
        kpi_grid.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0)
        ]))
        
        story.append(kpi_grid)
        story.append(Spacer(1, 20))
    
    # Compact Charts Section - only show if there's meaningful data
    if 'overview' in report_data and report_data['overview'].get('total_income', 0) > 0:
        story.append(Paragraph("📈 PERFORMANCE ANALYTICS", section_style))
        
        # Create compact financial comparison chart
        drawing = Drawing(300, 150)
        
        if 'total_income' in report_data['overview'] and 'total_expenses' in report_data['overview']:
            chart = VerticalBarChart()
            chart.x = 40
            chart.y = 30
            chart.height = 80
            chart.width = 200
            chart.data = [
                [report_data['overview'].get('total_income', 0)],
                [report_data['overview'].get('total_expenses', 0)]
            ]
            chart.categoryAxis.categoryNames = ['Income', 'Expenses']
            chart.bars[0].fillColor = colors.HexColor('#059669')
            chart.bars[1].fillColor = colors.HexColor('#dc2626')
            drawing.add(chart)
            
            # Add compact chart title
            title = String(150, 130, 'Financial Overview', textAnchor='middle')
            title.fontName = 'Helvetica-Bold'
            title.fontSize = 10
            title.fillColor = colors.HexColor('#1e40af')
            drawing.add(title)
            
            story.append(drawing)
            story.append(Spacer(1, 10))
    
    # Properties Section
    if 'sections' in report_data and 'properties' in report_data['sections'] and report_data['sections']['properties'].get('properties'):
        story.append(Paragraph("Properties Portfolio", section_style))
        
        properties = report_data['sections']['properties']['properties']
        prop_data = [['Property Name', 'Address', 'Status', 'Monthly Rent', 'Tenant']]
        
        for prop in properties[:10]:  # Show fewer properties for compactness
            # Create colored status badges
            status = prop.get('status', 'N/A').lower()
            if status == 'occupied':
                status_badge = Paragraph(f'<font color="green"><b>●</b></font> Occupied', styles['Normal'])
            elif status == 'available':
                status_badge = Paragraph(f'<font color="orange"><b>●</b></font> Available', styles['Normal'])
            else:
                status_badge = Paragraph(f'<font color="gray"><b>●</b></font> {status.title()}', styles['Normal'])
            
            prop_data.append([
                prop.get('title', 'N/A'),
                prop.get('address', 'N/A'),
                status_badge,
                f"${prop.get('monthly_rent', 0):,.2f}" if prop.get('monthly_rent') else 'N/A',
                prop.get('tenant_name', 'Vacant')
            ])
        
        prop_table = Table(prop_data, colWidths=[1.8*inch, 2.8*inch, 1*inch, 1.2*inch, 1.4*inch])
        prop_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (1, -1), 'LEFT'),  # Text columns left-aligned
            ('ALIGN', (2, 0), (2, -1), 'CENTER'),  # Status column center-aligned
            ('ALIGN', (3, 0), (3, -1), 'RIGHT'),  # Rent column right-aligned
            ('ALIGN', (4, 0), (4, -1), 'LEFT'),  # Tenant column left-aligned
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8)
        ]))
        story.append(prop_table)
        story.append(Spacer(1, 20))
    
    # Tenants Section
    if 'sections' in report_data and 'tenants' in report_data['sections'] and report_data['sections']['tenants'].get('tenants'):
        story.append(Paragraph("Tenants Management", section_style))
        
        tenants = report_data['sections']['tenants']['tenants']
        tenant_data = [['Name', 'Property', 'Monthly Rent', 'Lease End', 'Status']]
        
        for tenant in tenants[:10]:
            # Create colored status badges
            is_active = tenant.get('is_active', False)
            if is_active:
                status_badge = Paragraph(f'<font color="green"><b>●</b></font> Active', styles['Normal'])
            else:
                status_badge = Paragraph(f'<font color="red"><b>●</b></font> Inactive', styles['Normal'])
            
            tenant_data.append([
                tenant.get('full_name', 'N/A'),
                tenant.get('property_title', 'N/A'),
                f"${tenant.get('monthly_rent', 0):,.2f}" if tenant.get('monthly_rent') else 'N/A',
                tenant.get('lease_end', 'N/A'),
                status_badge
            ])
        
        tenant_table = Table(tenant_data, colWidths=[2*inch, 2.2*inch, 1.2*inch, 1.2*inch, 1.2*inch])
        tenant_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#059669')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (1, -1), 'LEFT'),  # Name and Property left-aligned
            ('ALIGN', (2, 0), (2, -1), 'RIGHT'),  # Rent right-aligned
            ('ALIGN', (3, 0), (3, -1), 'CENTER'),  # Lease End center-aligned
            ('ALIGN', (4, 0), (4, -1), 'CENTER'),  # Status center-aligned
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f0fdf4')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1fae5')),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0fdf4')]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8)
        ]))
        story.append(tenant_table)
        story.append(Spacer(1, 25))
    
    # Maintenance Section
    if 'sections' in report_data and 'maintenance' in report_data['sections'] and report_data['sections']['maintenance'].get('requests'):
        story.append(Paragraph("Maintenance Operations", section_style))
        
        requests = report_data['sections']['maintenance']['requests']
        maint_data = [['Title', 'Property', 'Priority', 'Status', 'Cost']]
        
        for req in requests[:10]:
            priority_icon = '🔴' if req.get('priority') == 'HIGH' else '🟡' if req.get('priority') == 'MEDIUM' else '🟢'
            status_icon = '✅' if req.get('status') == 'COMPLETED' else '🔄' if req.get('status') == 'IN_PROGRESS' else '⏳'
            maint_data.append([
                req.get('title', 'N/A')[:35] + '...' if len(req.get('title', '')) > 35 else req.get('title', 'N/A'),
                req.get('property_title', 'N/A')[:30] + '...' if len(req.get('property_title', '')) > 30 else req.get('property_title', 'N/A'),
                f"{priority_icon} {req.get('priority', 'N/A')}",
                f"{status_icon} {req.get('status', 'N/A')}",
                f"${req.get('cost', 0):,.2f}" if req.get('cost') else 'N/A'
            ])
        
        maint_table = Table(maint_data, colWidths=[2*inch, 1.8*inch, 1*inch, 1*inch, 1*inch])
        maint_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ea580c')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 15),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#fff7ed')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#fed7aa')),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fff7ed')]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8)
        ]))
        story.append(maint_table)
        story.append(Spacer(1, 25))
    
    # Financial Section
    if 'sections' in report_data and 'financial' in report_data['sections'] and report_data['sections']['financial'].get('transactions'):
        story.append(Paragraph("Financial Transactions", section_style))
        
        transactions = report_data['sections']['financial']['transactions']
        trans_data = [['Type', 'Amount', 'Description', 'Date', 'Property']]
        
        for trans in transactions[:10]:
            type_icon = '💰' if trans.get('type') == 'INCOME' else '💸'
            trans_data.append([
                f"{type_icon} {trans.get('type', 'N/A')}",
                f"${trans.get('amount', 0):,.2f}" if trans.get('amount') else 'N/A',
                trans.get('description', 'N/A')[:35] + '...' if len(trans.get('description', '')) > 35 else trans.get('description', 'N/A'),
                trans.get('date', 'N/A'),
                trans.get('property_title', 'N/A')[:25] + '...' if len(trans.get('property_title', '')) > 25 else trans.get('property_title', 'N/A')
            ])
        
        trans_table = Table(trans_data, colWidths=[1.2*inch, 1*inch, 2*inch, 1*inch, 1.2*inch])
        trans_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#7c3aed')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 15),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#faf5ff')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e9d5ff')),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#faf5ff')]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8)
        ]))
        story.append(trans_table)
    
    # Professional Footer
    story.append(Spacer(1, 30))
    
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        spaceBefore=10,
        alignment=1,
        textColor=colors.HexColor('#64748b'),
        fontName='Helvetica'
    )
    
    footer_text = """
    <b>CONFIDENTIAL</b> - This report contains proprietary and confidential information.<br/>
    For questions or support, contact: support@propertymanagement.com | Phone: (555) 123-4567<br/>
    Page 1 of 1 | Generated by Property Management System
    """
    story.append(Paragraph(footer_text, footer_style))
    
    doc.build(story)
    return buffer

# Helper functions
def get_last_maintenance_date(property_id):
    """Get the date of the last maintenance request for a property"""
    last_request = MaintenanceRequest.query.filter_by(property_id=property_id).order_by(desc(MaintenanceRequest.request_date)).first()
    return last_request.request_date.strftime('%Y-%m-%d') if last_request else 'N/A'

def get_last_service_date(vendor_id):
    """Get the date of the last service provided by a vendor"""
    last_request = MaintenanceRequest.query.filter_by(assigned_vendor_id=vendor_id).order_by(desc(MaintenanceRequest.completion_date)).first()
    return last_request.completion_date.strftime('%Y-%m-%d') if last_request and last_request.completion_date else 'N/A'

def calculate_vacant_days(property_id, start_date, end_date):
    """Calculate vacant days for a property in the given date range"""
    # This is a simplified calculation - in a real system, you'd track vacancy periods
    tenant = Tenant.query.filter_by(property_id=property_id).first()
    if not tenant or not tenant.lease_start or not tenant.lease_end:
        return (end_date - start_date).days
    
    # Calculate overlap with date range
    lease_start = max(tenant.lease_start, start_date)
    lease_end = min(tenant.lease_end, end_date)
    
    if lease_start > lease_end:
        return (end_date - start_date).days
    
    occupied_days = (lease_end - lease_start).days
    total_days = (end_date - start_date).days
    
    return max(0, total_days - occupied_days)
