import os
import uuid
from pypdf import PdfReader, PdfWriter
from pypdf.generic import TextStringObject, NameObject
from flask import jsonify
import datetime

def fill_pdf_form(form_data):
    """
    Fills a PDF form template with data from a dictionary and generates a new PDF.
    """
    try:
        # Define mapping from frontend data keys to PDF field names
        FIELD_MAPPING = {
            'landlordFullName': 'landlordFullName',
            'leaseTerm': 'leaseTerm',
            'leaseStartDate': 'leaseStartDate',
            'leaseEndDate': 'leaseEndDate',
            'tenantFullName': 'tenantFullName',
            'landlordEmail': 'landlordEmail',
            'landlordPhone': 'landlordPhone',
            'tenantEmail': 'tenantEmail',
            'tenantPhone': 'tenantPhone',
            'unitNumber': 'unitNumber',
            'streetAddress': 'streetAddress',
            'city': 'city',
            'zipCode': 'zipCode',
            'includedFurniture': 'includedFurniture',
            'monthlyRent': 'monthlyRent',
            'lateFee': 'lateFee',
            'securityDeposit': 'securityDeposit',
            'earlyTerminationFee': 'earlyTerminationFee',
        }

        # Load the PDF template
        template_path = os.path.join(os.path.dirname(__file__), 'uploads', 'templates', 'condo or apt.pdf')
        if not os.path.exists(template_path):
            return None

        # Read the PDF and prepare a writer object
        reader = PdfReader(template_path)
        writer = PdfWriter()
        
        # Clone document structure to preserve AcroForm
        writer.clone_reader_document_root(reader)
        
        # Create the data dictionary for filling form fields
        data_to_fill = {}
        for form_key, pdf_field_name in FIELD_MAPPING.items():
            value = form_data.get(form_key, '')
            if value:
                data_to_fill[pdf_field_name] = str(value)

        # Fill form fields using direct field manipulation
        if data_to_fill and '/AcroForm' in writer._root_object:
            acro_form = writer._root_object['/AcroForm']
            if '/Fields' in acro_form:
                fields = acro_form['/Fields']
                
                # Update each field directly
                for field_name, field_value in data_to_fill.items():
                    for field_ref in fields:
                        field_obj = field_ref.get_object()
                        if '/T' in field_obj and field_obj['/T'] == field_name:
                            # Set field value and default value
                            field_obj[NameObject('/V')] = TextStringObject(field_value)
                            field_obj[NameObject('/DV')] = TextStringObject(field_value)
                            
                            # Remove appearance streams to force regeneration
                            if NameObject('/AP') in field_obj:
                                del field_obj[NameObject('/AP')]
                            break

        # Generate unique filename
        tenant_name = form_data.get('tenantFullName', 'UNKNOWN_TENANT')
        clean_tenant_name = ''.join(c for c in tenant_name if c.isalnum() or c in (' ', '_')).replace(' ', '_').upper()
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"Lease_{clean_tenant_name}_{timestamp}.pdf"
        
        output_path = os.path.join(os.path.dirname(__file__), 'uploads', 'generated', output_filename)

        # Ensure the generated directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # Write the PDF to file
        with open(output_path, "wb") as output_stream:
            writer.write(output_stream)
            output_stream.flush()
            os.fsync(output_stream.fileno())

        # Verify file was created and return filename
        if os.path.exists(output_path):
            return output_filename
        else:
            return None

    except Exception as e:
        print(f"Error during PDF generation: {e}")
        return None