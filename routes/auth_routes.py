from flask import Blueprint, request, jsonify, url_for, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User
import jwt
from datetime import datetime, timedelta
from functools import wraps

auth_bp = Blueprint('auth', __name__)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
        except:
            return jsonify({'message': 'Token is invalid'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        print("Registration attempt received")
        
        # Check content type
        content_type = request.headers.get('Content-Type', '')
        print("Content-Type:", content_type)
        
        if 'application/json' in content_type:
            data = request.get_json()
            print("Registration data received:", data)
        else:
            # Handle form data
            data = request.form.to_dict()
            print("Form data received:", data)
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check if username or email already exists
        existing_user = User.query.filter(
            (User.username == data['username']) | (User.email == data['email'])
        ).first()
        
        if existing_user:
            return jsonify({'error': 'Username or email already exists'}), 400
        
        # Hash password
        hashed_password = generate_password_hash(data['password'])
        
        # Create user without email verification
        user = User(
            username=data['username'],
            email=data['email'],
            password=hashed_password,
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone_number=data.get('phone_number', ''),
            street_address_1=data.get('street_address_1', ''),
            street_address_2=data.get('street_address_2', ''),
            apt_number=data.get('apt_number', ''),
            city=data.get('city', ''),
            state=data.get('state', ''),
            zip_code=data.get('zip_code', ''),
            role=data['role'],
            email_verified=True,  # Always verified
            is_active=True  # Always active
        )
        
        print("Attempting to save user to database")
        db.session.add(user)
        db.session.commit()
        print("User successfully saved to database")
        
        # If user is a vendor, create vendor profile
        if data['role'] == 'VENDOR' and data.get('vendor_type'):
            from models.vendor import Vendor
            vendor = Vendor(
                user_id=user.id,
                vendor_type=data['vendor_type'],
                business_name=data.get('business_name', f"{data['first_name']} {data['last_name']} Services"),
                phone_number=data.get('phone_number', ''),
                email=data['email'],
                address=f"{data.get('street_address_1', '')}, {data.get('city', '')}, {data.get('state', '')} {data.get('zip_code', '')}",
                is_verified=False,
                is_active=True
            )
            db.session.add(vendor)
            db.session.commit()
            print("Vendor profile created successfully")
        
        return jsonify({
            'message': 'User registered successfully! You can now log in.',
            'user_id': user.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error during registration: {str(e)}")
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/token', methods=['POST'])
def login():
    try:
        print("Login attempt received")
        print("Content-Type:", request.headers.get('Content-Type'))
        print("Form data:", request.form.to_dict() if request.form else "No form data")
        print("JSON data:", request.get_json() if request.is_json else "No JSON data")
        
        # Get credentials from form data
        username = request.form.get('username')
        password = request.form.get('password')
        
        print("Initial credentials from form:", username, "password:", "***" if password else None)
        
        # If not in form data, try JSON
        if not username or not password:
            data = request.get_json()
            if data:
                username = data.get('username')
                password = data.get('password')
                print("Credentials from JSON:", username, "password:", "***" if password else None)
        
        if not username or not password:
            return jsonify({
                'detail': [{'msg': 'Missing username or password'}]
            }), 400
            
        # Try to find user by username or email
        print("Looking for user with username/email:", username)
        user = User.query.filter(
            (User.username == username) | (User.email == username)
        ).first()
        
        if not user:
            print("No user found")
            return jsonify({
                'detail': [{'msg': 'Invalid username or email'}]
            }), 401
        
        print("User found:", user.username, user.email)
        
        # Check if user is active
        if not user.is_active:
            return jsonify({
                'detail': [{'msg': 'Account is deactivated. Please contact support.'}]
            }), 401
            
        if not check_password_hash(user.password, password):
            return jsonify({
                'detail': [{'msg': 'Invalid password'}]
            }), 401
            
        # Generate access token
        access_token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, current_app.config['SECRET_KEY'], algorithm="HS256")
        
        # Return token and user data
        return jsonify({
            'access_token': access_token,
            'token_type': 'bearer',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'email_verified': user.email_verified
            }
        })
    except Exception as e:
        print(f"Login error: {str(e)}")  # For debugging
        return jsonify({
            'detail': [{'msg': 'An error occurred during login'}]
        }), 500

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify({
        'id': current_user.id,
        'username': current_user.username,
        'email': current_user.email,
        'first_name': current_user.first_name,
        'last_name': current_user.last_name,
        'phone_number': current_user.phone_number,
        'role': current_user.role,
        'street_address_1': current_user.street_address_1,
        'street_address_2': current_user.street_address_2,
        'apt_number': current_user.apt_number,
        'city': current_user.city,
        'state': current_user.state,
        'zip_code': current_user.zip_code,
        'is_active': current_user.is_active,
        'email_verified': current_user.email_verified,
        'created_at': current_user.created_at.isoformat() if current_user.created_at else None,
        'updated_at': current_user.updated_at.isoformat() if current_user.updated_at else None
    })