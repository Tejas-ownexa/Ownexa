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
        return jsonify({'error': f'Error generating report: {str(e)}'}), 500

def generate_property_summary_report(user, start_date, end_date):
    """Generate property summary report"""
    # Get properties based on user role using owner_id relationship
    if user.role == 'ADMIN' or user.username == 'admin':
        properties = Property.query.all()
    elif user.role == 'OWNER':
        properties = Property.query.filter_by(owner_id=user.id).all()
    elif user.role == 'AGENT':
        properties = Property.query.filter_by(agent_id=user.id).all()
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
        tenants = Tenant.query.join(Property).filter(Property.agent_id == user.id).all()
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
        requests = MaintenanceRequest.query.filter(
            and_(
                MaintenanceRequest.property_id.in_(
                    Property.query.filter_by(agent_id=user.id).with_entities(Property.id)
                ),
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
        transactions = FinancialTransaction.query.filter(
            and_(
                FinancialTransaction.property_id.in_(
                    Property.query.filter_by(agent_id=user.id).with_entities(Property.id)
                ),
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
        properties = Property.query.filter_by(agent_id=user.id).all()
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
        requests = MaintenanceRequest.query.filter(
            and_(
                MaintenanceRequest.property_id.in_(
                    Property.query.filter_by(agent_id=user.id).with_entities(Property.id)
                ),
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
    property_summary = generate_property_summary_report(user, start_date, end_date)
    tenant_report = generate_tenant_report(user, start_date, end_date)
    maintenance_report = generate_maintenance_report(user, start_date, end_date)
    financial_report = generate_financial_report(user, start_date, end_date)
    rental_report = generate_rental_report(user, start_date, end_date)
    vendor_report = generate_vendor_report(user, start_date, end_date)
    association_report = generate_association_report(user, start_date, end_date)
    
    return {
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

def generate_pdf_report(report_data, report_type, start_date, end_date):
    """Generate PDF report using the existing PDF generator"""
    try:
        pdf_generator = PropertyReportPDFGenerator()
        
        if report_type == 'tenant_report':
            pdf_buffer = pdf_generator.generate_tenant_report_pdf(report_data)
        elif report_type == 'comprehensive_report':
            pdf_buffer = pdf_generator.generate_comprehensive_report_pdf(report_data)
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
    """Generate a generic PDF for report types without specific generators"""
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    story.append(Paragraph(report_data['report_type'], styles['Heading1']))
    story.append(Spacer(1, 20))
    
    # Summary
    story.append(Paragraph("Summary", styles['Heading2']))
    for key, value in report_data['summary'].items():
        story.append(Paragraph(f"{key.replace('_', ' ').title()}: {value}", styles['Normal']))
    
    story.append(Spacer(1, 20))
    
    # Data
    if 'properties' in report_data:
        story.append(Paragraph("Properties", styles['Heading2']))
        for prop in report_data['properties'][:10]:  # Limit to first 10
            story.append(Paragraph(f"- {prop.get('title', 'N/A')}", styles['Normal']))
    
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
