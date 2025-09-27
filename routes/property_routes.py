from flask import Blueprint, request, jsonify, current_app
from models.property import Property
from models.user import User
from models.rental_owner import RentalOwner, RentalOwnerManager
from config import db
from routes.auth_routes import token_required
from utils.image_upload import save_image, resize_image, delete_image
from utils.db_utils import handle_db_error
from utils.property_utils import safe_delete_property_related_records, check_property_deletion_constraints
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
        
        # Properties are now owned directly by users
        
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
        
        # Handle rental_owner_id and owner_id
        rental_owner_id = data.get('owner_id')  # Frontend sends rental owner ID as 'owner_id'
        owner_id = current_user.id  # Properties are always owned by the current user
        
        # Validate rental_owner_id if provided
        if rental_owner_id:
            rental_owner = RentalOwner.query.get(rental_owner_id)
            if not rental_owner:
                return jsonify({'error': 'Invalid rental owner ID'}), 400
            print(f"Property will be linked to rental owner: {rental_owner.company_name}")
        else:
            rental_owner_id = None
            print("Property will not be linked to any rental owner")
        
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
            owner_id=owner_id,
            rental_owner_id=rental_owner_id,
            image_url=image_url,
            case_number=data.get('case_number'),
            folio=data.get('folio')
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

@property_bp.route('/available-rental-owners', methods=['GET'])
@token_required
def get_available_rental_owners(current_user):
    """Get rental owners that the current user can add properties to"""
    try:
        rental_owners = db.session.query(RentalOwner).join(
            RentalOwnerManager, RentalOwner.id == RentalOwnerManager.rental_owner_id
        ).filter(
            RentalOwnerManager.user_id == current_user.id,
            RentalOwner.is_active == True
        ).all()
        
        return jsonify([{
            'id': ro.id,
            'company_name': ro.company_name,
            'business_type': ro.business_type,
            'city': ro.city,
            'state': ro.state
        } for ro in rental_owners]), 200
    except Exception as e:
        print(f"Error fetching available rental owners: {str(e)}")
        return jsonify({'error': str(e)}), 400

@property_bp.route('', methods=['GET'])
@property_bp.route('/', methods=['GET'])
@token_required
def get_properties(current_user):
    try:
        print("Fetching properties for user:", current_user.id)
        status = request.args.get('status')  # Add status filter
        print(f"Status filter: {status}")
        
        # Get properties owned by the current user
        properties = Property.query.filter(Property.owner_id == current_user.id).all()
        print(f"Found {len(properties)} properties")
        properties_data = []
        for prop in properties:
            # Check if property has active tenants to determine actual rental status
            from models.tenant import Tenant
            from datetime import date
            today = date.today()
            
            # Get active tenants (lease hasn't ended)
            active_tenants = Tenant.query.filter(
                Tenant.property_id == prop.id,
                Tenant.lease_end >= today
            ).count() if hasattr(Tenant, 'lease_end') else Tenant.query.filter_by(property_id=prop.id).count()
            
            # Determine actual rental status
            if active_tenants > 0:
                rental_status = 'rented'
            elif prop.status == 'maintenance':
                rental_status = 'maintenance'
            else:
                rental_status = 'available'
            
            # Apply server-side status filter if provided
            if status and rental_status != status:
                continue  # Skip this property if it doesn't match the filter
            
            # Get rental owner information using the direct relationship
            rental_owner_info = None
            if prop.rental_owner:
                # Use the direct rental owner relationship
                rental_owner_info = {
                   'id': prop.rental_owner.id,
                   'company_name': prop.rental_owner.company_name,
                   'business_type': prop.rental_owner.business_type or 'Property Owner',
                   'contact_email': prop.rental_owner.contact_email or prop.rental_owner.email,
                   'contact_phone': prop.rental_owner.contact_phone or prop.rental_owner.phone_number
                }
            elif prop.owner:
                # Fallback to user information if no rental owner linked
                rental_owner_info = {
                   'id': prop.owner.id,
                   'company_name': prop.owner.full_name or prop.owner.username,
                   'business_type': 'Property Owner',
                   'contact_email': prop.owner.email
                }
            
            properties_data.append({
                'id': prop.id,
                'title': prop.title,
                'case_number': prop.case_number,
                'folio': prop.folio,
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
                'status': rental_status,  # Use calculated rental status
                'original_status': prop.status,  # Keep original for reference
                'tenant_count': active_tenants,
                'image_url': prop.image_url,
                'created_at': prop.updated_at.isoformat() if prop.updated_at else None,  # Use updated_at as created_at
                'updated_at': prop.updated_at.isoformat() if prop.updated_at else None,
                'owner': {
                   'id': prop.owner.id,
                   'username': prop.owner.username,
                   'full_name': prop.owner.full_name,
                   'email': prop.owner.email
                } if prop.owner else None,
                'rental_owner': rental_owner_info
            })
        
        return jsonify(properties_data), 200
    except Exception as e:
        print("Error fetching properties:", str(e))
        return jsonify({'error': str(e)}), 400

@property_bp.route('/import', methods=['POST'])
@token_required
def import_properties(current_user):
    try:
        print("Property import attempt received")
        print("Current user:", current_user.username)
        
        if 'csv_file' not in request.files:
            return jsonify({'error': 'No CSV file provided'}), 400
        
        csv_file = request.files['csv_file']
        if csv_file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not csv_file.filename.endswith('.csv'):
            return jsonify({'error': 'File must be a CSV'}), 400
        
        # Read and parse CSV
        import csv
        import io
        
        # Read the CSV content
        csv_content = csv_file.read().decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        
        imported_count = 0
        errors = []
        
        for row_num, row in enumerate(csv_reader, start=2):  # Start at 2 because row 1 is header
            try:
                # Extract data from CSV row
                title = row.get('PROPERTY', '').strip() if row.get('PROPERTY') else ''
                location = row.get('LOCATION', '').strip() if row.get('LOCATION') else ''
                street_address = row.get('STREET_ADDRESS', '').strip() if row.get('STREET_ADDRESS') else ''
                street_address_2 = row.get('STREET_ADDRESS_2', '').strip() if row.get('STREET_ADDRESS_2') else ''
                apt_number = row.get('APT_NUMBER', '').strip() if row.get('APT_NUMBER') else ''
                zip_code = row.get('ZIP_CODE', '').strip() if row.get('ZIP_CODE') else ''
                description = row.get('DESCRIPTION', 'Default property description').strip() if row.get('DESCRIPTION') else 'Default property description'
                rent_amount = row.get('RENT_AMOUNT', '0').strip() if row.get('RENT_AMOUNT') else '0'
                status = row.get('STATUS', 'available').strip() if row.get('STATUS') else 'available'
                
                # Parse location (assuming format: "City, State")
                city = ''
                state = ''
                if location and ',' in location:
                   parts = location.split(',')
                   city = parts[0].strip()
                   state = parts[1].strip() if len(parts) > 1 else ''
                
                # Validate required fields
                if not title:
                   errors.append(f"Row {row_num}: Property title is required")
                   continue
                
                if not city:
                   errors.append(f"Row {row_num}: City is required")
                   continue
                
                if not state:
                   errors.append(f"Row {row_num}: State is required")
                   continue
                
                # Convert rent_amount to float
                try:
                   rent_amount_float = float(rent_amount) if rent_amount else 0.0
                except ValueError:
                   rent_amount_float = 0.0
                
                # Create property
                property = Property(
                   title=title,
                   street_address_1=street_address,
                   street_address_2=street_address_2,
                   apt_number=apt_number,
                   city=city,
                   state=state,
                   zip_code=zip_code,
                   description=description,
                   rent_amount=rent_amount_float,
                   status=status,
                   owner_id=current_user.id
                )
                
                db.session.add(property)
                imported_count += 1
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
                continue
        
        # Commit all properties
        if imported_count > 0:
            db.session.commit()
            print(f"Successfully imported {imported_count} properties")
        
        return jsonify({
            'success': True,
            'imported_count': imported_count,
            'errors': errors
        }), 200
        
    except Exception as e:
        print("Error importing properties:", str(e))
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@property_bp.route('/<int:property_id>', methods=['DELETE'])
@token_required
@handle_db_error
def delete_property(current_user, property_id):
    try:
        print(f"Delete property attempt - Property ID: {property_id}, User: {current_user.username}")
        
        # Find the property
        property = Property.query.get(property_id)
        
        if not property:
            return jsonify({'error': 'Property not found'}), 404
        
        # Check if user owns the property
        if property.owner_id != current_user.id:
            return jsonify({'error': 'Unauthorized to delete this property'}), 403
        
        # Check if property can be safely deleted
        can_delete, blocking_reasons = check_property_deletion_constraints(property_id)
        if not can_delete:
            error_message = f"Cannot delete property. Please resolve the following issues first: {', '.join(blocking_reasons)}"
            return jsonify({'error': error_message}), 400
        
        # Delete related records in the correct order to avoid foreign key constraint violations
        print(f"Deleting related records for property {property_id}")
        deleted_counts = safe_delete_property_related_records(property_id)
        
        if deleted_counts:
            print(f"Deleted related records: {deleted_counts}")
        else:
            print("No related records found to delete")
        
        # Now delete the property itself
        try:
            db.session.delete(property)
            db.session.commit()
            print(f"Property {property_id} deleted successfully by user {current_user.username}")
            return jsonify({'message': 'Property deleted successfully'}), 200
        except Exception as delete_error:
            print(f"Error during property deletion: {delete_error}")
            db.session.rollback()
            return jsonify({'error': f'Failed to delete property: {str(delete_error)}'}), 400
        
    except Exception as e:
        print(f"Error deleting property: {str(e)}")
        db.session.rollback()
        return jsonify({'error': f'Failed to delete property. Please try again.'}), 400

@property_bp.route('/<int:property_id>/can-delete', methods=['GET'])
@token_required
def can_delete_property(current_user, property_id):
    """Check if a property can be safely deleted"""
    try:
        # Find the property
        property = Property.query.get(property_id)
        
        if not property:
            return jsonify({'error': 'Property not found'}), 404
        
        # Check if user owns the property
        if property.owner_id != current_user.id:
            return jsonify({'error': 'Unauthorized to access this property'}), 403
        
        # Check deletion constraints
        can_delete, blocking_reasons = check_property_deletion_constraints(property_id)
        
        return jsonify({
            'can_delete': can_delete,
            'blocking_reasons': blocking_reasons,
            'property_id': property_id,
            'property_title': property.title
        }), 200
        
    except Exception as e:
        print(f"Error checking property deletion constraints: {str(e)}")
        return jsonify({'error': str(e)}), 400

@property_bp.route('/<int:property_id>', methods=['GET'])
def get_property(property_id):
    try:
        property = Property.query.get_or_404(property_id)
        
        # Get the latest listing for this property
        from models.listing import Listing
        listing = Listing.query.filter_by(property_id=property_id).order_by(Listing.listing_date.desc()).first()

        # Association assignment (if any)
        try:
            from models.association import AssociationPropertyAssignment, Association
            assignment = AssociationPropertyAssignment.query.filter_by(property_id=property_id).first()
            association_info = None
            if assignment:
                assoc = Association.query.get(assignment.association_id)
                association_info = {
                   'association': {
                       'id': assoc.id if assoc else assignment.association_id,
                       'name': assoc.name if assoc else None,
                   },
                   'hoa_fees': float(assignment.hoa_fees) if assignment.hoa_fees is not None else None,
                   'special_assessment': float(assignment.special_assessment) if assignment.special_assessment is not None else None,
                   'shipping_address': {
                       'street_1': assignment.ship_street_address_1,
                       'street_2': assignment.ship_street_address_2,
                       'city': assignment.ship_city,
                       'state': assignment.ship_state,
                       'zip': assignment.ship_zip_code,
                   }
                }
        except Exception:
            association_info = None

        # Financial information (if any)
        financial_info = None
        if property.financial_details:
            financial = property.financial_details
            financial_info = {
                'total_value': float(financial.total_value) if financial.total_value else None,
                'purchase_price': float(financial.purchase_price) if financial.purchase_price else None,
                'purchase_date': financial.purchase_date.isoformat() if financial.purchase_date else None,
                'purchase_price_per_sqft': float(financial.purchase_price_per_sqft) if financial.purchase_price_per_sqft else None,
                'mortgage_amount': float(financial.mortgage_amount) if financial.mortgage_amount else None,
                'down_payment': float(financial.down_payment) if financial.down_payment else None,
                'current_apr': float(financial.current_apr) if financial.current_apr else None,
                'loan_term_years': financial.loan_term_years,
                'monthly_loan_payment': float(financial.monthly_loan_payment) if financial.monthly_loan_payment else None,
                'loan_payment_date': financial.loan_payment_date,
                'property_tax_annual': float(financial.property_tax_annual) if financial.property_tax_annual else None,
                'insurance_annual': float(financial.insurance_annual) if financial.insurance_annual else None,
                'hoa_fees_monthly': float(financial.hoa_fees_monthly) if financial.hoa_fees_monthly else None,
                'maintenance_reserve_monthly': float(financial.maintenance_reserve_monthly) if financial.maintenance_reserve_monthly else None,
                'total_monthly_expenses': float(financial.calculate_total_monthly_expenses()) if financial else None,
                'monthly_cash_flow': float(financial.calculate_cash_flow(property.rent_amount)) if financial and property.rent_amount else None,
                'roi_percentage': float(financial.calculate_roi(property.rent_amount)) if financial and property.rent_amount else None
            }
         
        return jsonify({
            'id': property.id,
            'title': property.title,
            'case_number': property.case_number,
            'folio': property.folio,
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
             'created_at': property.updated_at.isoformat() if property.updated_at else None,  # Use updated_at as created_at
             'updated_at': property.updated_at.isoformat() if property.updated_at else None,
             'association_assignment': association_info,
             'financial_details': financial_info,
            'owner': {
                'id': property.owner.id,
                'username': property.owner.username,
                'full_name': property.owner.full_name,
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

@property_bp.route('/<int:property_id>', methods=['PUT'])
@token_required
def update_property(current_user, property_id):
    try:
        property = Property.query.get_or_404(property_id)
        
        # Check if user owns the property
        if property.owner_id != current_user.id:
            return jsonify({'error': 'Unauthorized to update this property'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update property fields
        if 'title' in data:
            property.title = data['title']
        if 'description' in data:
            property.description = data['description']
        if 'rent_amount' in data:
            old_rent = property.rent_amount
            new_rent = data['rent_amount']
            property.rent_amount = new_rent
            
            # Update all tenant rent amounts for this property to keep them in sync
            if old_rent != new_rent:
                from models.tenant import Tenant
                tenants = Tenant.query.filter_by(property_id=property_id).all()
                for tenant in tenants:
                    tenant.rent_amount = new_rent
                print(f"Updated rent amount for {len(tenants)} tenants from ${old_rent} to ${new_rent}")
        if 'status' in data:
            property.status = data['status']
        if 'case_number' in data:
            property.case_number = data['case_number']
        if 'folio' in data:
            property.folio = data['folio']
        if 'street_address_1' in data:
            property.street_address_1 = data['street_address_1']
        if 'street_address_2' in data:
            property.street_address_2 = data['street_address_2']
        if 'apt_number' in data:
            property.apt_number = data['apt_number']
        if 'city' in data:
            property.city = data['city']
        if 'state' in data:
            property.state = data['state']
        if 'zip_code' in data:
            property.zip_code = data['zip_code']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Property updated successfully',
            'property': {
                'id': property.id,
                'title': property.title,
                'case_number': property.case_number,
                'folio': property.folio,
                'description': property.description,
                'rent_amount': float(property.rent_amount) if property.rent_amount else None,
                'status': property.status
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print("Error updating property:", str(e))
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
                       'created_at': prop.updated_at.isoformat() if prop.updated_at else None,  # Use updated_at as created_at
                       'updated_at': prop.updated_at.isoformat() if prop.updated_at else None,
                       'owner': {
                           'id': prop.owner.id,
                           'username': prop.owner.username,
                           'full_name': prop.owner.full_name,
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