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

# Import and run the main application
from core.app import app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
