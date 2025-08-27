from flask import Blueprint, request, jsonify
from config import db
from models.client_inquiry import ClientInquiry
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

client_inquiry_bp = Blueprint('client_inquiry', __name__)

@client_inquiry_bp.route('/api/client-inquiry', methods=['POST'])
def submit_inquiry():
    """
    Handle client inquiry form submission
    Stores the inquiry directly in the database
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['first_name', 'last_name', 'email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create new client inquiry
        inquiry = ClientInquiry(
            first_name=data['first_name'],
            last_name=data['last_name'],
            email=data['email'],
            phone_number=data.get('phone_number'),
            property_type=data.get('property_type'),
            budget_min=data.get('budget_min'),
            budget_max=data.get('budget_max'),
            preferred_location=data.get('preferred_location'),
            move_in_date=datetime.strptime(data['move_in_date'], '%Y-%m-%d').date() if data.get('move_in_date') else None,
            lease_duration=data.get('lease_duration'),
            bedrooms=data.get('bedrooms'),
            bathrooms=data.get('bathrooms'),
            parking_needed=data.get('parking_needed', False),
            pet_friendly=data.get('pet_friendly', False),
            furnished=data.get('furnished', False),
            message=data.get('message')
        )
        
        # Save to database
        db.session.add(inquiry)
        db.session.commit()
        
        # Log successful submission
        logger.info(f'New client inquiry submitted: {inquiry.email} - {inquiry.first_name} {inquiry.last_name}')
        
        return jsonify({
            'success': True,
            'message': 'Your inquiry has been submitted successfully!',
            'inquiry_id': inquiry.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f'Error submitting client inquiry: {str(e)}')
        return jsonify({'error': 'An error occurred while submitting your inquiry'}), 500

@client_inquiry_bp.route('/api/client-inquiry', methods=['GET'])
def get_inquiries():
    """
    Get all client inquiries (for admin/agent use)
    """
    try:
        inquiries = ClientInquiry.query.order_by(ClientInquiry.created_at.desc()).all()
        return jsonify({
            'success': True,
            'inquiries': [inquiry.to_dict() for inquiry in inquiries]
        }), 200
        
    except Exception as e:
        logger.error(f'Error fetching client inquiries: {str(e)}')
        return jsonify({'error': 'An error occurred while fetching inquiries'}), 500

@client_inquiry_bp.route('/api/client-inquiry/<int:inquiry_id>', methods=['GET'])
def get_inquiry(inquiry_id):
    """
    Get a specific client inquiry by ID
    """
    try:
        inquiry = ClientInquiry.query.get_or_404(inquiry_id)
        return jsonify({
            'success': True,
            'inquiry': inquiry.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f'Error fetching client inquiry {inquiry_id}: {str(e)}')
        return jsonify({'error': 'Inquiry not found'}), 404

@client_inquiry_bp.route('/api/client-inquiry/<int:inquiry_id>', methods=['PUT'])
def update_inquiry(inquiry_id):
    """
    Update client inquiry status and notes (for admin/agent use)
    """
    try:
        inquiry = ClientInquiry.query.get_or_404(inquiry_id)
        data = request.get_json()
        
        # Update allowed fields
        if 'status' in data:
            inquiry.status = data['status']
        if 'assigned_agent' in data:
            inquiry.assigned_agent = data['assigned_agent']
        if 'notes' in data:
            inquiry.notes = data['notes']
        
        inquiry.updated_at = datetime.utcnow()
        db.session.commit()
        
        logger.info(f'Client inquiry {inquiry_id} updated: status={inquiry.status}')
        
        return jsonify({
            'success': True,
            'message': 'Inquiry updated successfully',
            'inquiry': inquiry.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f'Error updating client inquiry {inquiry_id}: {str(e)}')
        return jsonify({'error': 'An error occurred while updating the inquiry'}), 500

@client_inquiry_bp.route('/api/client-inquiry/<int:inquiry_id>', methods=['DELETE'])
def delete_inquiry(inquiry_id):
    """
    Delete a client inquiry (for admin use)
    """
    try:
        inquiry = ClientInquiry.query.get_or_404(inquiry_id)
        db.session.delete(inquiry)
        db.session.commit()
        
        logger.info(f'Client inquiry {inquiry_id} deleted')
        
        return jsonify({
            'success': True,
            'message': 'Inquiry deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f'Error deleting client inquiry {inquiry_id}: {str(e)}')
        return jsonify({'error': 'An error occurred while deleting the inquiry'}), 500
