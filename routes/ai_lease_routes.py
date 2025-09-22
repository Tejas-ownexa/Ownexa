from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from pypdf import PdfReader
from routes.auth_routes import token_required
from utils.ai_lease_generator import fill_pdf_form
from models import db
import os
import datetime

ai_lease_bp = Blueprint('ai_lease', __name__)

# Get the upload directories
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
TEMPLATES_DIR = os.path.join(UPLOADS_DIR, 'templates')
GENERATED_DIR = os.path.join(UPLOADS_DIR, 'generated')

# Ensure directories exist
os.makedirs(TEMPLATES_DIR, exist_ok=True)
os.makedirs(GENERATED_DIR, exist_ok=True)

@ai_lease_bp.route('/generate-lease', methods=['POST'])
# @token_required  # Temporarily disabled for testing
def generate_lease():
    """Generate a lease document (PDF) from form data - matching original LeaseGenerator.js"""
    try:
        form_data = request.get_json()
        if not form_data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Generate PDF using the existing template
        generated_filename = fill_pdf_form(form_data)
        
        if generated_filename:
            # PDF generation successful
            return jsonify({
                'success': True,
                'filename': generated_filename
            }), 200
        else:
            return jsonify({'error': 'Failed to generate PDF. Please check that the template has fillable form fields.'}), 500
            
    except Exception as e:
        print(f"Error in generate_lease: {e}")
        return jsonify({'error': f'PDF generation failed: {str(e)}'}), 500

@ai_lease_bp.route('/download/<filename>', methods=['GET'])
# @token_required  # Temporarily disabled for testing
def download_lease(filename):
    """Download a generated lease file"""
    try:
        return send_from_directory(GENERATED_DIR, filename, as_attachment=True)
    except Exception as e:
        return jsonify({'error': f'File not found: {str(e)}'}), 404


@ai_lease_bp.route('/templates', methods=['POST'])
# @token_required  # Temporarily disabled for testing
def upload_template():
    """Upload a new PDF template for lease generation"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '' or not file.filename.endswith('.pdf'):
            return jsonify({'error': 'Invalid file. Please upload a PDF file.'}), 400

        filename = secure_filename(file.filename)
        filepath = os.path.join(TEMPLATES_DIR, filename)
        file.save(filepath)

        # Analyze the PDF to count form fields
        try:
            reader = PdfReader(filepath)
            field_count = len(reader.get_form_text_fields())
            
            # Store template info in database (you might want to create a Template model)
            # For now, we'll just return success
            return jsonify({
                'success': True,
                'filename': filename,
                'form_fields_count': field_count,
                'message': 'Template uploaded successfully'
            }), 201
            
        except Exception as e:
            # Remove the file if it's not a valid PDF
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({'error': f'Invalid PDF file: {str(e)}'}), 400
            
    except Exception as e:
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@ai_lease_bp.route('/templates', methods=['GET'])
# @token_required  # Temporarily disabled for testing
def get_templates():
    """Get list of available PDF templates"""
    try:
        templates = []
        if os.path.exists(TEMPLATES_DIR):
            for filename in os.listdir(TEMPLATES_DIR):
                if filename.endswith('.pdf'):
                    filepath = os.path.join(TEMPLATES_DIR, filename)
                    file_stats = os.stat(filepath)
                    templates.append({
                        'filename': filename,
                        'uploaded_at': datetime.datetime.fromtimestamp(file_stats.st_mtime).isoformat(),
                        'size': file_stats.st_size
                    })
        
        return jsonify({
            'success': True,
            'templates': templates
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get templates: {str(e)}'}), 500

@ai_lease_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for AI lease service"""
    return jsonify({
        'status': 'healthy',
        'service': 'AI Lease Generator',
        'templates_dir': TEMPLATES_DIR,
        'generated_dir': GENERATED_DIR
    }), 200
