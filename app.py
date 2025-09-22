#!/usr/bin/env python3
"""
Ownexa Property Management System
Main Application Entry Point

This file serves as the main entry point for the restructured application.
The actual application logic is now organized in the src/ directory.
"""

import os
import sys

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

# Serve uploaded files
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# Initialize routes
init_routes(app)
>>>>>>> c4000e91ef9e66dfad67d379435355dc7c1a0112

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
