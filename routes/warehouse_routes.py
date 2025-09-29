from flask import Blueprint, request, jsonify
from config import db
from models.warehouse import Warehouse
from models.user import User
from datetime import datetime
from routes.auth_routes import token_required

warehouse_bp = Blueprint('warehouse', __name__)

@warehouse_bp.route('/', methods=['GET'])
@token_required
def get_warehouses(current_user):
    """Get all warehouses for the current user"""
    try:
        warehouses = Warehouse.query.filter_by(owner_id=current_user.id).all()
        result = []
        for warehouse in warehouses:
            result.append(warehouse.to_dict())
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@warehouse_bp.route('/', methods=['POST'])
@token_required
def create_warehouse(current_user):
    """Create a new warehouse"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['name', 'address', 'city', 'state', 'zip_code', 'total_square_feet']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create new warehouse
        new_warehouse = Warehouse(
            name=data['name'],
            description=data.get('description', ''),
            address=data['address'],
            city=data['city'],
            state=data['state'],
            zip_code=data['zip_code'],
            total_square_feet=data['total_square_feet'],
            status=data.get('status', 'active'),
            owner_id=current_user.id,
            purchase_price=data.get('purchase_price'),
            total_value=data.get('total_value'),
            mortgage_amount=data.get('mortgage_amount'),
            loan_term=data.get('loan_term'),
            down_payment=data.get('down_payment'),
            interest_rate=data.get('interest_rate')
        )
        
        db.session.add(new_warehouse)
        db.session.commit()
        
        return jsonify({
            'message': 'Warehouse created successfully',
            'warehouse': new_warehouse.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@warehouse_bp.route('/<int:warehouse_id>', methods=['GET'])
@token_required
def get_warehouse(current_user, warehouse_id):
    """Get a specific warehouse"""
    try:
        warehouse = Warehouse.query.filter_by(
            id=warehouse_id, 
            owner_id=current_user.id
        ).first()
        
        if not warehouse:
            return jsonify({'error': 'Warehouse not found'}), 404
        
        return jsonify(warehouse.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@warehouse_bp.route('/<int:warehouse_id>', methods=['PUT'])
@token_required
def update_warehouse(current_user, warehouse_id):
    """Update a warehouse"""
    try:
        warehouse = Warehouse.query.filter_by(
            id=warehouse_id, 
            owner_id=current_user.id
        ).first()
        
        if not warehouse:
            return jsonify({'error': 'Warehouse not found'}), 404
        
        data = request.json
        
        # Update fields if provided
        if 'name' in data:
            warehouse.name = data['name']
        if 'description' in data:
            warehouse.description = data['description']
        if 'address' in data:
            warehouse.address = data['address']
        if 'city' in data:
            warehouse.city = data['city']
        if 'state' in data:
            warehouse.state = data['state']
        if 'zip_code' in data:
            warehouse.zip_code = data['zip_code']
        if 'total_square_feet' in data:
            warehouse.total_square_feet = data['total_square_feet']
        if 'status' in data:
            warehouse.status = data['status']
        if 'purchase_price' in data:
            warehouse.purchase_price = data['purchase_price']
        if 'total_value' in data:
            warehouse.total_value = data['total_value']
        if 'mortgage_amount' in data:
            warehouse.mortgage_amount = data['mortgage_amount']
        if 'loan_term' in data:
            warehouse.loan_term = data['loan_term']
        if 'down_payment' in data:
            warehouse.down_payment = data['down_payment']
        if 'interest_rate' in data:
            warehouse.interest_rate = data['interest_rate']
        
        # Update timestamp
        warehouse.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Warehouse updated successfully',
            'warehouse': warehouse.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@warehouse_bp.route('/<int:warehouse_id>', methods=['DELETE'])
@token_required
def delete_warehouse(current_user, warehouse_id):
    """Delete a warehouse"""
    try:
        warehouse = Warehouse.query.filter_by(
            id=warehouse_id, 
            owner_id=current_user.id
        ).first()
        
        if not warehouse:
            return jsonify({'error': 'Warehouse not found'}), 404
        
        db.session.delete(warehouse)
        db.session.commit()
        
        return jsonify({'message': 'Warehouse deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
