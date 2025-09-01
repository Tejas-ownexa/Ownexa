from flask import Blueprint, request, jsonify
from models.listing import Listing, Applicant
from config import db
from datetime import datetime

listing_bp = Blueprint('listing_bp', __name__)

@listing_bp.route('', methods=['POST'])
def create_listing():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        required_fields = ['property_id', 'listed_by', 'rent_price']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        listing = Listing(
            property_id=data['property_id'],
            listing_date=datetime.strptime(data.get('listing_date', datetime.now().strftime('%Y-%m-%d')), '%Y-%m-%d').date(),
            listed_by=data['listed_by'],
            status=data.get('status', 'active'),
            rent_price=data['rent_price'],
            notes=data.get('notes')
        )
        listing.save()
        return jsonify({
            'message': 'Listing created successfully',
            'listing_id': listing.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@listing_bp.route('', methods=['GET'])
def get_listings():
    listings = Listing.query.all()
    return jsonify([{
        'id': listing.id,
        'property_id': listing.property_id,
        'listing_date': listing.listing_date.isoformat() if listing.listing_date else None,
        'listed_by': listing.listed_by,
        'status': listing.status,
        'rent_price': float(listing.rent_price) if listing.rent_price else None,
        'notes': listing.notes
    } for listing in listings]), 200

@listing_bp.route('/<int:listing_id>', methods=['GET'])
def get_listing(listing_id):
    listing = Listing.query.get_or_404(listing_id)
    return jsonify({
        'id': listing.id,
        'property_id': listing.property_id,
        'listing_date': listing.listing_date.isoformat() if listing.listing_date else None,
        'listed_by': listing.listed_by,
        'status': listing.status,
        'rent_price': float(listing.rent_price) if listing.rent_price else None,
        'notes': listing.notes
    }), 200

@listing_bp.route('/applicants', methods=['POST'])
def create_applicant():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        required_fields = ['listing_id', 'full_name', 'email', 'phone_number']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        applicant = Applicant(
            listing_id=data['listing_id'],
            full_name=data['full_name'],
            email=data['email'],
            phone_number=data['phone_number'],
            status=data.get('status', 'pending'),
            application_date=datetime.strptime(data.get('application_date', datetime.now().strftime('%Y-%m-%d')), '%Y-%m-%d').date()
        )
        applicant.save()
        return jsonify({
            'message': 'Applicant created successfully',
            'applicant_id': applicant.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@listing_bp.route('/applicants/<int:listing_id>', methods=['GET'])
def get_listing_applicants(listing_id):
    applicants = Applicant.query.filter_by(listing_id=listing_id).all()
    return jsonify([{
        'id': applicant.id,
        'full_name': applicant.full_name,
        'email': applicant.email,
        'phone_number': applicant.phone_number,
        'status': applicant.status,
        'application_date': applicant.application_date.isoformat() if applicant.application_date else None
    } for applicant in applicants]), 200