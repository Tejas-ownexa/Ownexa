"""
Vercel Serverless Function Entry Point
This file serves as the entry point for Vercel serverless functions.
"""

import os
import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Import the Flask app from the main application
from src.core.app import app

# Export the app for Vercel
handler = app
