#!/usr/bin/env python3
"""
PDF Form Generator
Automatically fills PDF forms with customer data and adds signatures
"""

import os
import io
import base64
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
import logging

# PDF processing libraries
try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.utils import ImageReader
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False

logger = logging.getLogger(__name__)

class PDFFormGenerator:
    """Generates filled PDF forms with customer data and signatures"""
    
    def __init__(self):
        self.pdf_templates = {
            'condo_apt': 'condo or apt.pdf',
            'single_family': 'single family or duplex.pdf'
        }
        
        # Field mappings for each PDF type
        self.field_mappings = {
            'condo_apt': {
                'customer_name': {'x': 100, 'y': 700},
                'email': {'x': 100, 'y': 680},
                'phone': {'x': 100, 'y': 660},
                'property_address': {'x': 100, 'y': 640},
                'unit_number': {'x': 100, 'y': 620},
                'rent_amount': {'x': 100, 'y': 600},
                'lease_start': {'x': 100, 'y': 580},
                'lease_end': {'x': 100, 'y': 560},
                'security_deposit': {'x': 100, 'y': 540},
                'signature': {'x': 100, 'y': 100, 'width': 200, 'height': 50},
                'date_signed': {'x': 350, 'y': 120}
            },
            'single_family': {
                'customer_name': {'x': 120, 'y': 720},
                'email': {'x': 120, 'y': 700},
                'phone': {'x': 120, 'y': 680},
                'property_address': {'x': 120, 'y': 660},
                'rent_amount': {'x': 120, 'y': 640},
                'lease_start': {'x': 120, 'y': 620},
                'lease_end': {'x': 120, 'y': 600},
                'security_deposit': {'x': 120, 'y': 580},
                'property_type': {'x': 120, 'y': 560},
                'signature': {'x': 120, 'y': 100, 'width': 200, 'height': 50},
                'date_signed': {'x': 370, 'y': 120}
            }
        }
    
    def detect_form_type(self, customer_data: Dict[str, Any]) -> str:
        """
        Automatically detect which PDF form to use based on customer data
        """
        # Check property address for apartment indicators
        address = customer_data.get('property_address', '').lower()
        unit_number = customer_data.get('unit_number', '').strip()
        property_type = customer_data.get('property_type', '').lower()
        
        # Apartment/Condo indicators
        apt_indicators = ['apt', 'apartment', 'unit', 'condo', 'condominium', '#']
        
        # Check if it's an apartment/condo
        if any(indicator in address for indicator in apt_indicators):
            return 'condo_apt'
        
        if unit_number:  # Has unit number = apartment/condo
            return 'condo_apt'
        
        if any(term in property_type for term in ['condo', 'apartment', 'unit']):
            return 'condo_apt'
        
        # Check for single family indicators
        single_family_indicators = ['house', 'single family', 'duplex', 'home']
        if any(indicator in property_type for indicator in single_family_indicators):
            return 'single_family'
        
        # Default to single family if unclear
        return 'single_family'
    
    def create_signature_image(self, signature_data: str) -> Optional[io.BytesIO]:
        """
        Convert base64 signature data to image for PDF insertion
        """
        try:
            # Remove data URL prefix if present
            if signature_data.startswith('data:image'):
                signature_data = signature_data.split(',')[1]
            
            # Decode base64 to image bytes
            signature_bytes = base64.b64decode(signature_data)
            signature_io = io.BytesIO(signature_bytes)
            
            return signature_io
        except Exception as e:
            logger.error(f"Error creating signature image: {str(e)}")
            return None
    
    def fill_pdf_with_pymupdf(self, template_path: str, customer_data: Dict[str, Any], 
                             form_type: str, signature_data: str = None) -> bytes:
        """
        Fill PDF using PyMuPDF with customer data and signature
        """
        if not PYMUPDF_AVAILABLE:
            raise Exception("PyMuPDF not available")
        
        try:
            # Open the PDF template
            doc = fitz.open(template_path)
            page = doc[0]  # Get first page
            
            # Get field mappings for this form type
            fields = self.field_mappings.get(form_type, {})
            
            # Add customer data to PDF
            for field_name, position in fields.items():
                if field_name in ['signature', 'date_signed']:
                    continue  # Handle these separately
                
                value = customer_data.get(field_name, '')
                if value:
                    # Add text to PDF
                    text_rect = fitz.Rect(
                        position['x'], 
                        position['y'], 
                        position['x'] + 300, 
                        position['y'] + 20
                    )
                    page.insert_text(text_rect.tl, str(value), fontsize=10)
            
            # Add signature if provided
            if signature_data and 'signature' in fields:
                signature_img = self.create_signature_image(signature_data)
                if signature_img:
                    sig_pos = fields['signature']
                    sig_rect = fitz.Rect(
                        sig_pos['x'],
                        sig_pos['y'],
                        sig_pos['x'] + sig_pos.get('width', 200),
                        sig_pos['y'] + sig_pos.get('height', 50)
                    )
                    page.insert_image(sig_rect, stream=signature_img.getvalue())
            
            # Add current date
            if 'date_signed' in fields:
                date_pos = fields['date_signed']
                current_date = datetime.now().strftime('%Y-%m-%d')
                date_rect = fitz.Rect(
                    date_pos['x'],
                    date_pos['y'],
                    date_pos['x'] + 100,
                    date_pos['y'] + 20
                )
                page.insert_text(date_rect.tl, current_date, fontsize=10)
            
            # Get PDF bytes
            pdf_bytes = doc.tobytes()
            doc.close()
            
            return pdf_bytes
            
        except Exception as e:
            logger.error(f"Error filling PDF with PyMuPDF: {str(e)}")
            raise
    
    def create_filled_pdf_reportlab(self, customer_data: Dict[str, Any], 
                                   form_type: str, signature_data: str = None) -> bytes:
        """
        Create a filled PDF using ReportLab (fallback method)
        """
        if not REPORTLAB_AVAILABLE:
            raise Exception("ReportLab not available")
        
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        
        # Get field mappings
        fields = self.field_mappings.get(form_type, {})
        
        # Add title
        p.setFont("Helvetica-Bold", 16)
        title = "Rental Application - " + ("Condo/Apartment" if form_type == 'condo_apt' else "Single Family/Duplex")
        p.drawString(100, 750, title)
        
        # Add customer data
        p.setFont("Helvetica", 12)
        for field_name, position in fields.items():
            if field_name in ['signature', 'date_signed']:
                continue
            
            value = customer_data.get(field_name, '')
            if value:
                label = field_name.replace('_', ' ').title()
                p.drawString(position['x'], position['y'], f"{label}: {value}")
        
        # Add signature
        if signature_data and 'signature' in fields:
            try:
                signature_img = self.create_signature_image(signature_data)
                if signature_img:
                    sig_pos = fields['signature']
                    p.drawImage(
                        ImageReader(signature_img),
                        sig_pos['x'],
                        sig_pos['y'],
                        width=sig_pos.get('width', 200),
                        height=sig_pos.get('height', 50)
                    )
            except Exception as e:
                logger.warning(f"Could not add signature: {str(e)}")
                # Add signature placeholder text
                p.drawString(fields['signature']['x'], fields['signature']['y'], "Signature: [Signed Electronically]")
        
        # Add date
        if 'date_signed' in fields:
            current_date = datetime.now().strftime('%Y-%m-%d')
            p.drawString(fields['date_signed']['x'], fields['date_signed']['y'], f"Date: {current_date}")
        
        p.showPage()
        p.save()
        
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes
    
    def generate_filled_pdf(self, customer_data: Dict[str, Any], signature_data: str = None) -> Tuple[bytes, str]:
        """
        Main method to generate a filled PDF with customer data and signature
        
        Returns:
            Tuple of (pdf_bytes, form_type_used)
        """
        try:
            # Detect which form to use
            form_type = self.detect_form_type(customer_data)
            logger.info(f"Auto-detected form type: {form_type}")
            
            # Try to use existing PDF template with PyMuPDF
            template_path = self.pdf_templates.get(form_type)
            if template_path and os.path.exists(template_path) and PYMUPDF_AVAILABLE:
                logger.info(f"Using existing PDF template: {template_path}")
                pdf_bytes = self.fill_pdf_with_pymupdf(template_path, customer_data, form_type, signature_data)
            else:
                # Fallback to creating new PDF with ReportLab
                logger.info("Creating new PDF with ReportLab")
                pdf_bytes = self.create_filled_pdf_reportlab(customer_data, form_type, signature_data)
            
            return pdf_bytes, form_type
            
        except Exception as e:
            logger.error(f"Error generating PDF: {str(e)}")
            raise
    
    def save_generated_pdf(self, pdf_bytes: bytes, customer_name: str, form_type: str) -> str:
        """
        Save the generated PDF to the uploads folder
        
        Returns:
            File path of the saved PDF
        """
        try:
            # Create uploads directory if it doesn't exist
            uploads_dir = 'uploads/generated_pdfs'
            os.makedirs(uploads_dir, exist_ok=True)
            
            # Create filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            safe_name = "".join(c for c in customer_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
            filename = f"{safe_name}_{form_type}_{timestamp}.pdf"
            file_path = os.path.join(uploads_dir, filename)
            
            # Save PDF
            with open(file_path, 'wb') as f:
                f.write(pdf_bytes)
            
            logger.info(f"PDF saved to: {file_path}")
            return file_path
            
        except Exception as e:
            logger.error(f"Error saving PDF: {str(e)}")
            raise


def install_pdf_dependencies():
    """Install required PDF processing libraries"""
    import subprocess
    import sys
    
    libraries = ['reportlab', 'PyMuPDF']
    
    for lib in libraries:
        try:
            __import__(lib.lower())
            print(f"✅ {lib} already installed")
        except ImportError:
            print(f"📦 Installing {lib}...")
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--user', lib])
            print(f"✅ {lib} installed successfully")


if __name__ == "__main__":
    # Test the PDF generator
    generator = PDFFormGenerator()
    
    # Test data
    test_data = {
        'customer_name': 'John Doe',
        'email': 'john.doe@example.com',
        'phone': '555-123-4567',
        'property_address': '123 Main St, Apt 4B',
        'unit_number': '4B',
        'rent_amount': '1200.00',
        'lease_start': '2024-03-01',
        'lease_end': '2025-02-28',
        'security_deposit': '1200.00'
    }
    
    print("🧪 Testing PDF Form Generator")
    print(f"Detected form type: {generator.detect_form_type(test_data)}")
    print(f"Available libraries: PyMuPDF={PYMUPDF_AVAILABLE}, ReportLab={REPORTLAB_AVAILABLE}")
    
    if not (PYMUPDF_AVAILABLE or REPORTLAB_AVAILABLE):
        print("⚠️  No PDF libraries available. Run install_pdf_dependencies() first.")
    else:
        print("✅ PDF generator ready!")