from flask import Blueprint, request, jsonify
from models.vendor import Vendor, VendorCategory
from models.user import User
from config import db
from routes.auth_routes import token_required
from datetime import datetime
from sqlalchemy import or_, and_

vendor_bp = Blueprint('vendor_bp', __name__)

# Vendor Categories Routes
@vendor_bp.route('/categories', methods=['GET'])
@token_required
def get_vendor_categories(current_user):
    """Get all vendor categories"""
    try:
        categories = VendorCategory.query.all()
        return jsonify([{
            'id': category.id,
            'name': category.name,
            'description': category.description,
            'is_deletable': category.is_deletable,
            'vendor_count': len(category.vendors) if category.vendors else 0
        } for category in categories]), 200
    except Exception as e:
        print(f"Error fetching categories: {str(e)}")
        return jsonify({'error': str(e)}), 400

@vendor_bp.route('/categories', methods=['POST'])
@token_required
def create_vendor_category(current_user):
    """Create a new vendor category"""
    try:
        if current_user.role not in ['OWNER', 'AGENT']:
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        if not data.get('name'):
            return jsonify({'error': 'Category name is required'}), 400
        
        # Check if category already exists
        existing = VendorCategory.query.filter_by(name=data['name']).first()
        if existing:
            return jsonify({'error': 'Category already exists'}), 400
        
        category = VendorCategory(
            name=data['name'],
            description=data.get('description'),
            created_by_user_id=current_user.id
        )
        
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'message': 'Category created successfully',
            'category': {
                'id': category.id,
                'name': category.name,
                'description': category.description
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating category: {str(e)}")
        return jsonify({'error': str(e)}), 400

@vendor_bp.route('/categories/<int:category_id>', methods=['DELETE'])
@token_required
def delete_vendor_category(current_user, category_id):
    """Delete a vendor category"""
    try:
        if current_user.role not in ['OWNER', 'AGENT']:
            return jsonify({'error': 'Access denied'}), 403
        
        category = VendorCategory.query.get_or_404(category_id)
        
        if not category.is_deletable:
            return jsonify({'error': 'This category cannot be deleted'}), 400
        
        # Check if category has vendors
        vendor_count = Vendor.query.filter_by(category_id=category_id).count()
        if vendor_count > 0:
            return jsonify({'error': f'Cannot delete category with {vendor_count} vendors'}), 400
        
        db.session.delete(category)
        db.session.commit()
        
        return jsonify({'message': 'Category deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting category: {str(e)}")
        return jsonify({'error': str(e)}), 400

# Vendor Routes
@vendor_bp.route('', methods=['GET'])
@token_required
def get_vendors(current_user):
    """Get all vendors for current user"""
    try:
        if current_user.role not in ['OWNER', 'AGENT']:
            return jsonify({'error': 'Access denied'}), 403
        
        # Get filter parameters
        category_id = request.args.get('category')
        status = request.args.get('status', 'active')
        search = request.args.get('search', '')
        
        # Build query
        query = Vendor.query.filter_by(created_by_user_id=current_user.id)
        
        if status == 'active':
            query = query.filter_by(is_active=True)
        elif status == 'inactive':
            query = query.filter_by(is_active=False)
        
        if category_id:
            query = query.filter_by(category_id=category_id)
        
        if search:
            search_filter = or_(
                Vendor.first_name.ilike(f'%{search}%'),
                Vendor.last_name.ilike(f'%{search}%'),
                Vendor.company_name.ilike(f'%{search}%'),
                Vendor.primary_email.ilike(f'%{search}%')
            )
            query = query.filter(search_filter)
        
        vendors = query.all()
        
        return jsonify([{
            'id': vendor.id,
            'first_name': vendor.first_name,
            'last_name': vendor.last_name,
            'full_name': vendor.full_name,
            'company_name': vendor.company_name,
            'display_name': vendor.display_name,
            'is_company': vendor.is_company,
            'primary_email': vendor.primary_email,
            'phone_1': vendor.phone_1,
            'category': {
                'id': vendor.category.id,
                'name': vendor.category.name
            } if vendor.category else None,
            'insurance_provider': vendor.insurance_provider,
            'insurance_expiration_date': vendor.insurance_expiration_date,
            'website': vendor.website,
            'is_active': vendor.is_active,
            'is_verified': vendor.is_verified,
            'created_at': vendor.created_at.isoformat() if vendor.created_at else None
        } for vendor in vendors]), 200
    except Exception as e:
        print(f"Error fetching vendors: {str(e)}")
        return jsonify({'error': str(e)}), 400

@vendor_bp.route('', methods=['POST'])
@token_required
def create_vendor(current_user):
    """Create a new vendor"""
    try:
        if current_user.role not in ['OWNER', 'AGENT']:
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['first_name', 'last_name', 'primary_email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create vendor
        vendor = Vendor(
            created_by_user_id=current_user.id,
            first_name=data['first_name'],
            last_name=data['last_name'],
            company_name=data.get('company_name'),
            is_company=data.get('is_company', False),
            category_id=data.get('category_id'),
            expense_account=data.get('expense_account'),
            account_number=data.get('account_number'),
            primary_email=data['primary_email'],
            alternate_email=data.get('alternate_email'),
            phone_1=data.get('phone_1'),
            phone_2=data.get('phone_2'),
            phone_3=data.get('phone_3'),
            phone_4=data.get('phone_4'),
            street_address=data.get('street_address'),
            city=data.get('city'),
            state=data.get('state'),
            zip_code=data.get('zip_code'),
            country=data.get('country', 'United States'),
            website=data.get('website'),
            comments=data.get('comments'),
            tax_id_type=data.get('tax_id_type'),
            taxpayer_id=data.get('taxpayer_id'),
            use_different_name=data.get('use_different_name', False),
            use_different_address=data.get('use_different_address', False),
            insurance_provider=data.get('insurance_provider'),
            policy_number=data.get('policy_number'),
            insurance_expiration_date=data.get('insurance_expiration_date')
        )
        
        db.session.add(vendor)
        db.session.commit()
        
        return jsonify({
            'message': 'Vendor created successfully',
            'vendor': {
                'id': vendor.id,
                'full_name': vendor.full_name,
                'display_name': vendor.display_name,
                'primary_email': vendor.primary_email
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating vendor: {str(e)}")
        return jsonify({'error': str(e)}), 400

@vendor_bp.route('/<int:vendor_id>', methods=['GET'])
@token_required
def get_vendor(current_user, vendor_id):
    """Get a specific vendor"""
    try:
        vendor = Vendor.query.filter_by(
            id=vendor_id,
            created_by_user_id=current_user.id
        ).first_or_404()
        
        return jsonify({
            'id': vendor.id,
            'first_name': vendor.first_name,
            'last_name': vendor.last_name,
            'company_name': vendor.company_name,
            'is_company': vendor.is_company,
            'category_id': vendor.category_id,
            'expense_account': vendor.expense_account,
            'account_number': vendor.account_number,
            'primary_email': vendor.primary_email,
            'alternate_email': vendor.alternate_email,
            'phone_1': vendor.phone_1,
            'phone_2': vendor.phone_2,
            'phone_3': vendor.phone_3,
            'phone_4': vendor.phone_4,
            'street_address': vendor.street_address,
            'city': vendor.city,
            'state': vendor.state,
            'zip_code': vendor.zip_code,
            'country': vendor.country,
            'website': vendor.website,
            'comments': vendor.comments,
            'tax_id_type': vendor.tax_id_type,
            'taxpayer_id': vendor.taxpayer_id,
            'use_different_name': vendor.use_different_name,
            'use_different_address': vendor.use_different_address,
            'insurance_provider': vendor.insurance_provider,
            'policy_number': vendor.policy_number,
            'insurance_expiration_date': vendor.insurance_expiration_date,
            'is_active': vendor.is_active,
            'is_verified': vendor.is_verified,
            'category': {
                'id': vendor.category.id,
                'name': vendor.category.name
            } if vendor.category else None,
            'created_at': vendor.created_at.isoformat() if vendor.created_at else None
        }), 200
    except Exception as e:
        print(f"Error fetching vendor: {str(e)}")
        return jsonify({'error': str(e)}), 400

@vendor_bp.route('/<int:vendor_id>', methods=['PUT'])
@token_required
def update_vendor(current_user, vendor_id):
    """Update a vendor"""
    try:
        vendor = Vendor.query.filter_by(
            id=vendor_id,
            created_by_user_id=current_user.id
        ).first_or_404()
        
        data = request.get_json()
        
        # Update fields
        updateable_fields = [
            'first_name', 'last_name', 'company_name', 'is_company', 'category_id',
            'expense_account', 'account_number', 'primary_email', 'alternate_email',
            'phone_1', 'phone_2', 'phone_3', 'phone_4', 'street_address', 'city',
            'state', 'zip_code', 'country', 'website', 'comments', 'tax_id_type',
            'taxpayer_id', 'use_different_name', 'use_different_address',
            'insurance_provider', 'policy_number', 'insurance_expiration_date'
        ]
        
        for field in updateable_fields:
            if field in data:
                setattr(vendor, field, data[field])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Vendor updated successfully',
            'vendor': {
                'id': vendor.id,
                'full_name': vendor.full_name,
                'display_name': vendor.display_name
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error updating vendor: {str(e)}")
        return jsonify({'error': str(e)}), 400

@vendor_bp.route('/<int:vendor_id>', methods=['DELETE'])
@token_required
def delete_vendor(current_user, vendor_id):
    """Delete a vendor"""
    try:
        vendor = Vendor.query.filter_by(
            id=vendor_id,
            created_by_user_id=current_user.id
        ).first_or_404()
        
        # Check if vendor has active work orders
        from models.work_order import WorkOrder
        active_work_orders = WorkOrder.query.filter_by(
            assigned_vendor_id=vendor_id
        ).filter(WorkOrder.status.in_(['new', 'in_progress'])).count()
        
        if active_work_orders > 0:
            return jsonify({
                'error': f'Cannot delete vendor with {active_work_orders} active work orders'
            }), 400
        
        db.session.delete(vendor)
        db.session.commit()
        
        return jsonify({'message': 'Vendor deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting vendor: {str(e)}")
        return jsonify({'error': str(e)}), 400

@vendor_bp.route('/export', methods=['GET'])
@token_required
def export_vendors(current_user):
    """Export vendors to CSV"""
    try:
        if current_user.role not in ['OWNER', 'AGENT']:
            return jsonify({'error': 'Access denied'}), 403
        
        import csv
        import io
        from flask import make_response
        
        vendors = Vendor.query.filter_by(created_by_user_id=current_user.id).all()
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'First Name', 'Last Name', 'Company Name', 'Email', 'Phone',
            'Category', 'Address', 'City', 'State', 'ZIP', 'Website',
            'Insurance Provider', 'Policy Number', 'Insurance Expiration'
        ])
        
        # Write vendor data
        for vendor in vendors:
            writer.writerow([
                vendor.first_name,
                vendor.last_name,
                vendor.company_name or '',
                vendor.primary_email,
                vendor.phone_1 or '',
                vendor.category.name if vendor.category else '',
                vendor.street_address or '',
                vendor.city or '',
                vendor.state or '',
                vendor.zip_code or '',
                vendor.website or '',
                vendor.insurance_provider or '',
                vendor.policy_number or '',
                vendor.insurance_expiration_date or ''
            ])
        
        output.seek(0)
        response = make_response(output.getvalue())
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = f'attachment; filename=vendors_{datetime.now().strftime("%Y%m%d")}.csv'
        
        return response
    except Exception as e:
        print(f"Error exporting vendors: {str(e)}")
        return jsonify({'error': str(e)}), 400