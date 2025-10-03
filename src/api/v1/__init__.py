from flask import jsonify

# Import all route blueprints
from modules.auth.routes.auth_routes import auth_bp
from modules.properties.routes.property_routes import property_bp
from modules.properties.routes.listing_routes import listing_bp
from modules.properties.routes.association_routes import association_bp
from modules.tenants.routes.tenant_routes import tenant_bp
from modules.tenants.routes.rental_routes import rental_bp
from modules.tenants.routes.rental_owner_routes import rental_owner_bp
from modules.financial.routes.financial_routes import financial_bp
from modules.financial.routes.accountability_routes import accountability_bp
from modules.maintenance.routes.maintenance_routes import maintenance_bp
from modules.maintenance.routes.vendor_routes import vendor_bp
from modules.reporting.routes.reporting_routes import reporting_bp
from modules.data_management.routes.pipeline_routes import pipeline_bp
from modules.ai_services.routes.chatbot_routes import chatbot_bp
from modules.ai_services.routes.admin_bot_routes import admin_bot_bp

# Import additional blueprints from old routes directory
from routes.leasing_routes import leasing_bp
from routes.dashboard_routes import dashboard_bp
from routes.ai_lease_routes import ai_lease_bp
<<<<<<< HEAD:src/api/v1/__init__.py
from routes.work_order_routes import work_order_bp
=======
from routes.warehouse_routes import warehouse_bp
>>>>>>> 9010d28ffdbe7d520a9135b06ed90726c286e44f:routes/__init__.py

def init_routes(app):
    """Initialize all routes"""
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
                'associations': '/api/associations',
                'rentals': '/api/rentals',
                'accountability': '/api/accountability',
                'admin-bot': '/api/admin-bot',
                'vendors': '/api/vendors',
                'work_orders': '/api/work-orders',
                'leasing': '/api/leasing',
                'rental_owners': '/api/rental-owners',
                'dashboard': '/api/dashboard',
                'reports': '/api/reports',
<<<<<<< HEAD:src/api/v1/__init__.py
                'pipeline': '/api/pipeline',
                'ai_lease': '/api/ai-lease'
=======
                'ai_lease': '/api/ai-lease',
                'warehouses': '/api/warehouses'
>>>>>>> 9010d28ffdbe7d520a9135b06ed90726c286e44f:routes/__init__.py
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
    
    # Work Order routes
    app.register_blueprint(work_order_bp, url_prefix='/api/work-orders')
    print("Work Order routes registered")
    
    # Chatbot routes
    app.register_blueprint(chatbot_bp, url_prefix='/api/chatbot')
    print("Chatbot routes registered")
    
    # Admin bot routes
    app.register_blueprint(admin_bot_bp, url_prefix='/api/admin-bot')
    print("Admin bot routes registered")
    
    # Rental routes
    app.register_blueprint(rental_bp, url_prefix='/api/rentals')
    print("Rental routes registered")
    
    # Rental owner routes
    app.register_blueprint(rental_owner_bp, url_prefix='/api/rental-owners')
    print("Rental owner routes registered")
    
    # Reporting routes
    app.register_blueprint(reporting_bp, url_prefix='/api/reports')
    print("Reporting routes registered")
    
    # Accountability routes
    app.register_blueprint(accountability_bp, url_prefix='/api/accountability')
    print("Accountability routes registered")
    
    # Pipeline routes
    app.register_blueprint(pipeline_bp, url_prefix='/api/pipeline')
    print("Pipeline routes registered")
    
    # Leasing routes
    app.register_blueprint(leasing_bp, url_prefix='/api/leasing')
    print("Leasing routes registered")
    
    # Dashboard routes
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    print("Dashboard routes registered")
    
    # AI Lease routes
    app.register_blueprint(ai_lease_bp, url_prefix='/api/ai-lease')
    print("AI Lease routes registered")
    
    # Warehouse routes
    app.register_blueprint(warehouse_bp, url_prefix='/api/warehouses')
    print("Warehouse routes registered")
    
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
