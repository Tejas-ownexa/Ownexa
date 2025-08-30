from flask import Blueprint, request, jsonify, current_app
from models.property import Property
from models.user import User
from config import db
from routes.auth_routes import token_required
from utils.image_upload import save_image, resize_image, delete_image
import os

property_bp = Blueprint('properties', __name__)

@property_bp.route('/add', methods=['POST'])
@token_required
def create_property(current_user):
    try:
        print("Property creation attempt received")
        print("Current user:", current_user.username)
        
        # Check if request has form data (for file upload)
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form.to_dict()
            image_file = request.files.get('image')
        else:
            data = request.get_json()
            image_file = None
        
        print("Property data received:", data)
        
        if not data:
            print("No data provided in request")
            return jsonify({'error': 'No data provided'}), 400

        required_fields = ['title', 'rent_amount', 'street_address_1', 'city', 'state', 'zip_code', 'description']
        for field in required_fields:
            if field not in data:
                print(f"Missing required field: {field}")
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Handle image upload
        image_url = None
        if image_file:
            print("Processing image upload")
            image_url = save_image(image_file, 'properties')
            if image_url:
                # Resize the uploaded image
                full_path = os.path.join(current_app.config['UPLOAD_FOLDER'], image_url)
                resize_image(full_path)
                print(f"Image saved: {image_url}")
            else:
                print("Failed to save image")
        
        property = Property(
            title=data['title'],
            street_address_1=data['street_address_1'],
            street_address_2=data.get('street_address_2'),
            apt_number=data.get('apt_number'),
            city=data['city'],
            state=data['state'],
            zip_code=data['zip_code'],
            description=data['description'],
            rent_amount=data['rent_amount'],
            status=data.get('status', 'available'),
            owner_id=current_user.id,  # Use the current user's ID as the owner
            image_url=image_url
        )
        
        print("Attempting to save property to database")
        db.session.add(property)
        db.session.commit()
        print("Property successfully saved to database")
        
        return jsonify({
            'message': 'Property created successfully',
            'property_id': property.id,
            'image_url': image_url
        }), 201
    except Exception as e:
        print("Error creating property:", str(e))
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@property_bp.route('', methods=['GET'])
@property_bp.route('/', methods=['GET'])
def get_properties():
    try:
        print("Fetching properties")
        owner_id = request.args.get('owner_id')
        status = request.args.get('status')  # Add status filter
        print(f"Owner ID filter: {owner_id}, Status filter: {status}")
        
        query = Property.query
        if owner_id:
            query = query.filter_by(owner_id=owner_id)
        if status:
            query = query.filter_by(status=status)
            
        properties = query.all()
        print(f"Found {len(properties)} properties")
        return jsonify([{
            'id': prop.id,
            'title': prop.title,
            'address': {
                'street_1': prop.street_address_1,
                'street_2': prop.street_address_2,
                'apt': prop.apt_number,
                'city': prop.city,
                'state': prop.state,
                'zip': prop.zip_code
            },
            'description': prop.description,
            'rent_amount': float(prop.rent_amount) if prop.rent_amount else None,
            'status': prop.status,
            'image_url': prop.image_url,
            'owner': {
                'id': prop.owner.id,
                'username': prop.owner.username,
                'full_name': f"{prop.owner.first_name} {prop.owner.last_name}",
                'email': prop.owner.email
            } if prop.owner else None
        } for prop in properties]), 200
    except Exception as e:
        print("Error fetching properties:", str(e))
        return jsonify({'error': str(e)}), 400

@property_bp.route('/<int:property_id>', methods=['GET'])
def get_property(property_id):
    try:
        property = Property.query.get_or_404(property_id)
        
        # Get the latest listing for this property
        from models.listing import Listing
        listing = Listing.query.filter_by(property_id=property_id).order_by(Listing.listing_date.desc()).first()
        
        return jsonify({
            'id': property.id,
            'title': property.title,
            'address': {
                'street_1': property.street_address_1,
                'street_2': property.street_address_2,
                'apt': property.apt_number,
                'city': property.city,
                'state': property.state,
                'zip': property.zip_code
            },
            'description': property.description,
            'rent_amount': float(property.rent_amount) if property.rent_amount else None,
            'status': property.status,
            'image_url': property.image_url,
            'created_at': property.created_at.isoformat() if property.created_at else None,
            'updated_at': property.updated_at.isoformat() if property.updated_at else None,
            'owner': {
                'id': property.owner.id,
                'username': property.owner.username,
                'full_name': f"{property.owner.first_name} {property.owner.last_name}",
                'email': property.owner.email
            } if property.owner else None,
            'listing': {
                'id': listing.id,
                'listing_date': listing.listing_date.isoformat() if listing and listing.listing_date else None,
                'status': listing.status if listing else None,
                'rent_price': float(listing.rent_price) if listing and listing.rent_price else None,
                'notes': listing.notes if listing else None
            } if listing else None
        }), 200
    except Exception as e:
        print("Error fetching property:", str(e))
        return jsonify({'error': str(e)}), 400

# Add a test route to verify the blueprint is working
@property_bp.route('/user/favorites', methods=['GET'])
@token_required
def get_user_favorites(current_user):
    try:
        # Get properties that the user has favorited
        from models.association import PropertyFavorite
        favorites = PropertyFavorite.query.filter_by(user_id=current_user.id).all()
        
        favorite_properties = []
        for favorite in favorites:
            prop = favorite.property
            if prop:
                favorite_properties.append({
                    'property': {
                        'id': prop.id,
                        'title': prop.title,
                        'address': {
                            'street_1': prop.street_address_1,
                            'street_2': prop.street_address_2,
                            'apt': prop.apt_number,
                            'city': prop.city,
                            'state': prop.state,
                            'zip': prop.zip_code
                        },
                        'description': prop.description,
                        'rent_amount': float(prop.rent_amount) if prop.rent_amount else None,
                        'status': prop.status,
                        'image_url': prop.image_url,
                        'owner': {
                            'id': prop.owner.id,
                            'username': prop.owner.username,
                            'full_name': f"{prop.owner.first_name} {prop.owner.last_name}",
                            'email': prop.owner.email
                        } if prop.owner else None
                    }
                })
        
        return jsonify(favorite_properties), 200
    except Exception as e:
        print("Error fetching user favorites:", str(e))
        return jsonify({'error': str(e)}), 400

@property_bp.route('/<int:property_id>/favorite', methods=['POST'])
@token_required
def add_to_favorites(current_user, property_id):
    try:
        # Check if property exists
        property = Property.query.get_or_404(property_id)
        
        # Check if already favorited
        from models.association import PropertyFavorite
        existing_favorite = PropertyFavorite.query.filter_by(
            user_id=current_user.id,
            property_id=property_id
        ).first()
        
        if existing_favorite:
            return jsonify({'message': 'Property is already in favorites'}), 400
        
        # Add to favorites
        favorite = PropertyFavorite(
            user_id=current_user.id,
            property_id=property_id
        )
        db.session.add(favorite)
        db.session.commit()
        
        return jsonify({'message': 'Property added to favorites successfully'}), 201
    except Exception as e:
        db.session.rollback()
        print("Error adding property to favorites:", str(e))
        return jsonify({'error': str(e)}), 400

@property_bp.route('/<int:property_id>/favorite', methods=['DELETE'])
@token_required
def remove_from_favorites(current_user, property_id):
    try:
        # Find and remove the favorite
        from models.association import PropertyFavorite
        favorite = PropertyFavorite.query.filter_by(
            user_id=current_user.id,
            property_id=property_id
        ).first()
        
        if not favorite:
            return jsonify({'message': 'Property is not in favorites'}), 404
        
        db.session.delete(favorite)
        db.session.commit()
        
        return jsonify({'message': 'Property removed from favorites successfully'}), 200
    except Exception as e:
        db.session.rollback()
        print("Error removing property from favorites:", str(e))
        return jsonify({'error': str(e)}), 400

@property_bp.route('/<int:property_id>/favorite/check', methods=['GET'])
@token_required
def check_favorite_status(current_user, property_id):
    try:
        from models.association import PropertyFavorite
        favorite = PropertyFavorite.query.filter_by(
            user_id=current_user.id,
            property_id=property_id
        ).first()
        
        return jsonify({'is_favorite': favorite is not None}), 200
    except Exception as e:
        print("Error checking favorite status:", str(e))
        return jsonify({'error': str(e)}), 400

@property_bp.route('/adjust-rents', methods=['POST'])
@token_required
def adjust_property_rents(current_user):
    """Adjust all property rents to be $500 higher than monthly expenses"""
    try:
        from models.financial import PropertyFinancial
        from models.tenant import Tenant
        
        # Get all properties owned by the user
        properties = Property.query.filter_by(owner_id=current_user.id).all()
        updated_properties = []
        
        for property in properties:
            # Get financial details for the property
            financial = PropertyFinancial.query.filter_by(property_id=property.id).first()
            
            if financial:
                # Calculate total monthly expenses
                total_monthly_expenses = financial.calculate_total_monthly_expenses()
                
                # Set rent to be $500 higher than expenses
                new_rent = total_monthly_expenses + 500
                
                # Update the property rent
                property.rent_amount = new_rent
                
                # Update all tenants' rent amounts for this property
                tenants = Tenant.query.filter_by(property_id=property.id).all()
                for tenant in tenants:
                    tenant.rent_amount = new_rent
                
                updated_properties.append({
                    'property_id': property.id,
                    'property_title': property.title,
                    'old_rent': float(property.rent_amount),
                    'new_rent': float(new_rent),
                    'monthly_expenses': float(total_monthly_expenses),
                    'cash_flow': float(new_rent - total_monthly_expenses),
                    'tenants_updated': len(tenants)
                })
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully updated rent for {len(updated_properties)} properties',
            'updated_properties': updated_properties
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error adjusting property rents: {str(e)}")
        return jsonify({'error': str(e)}), 400