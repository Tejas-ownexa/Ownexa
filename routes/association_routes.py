from flask import Blueprint, request, jsonify
from models.association import (Association, OwnershipAccount, AssociationMembership,
                              AssociationBalance, Violation)
from config import db
from datetime import datetime
from routes.auth_routes import token_required

association_bp = Blueprint('association_bp', __name__)

@association_bp.route('/', methods=['GET'])
@token_required
def get_associations(current_user):
    """Get all associations"""
    try:
        associations = Association.query.all()
        result = []
        for a in associations:
            association_data = {
                'id': a.id,
                'name': a.name,
                'street_address_1': a.street_address_1,
                'street_address_2': a.street_address_2,
                'apt_number': a.apt_number,
                'city': a.city,
                'state': a.state,
                'zip_code': a.zip_code,
                'manager': a.manager if a.manager and a.manager != 'None' else None,
                'created_at': a.created_at.isoformat() if a.created_at else None,
                'updated_at': a.updated_at.isoformat() if a.updated_at else None
            }
            # Add full address for display
            address_parts = [a.street_address_1]
            if a.street_address_2:
                address_parts.append(a.street_address_2)
            if a.apt_number:
                address_parts.append(f"Apt {a.apt_number}")
            address_parts.extend([a.city, a.state, a.zip_code])
            association_data['full_address'] = ', '.join(filter(None, address_parts))
            result.append(association_data)
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@association_bp.route('/', methods=['POST'])
@token_required
def create_association(current_user):
    """Create a new association"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['name', 'street_address_1', 'city', 'state', 'zip_code']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create new association
        new_association = Association(
            name=data['name'],
            street_address_1=data['street_address_1'],
            street_address_2=data.get('street_address_2'),
            apt_number=data.get('apt_number'),
            city=data['city'],
            state=data['state'],
            zip_code=data['zip_code'],
            manager=data.get('manager')
        )
        
        db.session.add(new_association)
        db.session.commit()
        
        # Return the created association
        association_data = {
            'id': new_association.id,
            'name': new_association.name,
            'street_address_1': new_association.street_address_1,
            'street_address_2': new_association.street_address_2,
            'apt_number': new_association.apt_number,
            'city': new_association.city,
            'state': new_association.state,
            'zip_code': new_association.zip_code,
            'manager': new_association.manager if new_association.manager and new_association.manager != 'None' else None,
            'created_at': new_association.created_at.isoformat() if new_association.created_at else None,
            'updated_at': new_association.updated_at.isoformat() if new_association.updated_at else None
        }
        
        # Add full address for display
        address_parts = [new_association.street_address_1]
        if new_association.street_address_2:
            address_parts.append(new_association.street_address_2)
        if new_association.apt_number:
            address_parts.append(f"Apt {new_association.apt_number}")
        address_parts.extend([new_association.city, new_association.state, new_association.zip_code])
        association_data['full_address'] = ', '.join(filter(None, address_parts))
        
        return jsonify({
            'message': 'Association created successfully',
            'association': association_data
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@association_bp.route('/<int:association_id>', methods=['GET'])
@token_required
def get_association(current_user, association_id):
    """Get a specific association by ID"""
    try:
        association = Association.query.get_or_404(association_id)
        
        association_data = {
            'id': association.id,
            'name': association.name,
            'street_address_1': association.street_address_1,
            'street_address_2': association.street_address_2,
            'apt_number': association.apt_number,
            'city': association.city,
            'state': association.state,
            'zip_code': association.zip_code,
            'manager': association.manager if association.manager and association.manager != 'None' else None,
            'created_at': association.created_at.isoformat() if association.created_at else None,
            'updated_at': association.updated_at.isoformat() if association.updated_at else None
        }
        
        # Add full address for display
        address_parts = [association.street_address_1]
        if association.street_address_2:
            address_parts.append(association.street_address_2)
        if association.apt_number:
            address_parts.append(f"Apt {association.apt_number}")
        address_parts.extend([association.city, association.state, association.zip_code])
        association_data['full_address'] = ', '.join(filter(None, address_parts))
        
        return jsonify(association_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@association_bp.route('/<int:association_id>', methods=['PUT'])
@token_required
def update_association(current_user, association_id):
    """Update an existing association"""
    try:
        association = Association.query.get_or_404(association_id)
        data = request.json
        
        # Update fields if provided
        if 'name' in data:
            association.name = data['name']
        if 'street_address_1' in data:
            association.street_address_1 = data['street_address_1']
        if 'street_address_2' in data:
            association.street_address_2 = data.get('street_address_2')
        if 'apt_number' in data:
            association.apt_number = data.get('apt_number')
        if 'city' in data:
            association.city = data['city']
        if 'state' in data:
            association.state = data['state']
        if 'zip_code' in data:
            association.zip_code = data['zip_code']
        if 'manager' in data:
            association.manager = data.get('manager')
        
        # Update timestamp
        association.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Return updated association
        association_data = {
            'id': association.id,
            'name': association.name,
            'street_address_1': association.street_address_1,
            'street_address_2': association.street_address_2,
            'apt_number': association.apt_number,
            'city': association.city,
            'state': association.state,
            'zip_code': association.zip_code,
            'manager': association.manager if association.manager and association.manager != 'None' else None,
            'created_at': association.created_at.isoformat() if association.created_at else None,
            'updated_at': association.updated_at.isoformat() if association.updated_at else None
        }
        
        # Add full address for display
        address_parts = [association.street_address_1]
        if association.street_address_2:
            address_parts.append(association.street_address_2)
        if association.apt_number:
            address_parts.append(f"Apt {association.apt_number}")
        address_parts.extend([association.city, association.state, association.zip_code])
        association_data['full_address'] = ', '.join(filter(None, address_parts))
        
        return jsonify({
            'message': 'Association updated successfully',
            'association': association_data
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@association_bp.route('/<int:association_id>', methods=['DELETE'])
@token_required
def delete_association(current_user, association_id):
    """Delete an association"""
    try:
        association = Association.query.get_or_404(association_id)
        
        # Check if association has related data
        if association.memberships:
            return jsonify({'error': 'Cannot delete association with existing memberships'}), 400
        if association.ownership_accounts:
            return jsonify({'error': 'Cannot delete association with existing ownership accounts'}), 400
        
        db.session.delete(association)
        db.session.commit()
        
        return jsonify({'message': 'Association deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500