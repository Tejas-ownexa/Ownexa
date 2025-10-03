<<<<<<< HEAD
#!/usr/bin/env python3
"""
Ownexa Property Management System
Main Application Entry Point

This file serves as the main entry point for the restructured application.
The actual application logic is now organized in the src/ directory.
"""

import os
import sys
=======
from config import app, db
from flask_cors import CORS
from flask import send_from_directory, jsonify
from models import *
from routes import init_routes
from utils.db_utils import reset_db_connection
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, OperationalError
import os
import logging
>>>>>>> 9010d28ffdbe7d520a9135b06ed90726c286e44f

# Add src to Python path to allow imports from the new structure
current_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.join(current_dir, 'src')
sys.path.insert(0, src_dir)

<<<<<<< HEAD
# Import and run the main application
from core.app import app
=======
# Disable automatic trailing slash redirects to prevent CORS issues
app.url_map.strict_slashes = False

# Global error handlers for database issues
@app.errorhandler(SQLAlchemyError)
def handle_sqlalchemy_error(error):
    """Handle SQLAlchemy database errors"""
    logging.error(f"SQLAlchemy error: {str(error)}")
    try:
        db.session.rollback()
        reset_db_connection()
    except Exception as e:
        logging.error(f"Error during cleanup: {str(e)}")
    
    return jsonify({
        'error': 'Database error occurred',
        'message': 'Please try again. If the problem persists, contact support.',
        'type': 'database_error'
    }), 500

@app.errorhandler(IntegrityError)
def handle_integrity_error(error):
    """Handle database integrity errors"""
    logging.error(f"Integrity error: {str(error)}")
    try:
        db.session.rollback()
    except Exception as e:
        logging.error(f"Error during rollback: {str(e)}")
    
    return jsonify({
        'error': 'Data integrity error',
        'message': 'The operation could not be completed due to data constraints.',
        'type': 'integrity_error'
    }), 400

@app.errorhandler(OperationalError)
def handle_operational_error(error):
    """Handle database operational errors"""
    logging.error(f"Operational error: {str(error)}")
    try:
        db.session.rollback()
        reset_db_connection()
    except Exception as e:
        logging.error(f"Error during cleanup: {str(e)}")
    
    return jsonify({
        'error': 'Database connection error',
        'message': 'Unable to connect to database. Please try again.',
        'type': 'connection_error'
    }), 500

# Database health check and reset endpoint
@app.route('/api/db/reset', methods=['POST'])
def reset_database_connection():
    """Reset database connection to clear failed transactions"""
    try:
        reset_db_connection()
        return jsonify({
            'message': 'Database connection reset successfully',
            'status': 'success'
        }), 200
    except Exception as e:
        logging.error(f"Error resetting database connection: {str(e)}")
        return jsonify({
            'error': 'Failed to reset database connection',
            'message': str(e)
        }), 500

@app.route('/api/db/health', methods=['GET'])
def database_health_check():
    """Check database connection health"""
    try:
        # Try a simple query to test the connection
        from sqlalchemy import text
        db.session.execute(text('SELECT 1'))
        return jsonify({
            'status': 'healthy',
            'message': 'Database connection is working'
        }), 200
    except Exception as e:
        logging.error(f"Database health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

# Serve uploaded files
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# Initialize routes
init_routes(app)
>>>>>>> 9010d28ffdbe7d520a9135b06ed90726c286e44f

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
