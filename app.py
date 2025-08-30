from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os

# Initialize Flask app
app = Flask(__name__)

# Neon database connection string
NEON_CONNECTION_STRING = os.environ.get('NEON_DATABASE_URL') or "postgresql://neondb_owner:npg_V8OySJF5njdT@ep-summer-sky-adwixnct-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Configure app
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'ownexa-production-secret-key-2024')
app.config['SQLALCHEMY_DATABASE_URI'] = NEON_CONNECTION_STRING
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'properties'), exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'reports'), exist_ok=True)

# Initialize extensions
from models import db
db.init_app(app)
migrate = Migrate(app, db)

# Enable CORS with security
CORS(app, origins=['*'], supports_credentials=True)

# Add security headers
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

# Import models and routes after db initialization
from models.user import User
from models.property import Property
from models.tenant import Tenant
from models.maintenance import MaintenanceRequest
from models.vendor import Vendor
from models.financial import PropertyFinancial, FinancialTransaction

# Import routes
from routes.auth_routes import auth_bp
from routes.property_routes import property_bp
from routes.tenant_routes import tenant_bp
from routes.maintenance_routes import maintenance_bp
from routes.vendor_routes import vendor_bp
from routes.financial_routes import financial_bp

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(property_bp, url_prefix='/api/properties')
app.register_blueprint(tenant_bp, url_prefix='/api/tenants')
app.register_blueprint(maintenance_bp, url_prefix='/api/maintenance')
app.register_blueprint(vendor_bp, url_prefix='/api/vendors')
app.register_blueprint(financial_bp, url_prefix='/api/financial')

# Serve uploaded files
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Health check route
@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'message': 'Ownexa Real Estate Management API',
        'database': 'connected'
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)