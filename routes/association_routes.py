from flask import Blueprint, request, jsonify
from models.association import (Association, OwnershipAccount, AssociationMembership,
                              AssociationBalance, Violation)
from config import db
from datetime import datetime

association_bp = Blueprint('association_bp', __name__)

@association_bp.route('/', methods=['GET'])
def get_associations():
    associations = Association.query.all()
    return jsonify([{
        'id': a.id,
        'name': a.name,
        'location': a.location,
        'manager': a.manager
    } for a in associations])

@association_bp.route('/', methods=['POST'])
def create_association():
    data = request.json
    new_association = Association(
        name=data['name'],
        location=data['location'],
        manager=data['manager']
    )
    db.session.add(new_association)
    db.session.commit()
    return jsonify({
        'id': new_association.id,
        'name': new_association.name,
        'location': new_association.location,
        'manager': new_association.manager
    }), 201