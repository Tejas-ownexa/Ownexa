"""
Minimal Vercel Serverless Function
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
