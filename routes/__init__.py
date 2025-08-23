from flask import jsonify
from config import app
from routes.auth_routes import auth_bp
from routes.property_routes import property_bp
from routes.tenant_routes import tenant_bp
from routes.maintenance_routes import maintenance_bp
from routes.listing_routes import listing_bp
from routes.association_routes import association_bp
from routes.financial_routes import financial_bp
from routes.vendor_routes import vendor_bp

def init_routes(app):
    print("Initializing routes...")
    
    # Root route
    @app.route('/')
    def index():
        return jsonify({
            'message': 'Property Management API',
            'version': '1.0',
            'available_endpoints': {
                'properties': '/api/properties',
                'tenants': '/api/tenants',
                'maintenance': '/api/maintenance',
                'listings': '/api/listings',
                'associations': '/api/associations'
            }
        })
    
    # Register blueprints
    print("Registering blueprints...")
    
    # Auth routes
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    print("Auth routes registered")
    
    # Property routes
    app.register_blueprint(property_bp, url_prefix='/api/properties')
    print("Property routes registered")
    
    # Tenant routes
    app.register_blueprint(tenant_bp, url_prefix='/api/tenants')
    print("Tenant routes registered")
    
    # Maintenance routes
    app.register_blueprint(maintenance_bp, url_prefix='/api/maintenance')
    print("Maintenance routes registered")
    
    # Listing routes
    app.register_blueprint(listing_bp, url_prefix='/api/listings')
    print("Listing routes registered")
    
    # Association routes
    app.register_blueprint(association_bp, url_prefix='/api/associations')
    print("Association routes registered")
    
    # Financial routes
    app.register_blueprint(financial_bp, url_prefix='/api/financial')
    print("Financial routes registered")
    
    # Vendor routes
    app.register_blueprint(vendor_bp, url_prefix='/api/vendors')
    print("Vendor routes registered")
    
    print("All routes registered successfully")
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found'}), 404

    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Bad request'}), 400

    @app.errorhandler(500)
    def server_error(error):
        return jsonify({'error': 'Internal server error'}), 500