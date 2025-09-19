from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from pypdf import PdfReader
from models import db, PDFTemplate
from utils import fill_pdf_form
import os

api = Blueprint('api', __name__)

BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '.'))
UPLOADS_DIR = os.path.join(BACKEND_ROOT, 'uploads')
TEMPLATES_DIR = os.path.join(UPLOADS_DIR, 'templates')
GENERATED_DIR = os.path.join(UPLOADS_DIR, 'generated')

@api.route('/templates', methods=['POST'])
def upload_template():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '' or not file.filename.endswith('.pdf'):
        return jsonify({'error': 'Invalid file'}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(TEMPLATES_DIR, filename)
    file.save(filepath)

    try:
        reader = PdfReader(filepath)
        field_count = len(reader.get_form_text_fields())
        new_template = PDFTemplate(name=filename, filepath=filepath, form_fields_count=field_count)
        db.session.add(new_template)
        db.session.commit()
        return jsonify(new_template.to_dict()), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/templates', methods=['GET'])
def get_templates():
    templates = PDFTemplate.query.all()
    return jsonify([t.to_dict() for t in templates])

@api.route('/generate-filled', methods=['POST'])
def generate_filled_lease_route():
    form_data = request.json
    if not form_data:
        return jsonify({'error': 'No data provided'}), 400
    try:
        generated_filename = fill_pdf_form(form_data)
        if generated_filename is None:
            return jsonify({'error': 'Failed to generate PDF. Check server logs.'}), 500
        return jsonify({'filename': generated_filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    return send_from_directory(GENERATED_DIR, filename, as_attachment=True)
