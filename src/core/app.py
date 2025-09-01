import os
import sys
import datetime
import psutil
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_migrate import Migrate

# Add src to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Initialize Flask app
app = Flask(__name__)

# Neon database connection string
NEON_CONNECTION_STRING = os.environ.get('NEON_DATABASE_URL') or "postgresql://neondb_owner:npg_V8OySJF5njdT@ep-summer-sky-adwixnct-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Configure app
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'ownexa-production-secret-key-2024')
app.config['SQLALCHEMY_DATABASE_URI'] = NEON_CONNECTION_STRING
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '..', 'uploads')

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'properties'), exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'reports'), exist_ok=True)

# Initialize extensions
from shared.models import db, init_models
db.init_app(app)
migrate = Migrate(app, db)

# Initialize models
with app.app_context():
    init_models()

# Enable CORS with security
CORS(app, 
     origins=[
         'http://localhost:3000',  # Local development
         'http://localhost:5000',  # Local production build
         'https://ownexa-test.vercel.app',  # Production domain
         'https://ownexa.com'  # Production domain
     ],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
     expose_headers=['Content-Range', 'X-Total-Count'],
     supports_credentials=True,
     max_age=600  # Cache preflight requests for 10 minutes
)

# Add security headers
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

# Import and initialize all routes
from api.v1 import init_routes
init_routes(app)

# Serve uploaded files
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Health check routes
@app.route('/health')
def health():
    """Basic health check endpoint"""
    try:
        # Test database connection
        db.session.execute('SELECT 1')
        db_status = 'connected'
    except Exception as e:
        db_status = f'error: {str(e)}'

    # Check upload directory
    upload_dir_exists = os.path.exists(app.config['UPLOAD_FOLDER'])
    upload_dir_writable = os.access(app.config['UPLOAD_FOLDER'], os.W_OK) if upload_dir_exists else False

    return jsonify({
        'status': 'healthy',
        'message': 'Ownexa Real Estate Management API',
        'version': '1.0.0',
        'database': db_status,
        'upload_directory': {
            'exists': upload_dir_exists,
            'writable': upload_dir_writable,
            'path': app.config['UPLOAD_FOLDER']
        },
        'timestamp': datetime.datetime.utcnow().isoformat()
    })

@app.route('/api/connection/test', methods=['GET', 'OPTIONS'])
def test_connection():
    """Detailed connection test endpoint"""
    try:
        # Test database connection
        db.session.execute('SELECT 1')
        db_connected = True
        db_error = None
    except Exception as e:
        db_connected = False
        db_error = str(e)

    # Check system resources
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')

    return jsonify({
        'status': 'ok',
        'api': {
            'status': 'online',
            'version': '1.0.0',
            'environment': os.environ.get('FLASK_ENV', 'production')
        },
        'database': {
            'connected': db_connected,
            'error': db_error,
            'type': 'postgresql'
        },
        'system': {
            'memory': {
                'total': memory.total,
                'available': memory.available,
                'percent': memory.percent
            },
            'disk': {
                'total': disk.total,
                'free': disk.free,
                'percent': disk.percent
            }
        },
        'timestamp': datetime.datetime.utcnow().isoformat()
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)