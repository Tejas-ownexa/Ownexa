"""
<<<<<<< HEAD
Simple Vercel Serverless Function
"""

from flask import Flask, jsonify
from flask_cors import CORS
import os

# Create Flask app
app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return jsonify({
        'message': 'Ownexa API is running!',
        'status': 'healthy',
        'version': '1.0.0'
    })

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'database': 'connected' if os.environ.get('NEON_DATABASE_URL') else 'not configured'
    })

@app.route('/api/test')
def test():
    return jsonify({
        'message': 'API is working!',
        'timestamp': '2024-01-01T00:00:00Z'
    })

# Export for Vercel
handler = app
=======
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
>>>>>>> 9010d28ffdbe7d520a9135b06ed90726c286e44f
