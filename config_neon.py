import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Initialize Flask app
app = Flask(__name__)

# Neon PostgreSQL Database Configuration
NEON_CONNECTION_STRING = "postgresql://neondb_owner:npg_GrOEbhSsxK89@ep-green-smoke-ae7q078i-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Database configuration - Using Neon PostgreSQL
app.config['SQLALCHEMY_DATABASE_URI'] = NEON_CONNECTION_STRING
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# File upload configuration
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize SQLAlchemy
db = SQLAlchemy(app)

# Initialize Flask-Migrate
migrate = Migrate(app, db)

# CORS configuration
app.config['CORS_HEADERS'] = 'Content-Type'

# Environment-specific settings
if os.environ.get('FLASK_ENV') == 'production':
    app.config['DEBUG'] = False
else:
    app.config['DEBUG'] = True
