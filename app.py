from config import app, db
from flask_cors import CORS
from flask import send_from_directory
from models import *
from routes import init_routes
import os

# Enable CORS
CORS(app)

# Disable automatic trailing slash redirects to prevent CORS issues
app.url_map.strict_slashes = False

# Serve uploaded files
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Initialize routes
init_routes(app)

if __name__ == '__main__':
    app.run(debug=True, port=5002)