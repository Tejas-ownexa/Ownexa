from flask import Blueprint, request, jsonify
from models.association import (Association, AssociationManager, OwnershipAccount, AssociationMembership,
                              AssociationBalance, Violation, AssociationPropertyAssignment)
from models.property import Property
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
            # Get managers for this association
            managers = []
            for manager in a.managers:
                managers.append({
                    'id': manager.id,
                    'name': manager.name,
                    'email': manager.email,
                    'phone': manager.phone,
                    'is_primary': manager.is_primary
                })
            
            # Get rental owners from assigned properties
            rental_owners = []
            for assignment in a.property_assignments:
                property_obj = Property.query.get(assignment.property_id)
                if property_obj and property_obj.rental_owner:
                    # Check if this rental owner is already added
                    existing_owner = next((ro for ro in rental_owners if ro['id'] == property_obj.rental_owner.id), None)
                    if not existing_owner:
                        rental_owners.append({
                            'id': property_obj.rental_owner.id,
                            'company_name': property_obj.rental_owner.company_name,
                            'contact_person': property_obj.rental_owner.contact_person,
                            'phone_number': property_obj.rental_owner.phone_number,
                            'email': property_obj.rental_owner.email,
                            'business_type': property_obj.rental_owner.business_type
                        })
            
            association_data = {
                'id': a.id,
                'name': a.name,
                'street_address_1': a.street_address_1,
                'street_address_2': a.street_address_2,
                'apt_number': a.apt_number,
                'city': a.city,
                'state': a.state,
                'zip_code': a.zip_code,
                'manager': a.manager if a.manager and a.manager != 'None' else None,  # Backward compatibility
                'managers': managers,
                'rental_owners': rental_owners,
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
            manager=data.get('manager', '')  # Keep for backward compatibility
        )
        
        db.session.add(new_association)
        db.session.flush()  # Get the ID before committing
        
        # Add managers if provided
        managers_data = data.get('managers', [])
        if managers_data:
            for i, manager_data in enumerate(managers_data):
                if manager_data.get('name', '').strip():  # Only add if name is provided
                    manager = AssociationManager(
                        association_id=new_association.id,
                        name=manager_data['name'],
                        email=manager_data.get('email', ''),
                        phone=manager_data.get('phone', ''),
                        is_primary=(i == 0)  # First manager is primary
                    )
                    db.session.add(manager)
        
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
        
        # Get managers for this association
        managers = []
        for manager in association.managers:
            managers.append({
                'id': manager.id,
                'name': manager.name,
                'email': manager.email,
                'phone': manager.phone,
                'is_primary': manager.is_primary
            })
        
        # Get assigned properties for this association
        assigned_properties = []
        for assignment in association.property_assignments:
            property_obj = Property.query.get(assignment.property_id)
            if property_obj:
                # Get rental owner information if available
                rental_owner_info = None
                if property_obj.rental_owner:
                    rental_owner_info = {
                        'id': property_obj.rental_owner.id,
                        'company_name': property_obj.rental_owner.company_name,
                        'contact_person': property_obj.rental_owner.contact_person,
                        'phone_number': property_obj.rental_owner.phone_number,
                        'email': property_obj.rental_owner.email,
                        'business_type': property_obj.rental_owner.business_type
                    }
                
                assigned_properties.append({
                    'id': property_obj.id,
                    'title': property_obj.title,
                    'address': {
                        'street_1': property_obj.street_address_1,
                        'street_2': property_obj.street_address_2,
                        'apt': property_obj.apt_number,
                        'city': property_obj.city,
                        'state': property_obj.state,
                        'zip': property_obj.zip_code,
                    },
                    'rent_amount': float(property_obj.rent_amount) if property_obj.rent_amount else None,
                    'status': property_obj.status,
                    'rental_owner': rental_owner_info,
                    'assignment': {
                        'id': assignment.id,
                        'hoa_fees': float(assignment.hoa_fees) if assignment.hoa_fees else None,
                        'special_assessment': float(assignment.special_assessment) if assignment.special_assessment else None,
                        'shipping_address': {
                            'street_1': assignment.ship_street_address_1,
                            'street_2': assignment.ship_street_address_2,
                            'city': assignment.ship_city,
                            'state': assignment.ship_state,
                            'zip': assignment.ship_zip_code,
                        }
                    }
                })
        
        association_data = {
            'id': association.id,
            'name': association.name,
            'street_address_1': association.street_address_1,
            'street_address_2': association.street_address_2,
            'apt_number': association.apt_number,
            'city': association.city,
            'state': association.state,
            'zip_code': association.zip_code,
            'manager': association.manager if association.manager and association.manager != 'None' else None,  # Backward compatibility
            'managers': managers,
            'assigned_properties': assigned_properties,
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

@association_bp.route('/<int:association_id>/available-properties', methods=['GET'])
@token_required
def get_available_properties_for_association(current_user, association_id):
    """Get properties owned by the current user that are not yet assigned to any association"""
    try:
        # Ensure the assignment table exists
        _ensure_assignment_table_exists()
        
        # Get all properties owned by the current user
        user_properties = Property.query.filter(Property.owner_id == current_user.id).all()
        
        # Get assigned property IDs (handle case where table might be empty)
        try:
            assigned_property_ids = db.session.query(AssociationPropertyAssignment.property_id).distinct().all()
            assigned_ids = [row[0] for row in assigned_property_ids]
        except Exception:
            # If there's an error querying assignments, assume no assignments exist
            assigned_ids = []
        
        # Filter out assigned properties
        available_properties = [p for p in user_properties if p.id not in assigned_ids]

        result = []
        for p in available_properties:
            result.append({
                'id': p.id,
                'title': p.title,
                'address': {
                    'street_1': p.street_address_1,
                    'street_2': p.street_address_2,
                    'apt': p.apt_number,
                    'city': p.city,
                    'state': p.state,
                    'zip': p.zip_code,
                },
                'rent_amount': float(p.rent_amount) if p.rent_amount else None,
                'status': p.status,
            })

        return jsonify({'available_properties': result}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def _ensure_assignment_table_exists():
    """Create the association_property_assignments table if it doesn't exist (PostgreSQL-safe)."""
    try:
        db.session.execute(db.text(
            """
            CREATE TABLE IF NOT EXISTS association_property_assignments (
                id SERIAL PRIMARY KEY,
                association_id INTEGER NOT NULL,
                property_id INTEGER NOT NULL,
                hoa_fees NUMERIC(10, 2),
                special_assessment NUMERIC(10, 2),
                ship_street_address_1 VARCHAR(255),
                ship_street_address_2 VARCHAR(255),
                ship_city VARCHAR(100),
                ship_state VARCHAR(100),
                ship_zip_code VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(association_id) REFERENCES associations(id),
                FOREIGN KEY(property_id) REFERENCES properties(id)
            )
            """
        ))
        db.session.commit()
    except Exception:
        db.session.rollback()

@association_bp.route('/<int:association_id>/assign-property', methods=['POST'])
@token_required
def assign_property_to_association(current_user, association_id):
    """Assign a property to an association with fees and shipping address."""
    try:
        data = request.get_json() or {}

        required = ['property_id']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400

        property_id = data['property_id']

        # Validate association and property
        association = Association.query.get_or_404(association_id)
        property_obj = Property.query.get_or_404(property_id)

        # Ensure user owns the property
        if property_obj.owner_id != current_user.id:
            return jsonify({'error': 'You do not own this property'}), 403

        # Ensure table exists (for environments without migrations)
        _ensure_assignment_table_exists()

        # Check if already assigned
        existing = AssociationPropertyAssignment.query.filter_by(property_id=property_id).first()
        if existing:
            return jsonify({'error': 'Property is already assigned to an association'}), 400

        assignment = AssociationPropertyAssignment(
            association_id=association.id,
            property_id=property_obj.id,
            hoa_fees=data.get('hoa_fees'),
            special_assessment=data.get('special_assessment'),
            ship_street_address_1=data.get('ship_street_address_1'),
            ship_street_address_2=data.get('ship_street_address_2'),
            ship_city=data.get('ship_city'),
            ship_state=data.get('ship_state'),
            ship_zip_code=data.get('ship_zip_code'),
        )

        db.session.add(assignment)
        db.session.commit()

        return jsonify({
            'message': 'Property assigned successfully',
            'assignment': {
                'id': assignment.id,
                'association_id': assignment.association_id,
                'property_id': assignment.property_id,
                'hoa_fees': float(assignment.hoa_fees) if assignment.hoa_fees is not None else None,
                'special_assessment': float(assignment.special_assessment) if assignment.special_assessment is not None else None,
                'shipping_address': {
                    'street_1': assignment.ship_street_address_1,
                    'street_2': assignment.ship_street_address_2,
                    'city': assignment.ship_city,
                    'state': assignment.ship_state,
                    'zip': assignment.ship_zip_code,
                },
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@association_bp.route('/<int:association_id>/managers', methods=['POST'])
@token_required
def add_association_manager(current_user, association_id):
    """Add a new manager to an association"""
    try:
        # Find the association
        association = Association.query.get_or_404(association_id)
        
        data = request.json
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'error': 'Manager name is required'}), 400
        
        # Create new manager
        new_manager = AssociationManager(
            association_id=association_id,
            name=data['name'],
            email=data.get('email', ''),
            phone=data.get('phone', ''),
            is_primary=data.get('is_primary', False)
        )
        
        db.session.add(new_manager)
        db.session.commit()
        
        return jsonify({
            'message': 'Manager added successfully',
            'manager': {
                'id': new_manager.id,
                'name': new_manager.name,
                'email': new_manager.email,
                'phone': new_manager.phone,
                'is_primary': new_manager.is_primary
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@association_bp.route('/<int:association_id>/managers/<int:manager_id>', methods=['PUT'])
@token_required
def update_association_manager(current_user, association_id, manager_id):
    """Update an association manager"""
    try:
        # Find the association
        association = Association.query.get_or_404(association_id)
        
        # Find the manager
        manager = AssociationManager.query.filter_by(
            id=manager_id, 
            association_id=association_id
        ).first()
        
        if not manager:
            return jsonify({'error': 'Manager not found'}), 404
        
        data = request.json
        
        # Update manager fields
        if 'name' in data:
            manager.name = data['name']
        if 'email' in data:
            manager.email = data['email']
        if 'phone' in data:
            manager.phone = data['phone']
        
        # Update timestamp
        manager.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Manager updated successfully',
            'manager': {
                'id': manager.id,
                'name': manager.name,
                'email': manager.email,
                'phone': manager.phone,
                'is_primary': manager.is_primary
            }
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