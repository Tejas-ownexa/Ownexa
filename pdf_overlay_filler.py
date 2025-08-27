#!/usr/bin/env python3
"""
PDF Overlay Filler for Ownexa Templates
Overlays customer data on existing PDF templates using coordinates
"""
import os
import io
import base64
from datetime import datetime
from typing import Dict, Any, Tuple

class OwenxaPDFOverlay:
    """Overlays customer data on Ownexa PDF templates"""
    
    def __init__(self):
        self.pdf_templates = {
            'condo_apt': 'condo or apt.pdf',
            'single_family': 'single family or duplex.pdf'
        }
        
        # Coordinate mappings for text placement on your PDFs
        # These coordinates are estimates - we'll need to fine-tune them
        self.coordinate_mappings = {
            'condo_apt': {
                # Page 1 - Main application form
                'full_name': {'x': 150, 'y': 650, 'page': 0, 'font_size': 12},
                'email': {'x': 150, 'y': 620, 'page': 0, 'font_size': 10},
                'phone_number': {'x': 400, 'y': 650, 'page': 0, 'font_size': 10},
                'property_address': {'x': 150, 'y': 590, 'page': 0, 'font_size': 10},
                'unit_number': {'x': 450, 'y': 590, 'page': 0, 'font_size': 10},
                'rent_amount': {'x': 150, 'y': 560, 'page': 0, 'font_size': 11},
                'security_deposit': {'x': 300, 'y': 560, 'page': 0, 'font_size': 11},
                'lease_start': {'x': 150, 'y': 530, 'page': 0, 'font_size': 10},
                'lease_end': {'x': 300, 'y': 530, 'page': 0, 'font_size': 10},
                'monthly_income': {'x': 150, 'y': 500, 'page': 0, 'font_size': 10},
                'employment_info': {'x': 150, 'y': 470, 'page': 0, 'font_size': 9},
                'emergency_contact': {'x': 150, 'y': 440, 'page': 0, 'font_size': 9},
                # Signature area - usually at bottom of first or last page
                'signature': {'x': 150, 'y': 150, 'width': 200, 'height': 50, 'page': 0},
                'date_signed': {'x': 400, 'y': 170, 'page': 0, 'font_size': 10}
            },
            'single_family': {
                # Page 1 - Main application form (similar layout but slightly different positions)
                'full_name': {'x': 170, 'y': 680, 'page': 0, 'font_size': 12},
                'email': {'x': 170, 'y': 650, 'page': 0, 'font_size': 10},
                'phone_number': {'x': 420, 'y': 680, 'page': 0, 'font_size': 10},
                'property_address': {'x': 170, 'y': 620, 'page': 0, 'font_size': 10},
                'rent_amount': {'x': 170, 'y': 590, 'page': 0, 'font_size': 11},
                'security_deposit': {'x': 320, 'y': 590, 'page': 0, 'font_size': 11},
                'lease_start': {'x': 170, 'y': 560, 'page': 0, 'font_size': 10},
                'lease_end': {'x': 320, 'y': 560, 'page': 0, 'font_size': 10},
                'monthly_income': {'x': 170, 'y': 530, 'page': 0, 'font_size': 10},
                'employment_info': {'x': 170, 'y': 500, 'page': 0, 'font_size': 9},
                'emergency_contact': {'x': 170, 'y': 470, 'page': 0, 'font_size': 9},
                # Signature area
                'signature': {'x': 170, 'y': 150, 'width': 200, 'height': 50, 'page': 0},
                'date_signed': {'x': 420, 'y': 170, 'page': 0, 'font_size': 10}
            }
        }
    
    def detect_form_type(self, customer_data: Dict[str, Any]) -> str:
        """Detect which PDF template to use"""
        address = customer_data.get('property_address', '').lower()
        unit_number = customer_data.get('unit_number', '').strip()
        property_type = customer_data.get('property_type', '').lower()
        
        # Apartment/Condo indicators
        apt_indicators = ['apt', 'apartment', 'unit', 'condo', 'condominium', '#']
        
        if any(indicator in address for indicator in apt_indicators):
            return 'condo_apt'
        if unit_number:
            return 'condo_apt'
        if any(term in property_type for term in ['condo', 'apartment', 'unit']):
            return 'condo_apt'
        
        return 'single_family'
    
    def create_signature_image(self, signature_data: str) -> io.BytesIO:
        """Convert base64 signature to image"""
        try:
            if signature_data.startswith('data:image'):
                signature_data = signature_data.split(',')[1]
            
            signature_bytes = base64.b64decode(signature_data)
            return io.BytesIO(signature_bytes)
        except Exception as e:
            print(f"Error creating signature: {e}")
            return None
    
    def overlay_customer_data(self, template_path: str, customer_data: Dict[str, Any], 
                             form_type: str, signature_data: str = None) -> bytes:
        """Overlay customer data on PDF template"""
        try:
            import fitz
            
            # Open the PDF template
            doc = fitz.open(template_path)
            print(f"   📄 Opened PDF with {doc.page_count} pages")
            
            # Get coordinate mappings for this form type
            coordinates = self.coordinate_mappings.get(form_type, {})
            
            overlays_added = 0
            
            # Add customer data to PDF
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
                        font_size = field_coords.get('font_size', 10)
                        
                        # Use blue color to make text visible
                        page.insert_text(point, str(value), fontsize=font_size, color=(0, 0, 1))
                        overlays_added += 1
                        print(f"   ✅ Added '{field_name}': {value}")
            
            # Add signature if provided
            if signature_data and 'signature' in coordinates:
                signature_img = self.create_signature_image(signature_data)
                if signature_img:
                    sig_coords = coordinates['signature']
                    page_num = sig_coords.get('page', 0)
                    if page_num < doc.page_count:
                        page = doc[page_num]
                        
                        sig_rect = fitz.Rect(
                            sig_coords['x'],
                            sig_coords['y'],
                            sig_coords['x'] + sig_coords.get('width', 200),
                            sig_coords['y'] + sig_coords.get('height', 50)
                        )
                        
                        try:
                            page.insert_image(sig_rect, stream=signature_img.getvalue())
                            print(f"   ✅ Added signature")
                            overlays_added += 1
                        except Exception as e:
                            print(f"   ⚠️ Could not add signature image: {e}")
                            # Add text placeholder
                            point = fitz.Point(sig_coords['x'], sig_coords['y'])
                            page.insert_text(point, "[Electronically Signed]", fontsize=10, color=(0, 0, 1))
                            overlays_added += 1
            
            # Add current date
            if 'date_signed' in coordinates:
                date_coords = coordinates['date_signed']
                page_num = date_coords.get('page', 0)
                if page_num < doc.page_count:
                    page = doc[page_num]
                    current_date = datetime.now().strftime('%m/%d/%Y')
                    point = fitz.Point(date_coords['x'], date_coords['y'])
                    font_size = date_coords.get('font_size', 10)
                    page.insert_text(point, current_date, fontsize=font_size, color=(0, 0, 1))
                    print(f"   ✅ Added date: {current_date}")
                    overlays_added += 1
            
            print(f"   📊 Total overlays added: {overlays_added}")
            
            # Get PDF bytes
            pdf_bytes = doc.tobytes()
            doc.close()
            
            return pdf_bytes
            
        except Exception as e:
            print(f"   ❌ Error overlaying data: {e}")
            raise
    
    def fill_pdf_template(self, customer_data: Dict[str, Any], signature_data: str = None) -> Tuple[bytes, str]:
        """Main method to fill PDF template with customer data"""
        # Detect form type
        form_type = self.detect_form_type(customer_data)
        print(f"🎯 Detected form type: {form_type}")
        
        # Get template path
        template_name = self.pdf_templates.get(form_type)
        if not template_name or not os.path.exists(template_name):
            raise FileNotFoundError(f"Template not found: {template_name}")
        
        print(f"📄 Using template: {template_name}")
        
        # Overlay customer data
        pdf_bytes = self.overlay_customer_data(template_name, customer_data, form_type, signature_data)
        
        return pdf_bytes, form_type
    
    def save_filled_pdf(self, pdf_bytes: bytes, customer_name: str, form_type: str) -> str:
        """Save filled PDF"""
        # Create uploads directory
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
        
        print(f"💾 Saved filled PDF: {file_path}")
        return file_path

def test_pdf_overlay():
    """Test the PDF overlay system"""
    print("🧪 Testing PDF Overlay System")
    print("=" * 50)
    
    overlay = OwenxaPDFOverlay()
    
    # Test data for apartment
    apartment_data = {
        'full_name': 'Jennifer Chen',
        'email': 'jennifer.chen@example.com',
        'phone_number': '555-0123',
        'property_address': '789 Riverside Dr, Apt 8C',
        'unit_number': '8C',
        'property_type': 'apartment',
        'rent_amount': '$1,950.00',
        'security_deposit': '$1,950.00',
        'lease_start': '09/01/2024',
        'lease_end': '08/31/2025',
        'monthly_income': '$5,850.00',
        'employment_info': 'Data Analyst at Tech Solutions Inc.',
        'emergency_contact': 'Michael Chen (Brother) - 555-0124'
    }
    
    # Test data for single family
    house_data = {
        'full_name': 'Robert Anderson',
        'email': 'robert.anderson@example.com',
        'phone_number': '555-0456',
        'property_address': '1456 Maple Grove Lane',
        'property_type': 'single family',
        'rent_amount': '$2,750.00',
        'security_deposit': '$2,750.00',
        'lease_start': '10/01/2024',
        'lease_end': '09/30/2025',
        'monthly_income': '$8,250.00',
        'employment_info': 'Senior Manager at Financial Services Corp.',
        'emergency_contact': 'Susan Anderson (Wife) - 555-0457'
    }
    
    # Sample signature
    signature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    
    print("\n🏢 Testing apartment application...")
    try:
        pdf_bytes1, form_type1 = overlay.fill_pdf_template(apartment_data, signature)
        file_path1 = overlay.save_filled_pdf(pdf_bytes1, apartment_data['full_name'], form_type1)
        print(f"✅ Apartment PDF: {len(pdf_bytes1):,} bytes")
    except Exception as e:
        print(f"❌ Apartment test failed: {e}")
    
    print("\n🏡 Testing single family application...")
    try:
        pdf_bytes2, form_type2 = overlay.fill_pdf_template(house_data, signature)
        file_path2 = overlay.save_filled_pdf(pdf_bytes2, house_data['full_name'], form_type2)
        print(f"✅ Single family PDF: {len(pdf_bytes2):,} bytes")
    except Exception as e:
        print(f"❌ Single family test failed: {e}")
    
    print(f"\n✅ PDF overlay test completed!")
    print(f"📁 Check uploads/generated_pdfs/ for filled PDFs")

if __name__ == "__main__":
    test_pdf_overlay()
