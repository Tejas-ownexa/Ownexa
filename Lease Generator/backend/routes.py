from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from pypdf import PdfReader
from models import db, PDFTemplate
from utils import fill_pdf_form
from docusign_service import (
    create_and_send_envelope_with_embedded_recipient,
    create_and_send_email_envelope,
    get_envelope_status,
    download_signed_document,
)
from docusign_bypass import create_and_send_email_envelope_bypass
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


@api.route('/docusign/status/<envelope_id>', methods=['GET'])
def docusign_status(envelope_id):
    try:
        status = get_envelope_status(envelope_id)
        return jsonify({'envelopeId': envelope_id, 'status': status})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/docusign/download-signed/<envelope_id>', methods=['GET'])
def docusign_download_signed(envelope_id):
    try:
        # Save under uploads/signed/Envelope_<id>.pdf
        target_dir = os.path.join(UPLOADS_DIR, 'signed')
        os.makedirs(target_dir, exist_ok=True)
        target_path = os.path.join(target_dir, f'Envelope_{envelope_id}.pdf')
        saved = download_signed_document(envelope_id, target_path)
        # Return path info so frontend can hit a static download endpoint if desired
        return jsonify({'envelopeId': envelope_id, 'savedPath': saved})
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


@api.route('/docusign/send', methods=['POST'])
def docusign_send():
    data = request.json or {}
    filename = data.get('filename')
    tenant_email = data.get('tenantEmail')
    tenant_name = data.get('tenantFullName')
    mode = data.get('mode', 'embedded')  # 'embedded' or 'email'

    if not filename or not tenant_email or not tenant_name:
        return jsonify({'error': 'filename, tenantEmail, tenantFullName are required'}), 400

    pdf_path = os.path.join(GENERATED_DIR, filename)
    if not os.path.exists(pdf_path):
        return jsonify({'error': 'Generated PDF not found'}), 404

    try:
        if mode == 'email':
            envelope_id = create_and_send_email_envelope(pdf_path, tenant_email, tenant_name)
            return jsonify({'envelopeId': envelope_id, 'sent': True})
        else:
            envelope_id, signing_url = create_and_send_envelope_with_embedded_recipient(
                pdf_path, tenant_email, tenant_name
            )
            return jsonify({'envelopeId': envelope_id, 'signingUrl': signing_url})
    except Exception as e:
        # If DocuSign fails due to consent issues, use bypass mode
        if "consent_required" in str(e) or "User consent required" in str(e):
            try:
                print("⚠️ DocuSign consent required, using bypass mode for testing")
                envelope_id = create_and_send_email_envelope_bypass(pdf_path, tenant_email, tenant_name)
                return jsonify({
                    'envelopeId': envelope_id, 
                    'sent': True, 
                    'mode': 'bypass',
                    'message': 'Document processing completed in test mode. DocuSign consent required for live sending.'
                })
            except Exception as bypass_error:
                return jsonify({'error': f'DocuSign consent required and bypass failed: {str(bypass_error)}'}), 500
        else:
            return jsonify({'error': str(e)}), 500
