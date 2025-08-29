#!/usr/bin/env python3
"""
Enhanced PDF Form Filler
Fills existing PDF templates with customer data from frontend forms
"""
import os
import io
import base64
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class EnhancedPDFFormFiller:
    """Fills existing PDF templates with customer data and signatures"""
    
    def __init__(self):
        self.pdf_templates = {
            'condo_apt': 'condo or apt.pdf',
            'single_family': 'single family or duplex.pdf'
        }
        
        # Common field mappings that work across different PDF structures
        self.common_field_mappings = {
            # Personal Information
            'full_name': ['Name', 'name', 'applicant_name', 'tenant_name', 'full_name'],
            'email': ['Email', 'email', 'email_address', 'e_mail'],
            'phone_number': ['Phone', 'phone', 'phone_number', 'telephone'],
            'monthly_income': ['Income', 'income', 'monthly_income', 'gross_income'],
            
            # Property Information  
            'property_address': ['Address', 'address', 'property_address', 'rental_address'],
            'unit_number': ['Unit', 'unit', 'unit_number', 'apt_number'],
            'rent_amount': ['Rent', 'rent', 'monthly_rent', 'rent_amount'],
            'security_deposit': ['Deposit', 'deposit', 'security_deposit', 'security'],
            
            # Lease Information
            'lease_start': ['Start', 'start_date', 'lease_start', 'move_in'],
            'lease_end': ['End', 'end_date', 'lease_end', 'lease_term'],
            'move_in_date': ['Move_in', 'move_in_date', 'occupancy_date'],
            
            # Additional Information
            'employment_info': ['Employment', 'employer', 'employment_info', 'occupation'],
            'emergency_contact': ['Emergency', 'emergency_contact', 'reference'],
            'pets': ['Pets', 'pets', 'animals'],
            'additional_notes': ['Notes', 'comments', 'additional_info']
        }
        
        # Coordinate-based positioning for text overlay (if no form fields)
        self.coordinate_mappings = {
            'condo_apt': {
                'full_name': {'x': 150, 'y': 700, 'page': 0},
                'email': {'x': 150, 'y': 680, 'page': 0},
                'phone_number': {'x': 150, 'y': 660, 'page': 0},
                'property_address': {'x': 150, 'y': 640, 'page': 0},
                'unit_number': {'x': 150, 'y': 620, 'page': 0},
                'rent_amount': {'x': 150, 'y': 600, 'page': 0},
                'security_deposit': {'x': 150, 'y': 580, 'page': 0},
                'lease_start': {'x': 150, 'y': 560, 'page': 0},
                'signature': {'x': 100, 'y': 100, 'width': 200, 'height': 50, 'page': 0},
                'date_signed': {'x': 350, 'y': 120, 'page': 0}
            },
            'single_family': {
                'full_name': {'x': 170, 'y': 720, 'page': 0},
                'email': {'x': 170, 'y': 700, 'page': 0},
                'phone_number': {'x': 170, 'y': 680, 'page': 0},
                'property_address': {'x': 170, 'y': 660, 'page': 0},
                'rent_amount': {'x': 170, 'y': 640, 'page': 0},
                'security_deposit': {'x': 170, 'y': 620, 'page': 0},
                'lease_start': {'x': 170, 'y': 600, 'page': 0},
                'signature': {'x': 120, 'y': 100, 'width': 200, 'height': 50, 'page': 0},
                'date_signed': {'x': 370, 'y': 120, 'page': 0}
            }
        }
    
    def detect_form_type(self, customer_data: Dict[str, Any]) -> str:
        """Detect which PDF template to use based on customer data"""
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
        
        # Default to single family
        return 'single_family'
    
    def create_signature_image(self, signature_data: str) -> Optional[io.BytesIO]:
        """Convert base64 signature data to image for PDF insertion"""
        try:
            if signature_data.startswith('data:image'):
                signature_data = signature_data.split(',')[1]
            
            signature_bytes = base64.b64decode(signature_data)
            signature_io = io.BytesIO(signature_bytes)
            return signature_io
        except Exception as e:
            logger.error(f"Error creating signature image: {str(e)}")
            return None
    
    def fill_pdf_form_fields(self, template_path: str, customer_data: Dict[str, Any], 
                           form_type: str, signature_data: str = None) -> bytes:
        """Fill PDF form fields with customer data"""
        try:
            import fitz
            doc = fitz.open(template_path)
            
            filled_any_field = False
            
            for page_num in range(doc.page_count):
                page = doc[page_num]
                widgets = page.widgets()
                
                if widgets:
                    logger.info(f"Found {len(widgets)} form fields on page {page_num + 1}")
                    
                    for widget in widgets:
                        field_name = widget.field_name.lower() if widget.field_name else ""
                        
                        # Try to match field names with customer data
                        for data_key, data_value in customer_data.items():
                            if data_value and self._field_matches(field_name, data_key):
                                try:
                                    widget.field_value = str(data_value)
                                    widget.update()
                                    filled_any_field = True
                                    logger.info(f"Filled field '{field_name}' with '{data_value}'")
                                    break
                                except Exception as e:
                                    logger.warning(f"Could not fill field '{field_name}': {e}")
            
            # Add signature and date if provided
            if signature_data:
                self._add_signature_to_pdf(doc, signature_data, form_type)
            
            # Add current date
            self._add_date_to_pdf(doc, form_type)
            
            pdf_bytes = doc.tobytes()
            doc.close()
            
            if filled_any_field:
                logger.info("Successfully filled PDF form fields")
            else:
                logger.info("No form fields matched - using coordinate overlay method")
                # Fall back to coordinate-based text overlay
                return self.overlay_text_on_pdf(template_path, customer_data, form_type, signature_data)
            
            return pdf_bytes
            
        except ImportError:
            logger.error("PyMuPDF not available")
            return self.overlay_text_on_pdf(template_path, customer_data, form_type, signature_data)
        except Exception as e:
            logger.error(f"Error filling PDF form fields: {str(e)}")
            return self.overlay_text_on_pdf(template_path, customer_data, form_type, signature_data)
    
    def overlay_text_on_pdf(self, template_path: str, customer_data: Dict[str, Any], 
                           form_type: str, signature_data: str = None) -> bytes:
        """Overlay text on PDF using coordinate positioning"""
        try:
            import fitz
            doc = fitz.open(template_path)
            
            # Get coordinate mappings for this form type
            coordinates = self.coordinate_mappings.get(form_type, {})
            
            for field_name, field_coords in coordinates.items():
                if field_name in ['signature', 'date_signed']:
                    continue  # Handle these separately
                
                value = customer_data.get(field_name, '')
                if value:
                    page_num = field_coords.get('page', 0)
                    if page_num < doc.page_count:
                        page = doc[page_num]
                        
                        # Insert text at specified coordinates
                        point = fitz.Point(field_coords['x'], field_coords['y'])
                        page.insert_text(point, str(value), fontsize=10, color=(0, 0, 0))
                        logger.info(f"Added text '{value}' at ({field_coords['x']}, {field_coords['y']})")
            
            # Add signature if provided
            if signature_data:
                self._add_signature_to_pdf(doc, signature_data, form_type)
            
            # Add current date
            self._add_date_to_pdf(doc, form_type)
            
            pdf_bytes = doc.tobytes()
            doc.close()
            
            return pdf_bytes
            
        except Exception as e:
            logger.error(f"Error overlaying text on PDF: {str(e)}")
            raise
    
    def _field_matches(self, field_name: str, data_key: str) -> bool:
        """Check if a form field name matches a data key"""
        # Direct match
        if field_name == data_key.lower():
            return True
        
        # Check common mappings
        if data_key in self.common_field_mappings:
            return any(mapping.lower() in field_name for mapping in self.common_field_mappings[data_key])
        
        # Partial match
        return data_key.lower() in field_name or field_name in data_key.lower()
    
    def _add_signature_to_pdf(self, doc, signature_data: str, form_type: str):
        """Add signature image to PDF"""
        try:
            signature_img = self.create_signature_image(signature_data)
            if signature_img:
                coordinates = self.coordinate_mappings.get(form_type, {}).get('signature', {})
                if coordinates:
                    page_num = coordinates.get('page', 0)
                    if page_num < doc.page_count:
                        page = doc[page_num]
                        sig_rect = fitz.Rect(
                            coordinates['x'],
                            coordinates['y'],
                            coordinates['x'] + coordinates.get('width', 200),
                            coordinates['y'] + coordinates.get('height', 50)
                        )
                        page.insert_image(sig_rect, stream=signature_img.getvalue())
                        logger.info("Added signature to PDF")
        except Exception as e:
            logger.warning(f"Could not add signature: {e}")
    
    def _add_date_to_pdf(self, doc, form_type: str):
        """Add current date to PDF"""
        try:
            coordinates = self.coordinate_mappings.get(form_type, {}).get('date_signed', {})
            if coordinates:
                page_num = coordinates.get('page', 0)
                if page_num < doc.page_count:
                    page = doc[page_num]
                    current_date = datetime.now().strftime('%Y-%m-%d')
                    point = fitz.Point(coordinates['x'], coordinates['y'])
                    page.insert_text(point, f"Date: {current_date}", fontsize=10, color=(0, 0, 0))
                    logger.info("Added date to PDF")
        except Exception as e:
            logger.warning(f"Could not add date: {e}")
    
    def fill_pdf_template(self, customer_data: Dict[str, Any], signature_data: str = None) -> Tuple[bytes, str]:
        """Main method to fill PDF template with customer data"""
        try:
            # Detect which form type to use
            form_type = self.detect_form_type(customer_data)
            logger.info(f"Detected form type: {form_type}")
            
            # Get template path
            template_name = self.pdf_templates.get(form_type)
            if not template_name:
                raise ValueError(f"No template found for form type: {form_type}")
            
            # Check if template exists
            template_path = template_name
            if not os.path.exists(template_path):
                # Try in Ownexa-JP subdirectory
                alt_path = f"Ownexa-JP/{template_name}"
                if os.path.exists(alt_path):
                    template_path = alt_path
                else:
                    raise FileNotFoundError(f"Template not found: {template_name}")
            
            logger.info(f"Using template: {template_path}")
            
            # Fill the PDF
            pdf_bytes = self.fill_pdf_form_fields(template_path, customer_data, form_type, signature_data)
            
            return pdf_bytes, form_type
            
        except Exception as e:
            logger.error(f"Error filling PDF template: {str(e)}")
            raise
    
    def save_filled_pdf(self, pdf_bytes: bytes, customer_name: str, form_type: str) -> str:
        """Save filled PDF to uploads directory"""
        try:
            # Create uploads directory
            uploads_dir = 'uploads/generated_pdfs'
            if not os.path.exists(uploads_dir):
                # Try Ownexa-JP subdirectory
                uploads_dir = 'Ownexa-JP/uploads/generated_pdfs'
            
            os.makedirs(uploads_dir, exist_ok=True)
            
            # Create filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            safe_name = "".join(c for c in customer_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
            filename = f"{safe_name}_{form_type}_{timestamp}.pdf"
            file_path = os.path.join(uploads_dir, filename)
            
            # Save PDF
            with open(file_path, 'wb') as f:
                f.write(pdf_bytes)
            
            logger.info(f"Saved filled PDF to: {file_path}")
            return file_path
            
        except Exception as e:
            logger.error(f"Error saving filled PDF: {str(e)}")
            raise


def test_pdf_filler():
    """Test the enhanced PDF filler"""
    print("🧪 Testing Enhanced PDF Form Filler")
    print("=" * 50)
    
    filler = EnhancedPDFFormFiller()
    
    # Test data
    test_data = {
        'full_name': 'Alice Johnson',
        'email': 'alice.johnson@example.com',
        'phone_number': '555-0987',
        'property_address': '456 Elm Street, Unit 12',
        'unit_number': '12',
        'property_type': 'apartment',
        'rent_amount': '1650.00',
        'security_deposit': '1650.00',
        'lease_start': '2024-06-01',
        'lease_end': '2025-05-31',
        'monthly_income': '4950.00',
        'employment_info': 'Marketing Manager at AdCorp',
        'emergency_contact': 'Bob Johnson - 555-0988',
        'pets': 'None'
    }
    
    # Sample signature
    signature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    
    try:
        print(f"🏠 Test customer: {test_data['full_name']}")
        print(f"📍 Property: {test_data['property_address']}")
        
        # Fill PDF
        pdf_bytes, form_type = filler.fill_pdf_template(test_data, signature)
        
        print(f"✅ Generated PDF using form type: {form_type}")
        print(f"📄 PDF size: {len(pdf_bytes)} bytes")
        
        # Save PDF
        file_path = filler.save_filled_pdf(pdf_bytes, test_data['full_name'], form_type)
        print(f"💾 Saved to: {file_path}")
        
        print("🎉 Test completed successfully!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    test_pdf_filler()
