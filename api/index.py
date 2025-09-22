"""
Vercel Serverless Function Entry Point
"""

import os
import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Set environment variables for Vercel
os.environ.setdefault('FLASK_ENV', 'production')

# Import the Flask app from the main application
try:
    from app import app
except Exception as e:
    print(f"Error importing app: {e}")
    # Fallback minimal app
    from flask import Flask, jsonify
    app = Flask(__name__)
    
    @app.route('/')
    def health():
        return jsonify({'status': 'error', 'message': str(e)})

# Export for Vercel
handler = app
