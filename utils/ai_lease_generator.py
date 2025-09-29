import os
import uuid
from pypdf import PdfReader, PdfWriter
from pypdf.generic import TextStringObject, NameObject
try:
    # For certain renderers, forcing NeedAppearances improves display of filled fields
    from pypdf.generic import BooleanObject
except Exception:
    BooleanObject = None
import datetime

def fill_pdf_form(form_data, template_filename=None):
    """
    Fills a PDF form template with data from a dictionary and generates a new PDF.
    
    Args:
        form_data (dict): Dictionary containing form field data
        template_filename (str, optional): Name of the template file to use. 
                                         If None, uses default template.
    """
    try:
        # Define mapping from frontend data keys to PDF field names
        # Based on the actual fields found in "condo or apt copy.pdf"
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
            'securityDeposit': 'securityDeposit',
            'lateFee': 'lateFee',
            'earlyTerminationFee': 'earlyTerminationFee'
        }

        # Load the specified template or default template
        templates_dir = os.path.join(os.path.dirname(__file__), '..', 'uploads', 'templates')
        
        # Use specified template or try default templates
        if template_filename:
            template_path = os.path.join(templates_dir, template_filename)
        else:
            # Try default templates in order of preference
            default_templates = ["condo or apt.pdf", "condo or apt copy.pdf"]
            template_path = None
            template_filename = None
            
            for default_template in default_templates:
                test_path = os.path.join(templates_dir, default_template)
                if os.path.exists(test_path):
                    template_path = test_path
                    template_filename = default_template
                    break
        
        if not template_path or not os.path.exists(template_path):
            print(f"Error: Template '{template_filename}' not found in templates directory: {templates_dir}")
            print(f"Available templates: {os.listdir(templates_dir) if os.path.exists(templates_dir) else 'Directory not found'}")
            return None
                
        print(f"Using template: {template_filename}")

        # Read the PDF and prepare a writer object
        reader = PdfReader(template_path)
        writer = PdfWriter()
        
        # Clone document structure to preserve AcroForm
        writer.clone_reader_document_root(reader)
        
        # Ensure NeedAppearances so viewers (and DocuSign) render filled values reliably
        if '/AcroForm' in writer._root_object:
            acro = writer._root_object['/AcroForm']
            if BooleanObject is not None:
                acro.update({NameObject('/NeedAppearances'): BooleanObject(True)})
            else:
                acro.update({NameObject('/NeedAppearances'): TextStringObject('true')})
        
        # Create the data dictionary for filling form fields
        data_to_fill = {}
        for form_key, pdf_field_name in FIELD_MAPPING.items():
            value = form_data.get(form_key, '')
            if value:
                # Handle special formatting for fields that exist in the template
                if form_key == 'earlyTerminationFee':
                    data_to_fill[pdf_field_name] = 'Agrees' if value == 'agrees' else 'Does Not Agree'
                else:
                    data_to_fill[pdf_field_name] = str(value)

        print(f"Debug: Data to fill: {data_to_fill}")

        # Fill form fields using direct field manipulation
        if data_to_fill and '/AcroForm' in writer._root_object:
            acro_form = writer._root_object['/AcroForm']
            if '/Fields' in acro_form:
                fields = acro_form['/Fields']
                
                # Update each field directly
                fields_found = []
                fields_filled = []
                
                for field_name, field_value in data_to_fill.items():
                    field_found = False
                    for field_ref in fields:
                        field_obj = field_ref.get_object()
                        if '/T' in field_obj and field_obj['/T'] == field_name:
                            # Set field value and default value
                            field_obj[NameObject('/V')] = TextStringObject(field_value)
                            field_obj[NameObject('/DV')] = TextStringObject(field_value)
                            
                            # Remove appearance streams to force regeneration
                            if NameObject('/AP') in field_obj:
                                del field_obj[NameObject('/AP')]
                            
                            fields_filled.append(f"{field_name}={field_value}")
                            field_found = True
                            break
                    
                    if not field_found:
                        fields_found.append(field_name)
                
                print(f"Debug: Fields successfully filled: {fields_filled}")
                if fields_found:
                    print(f"Debug: Fields not found in PDF: {fields_found}")

        # Generate unique filename
        tenant_name = form_data.get('tenantFullName', 'UNKNOWN_TENANT')
        clean_tenant_name = ''.join(c for c in tenant_name if c.isalnum() or c in (' ', '_')).replace(' ', '_').upper()
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"Lease_{clean_tenant_name}_{timestamp}.pdf"
        
        output_path = os.path.join(os.path.dirname(__file__), '..', 'uploads', 'generated', output_filename)

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

def generate_lease_content(form_data):
    """
    Generates a text-based lease content from form data.
    This is a fallback or alternative if PDF generation is not desired or possible.
    """
    try:
        # This is a simplified text generation, can be expanded with more details
        lease_content = f"""
RESIDENTIAL LEASE AGREEMENT

This lease agreement is entered into on {datetime.date.today().strftime('%Y-%m-%d')} between:

LANDLORD: {form_data.get('landlordFullName', '')}
Email: {form_data.get('landlordEmail', '')}
Phone: {form_data.get('landlordPhone', '')}

TENANT: {form_data.get('tenantFullName', '')}
Email: {form_data.get('tenantEmail', '')}
Phone: {form_data.get('tenantPhone', '')}

PROPERTY ADDRESS: {form_data.get('streetAddress', '')}{f", Unit {form_data.get('unitNumber', '')}" if form_data.get('unitNumber') else ''}, {form_data.get('city', '')}, {form_data.get('zipCode', '')}

LEASE TERMS:
- Lease Term: {form_data.get('leaseTerm', '')} months
- Start Date: {form_data.get('leaseStartDate', '')}
- End Date: {form_data.get('leaseEndDate', '')}
- Monthly Rent: ${form_data.get('monthlyRent', '')}
- Rent Due: {form_data.get('rentDueDay', '')}{get_ordinal_suffix(int(form_data.get('rentDueDay', 1)))} of each month
- Security Deposit: ${form_data.get('securityDeposit', '')}
- Late Fee: ${form_data.get('lateFee', '')} after {form_data.get('lateFeeGracePeriod', '')} days grace period

POLICIES:
- Pets: {'Allowed' if form_data.get('petsPolicy') == 'allowed' else 'Not Allowed'}
- Smoking: {'Permitted' if form_data.get('smokingPolicy') == 'permitted' else 'Not Permitted'}

{f"INCLUDED ITEMS: {form_data.get('includedFurniture', '')}" if form_data.get('includedFurniture') else ''}

{f"EARLY TERMINATION: Fee of ${form_data.get('earlyTerminationAmount', '')} applies" if form_data.get('earlyTerminationFee') == 'agrees' else ''}

AGENT INFORMATION:
- Agent Name: {form_data.get('agentName', '')}
- Agent Address/Email: {form_data.get('agentAddress', '')}

[Additional standard lease clauses would be generated here by AI...]
        """
        return lease_content

    except Exception as e:
        print(f"Error generating lease content: {e}")
        return "Error generating lease content. Please try again."

def get_ordinal_suffix(day):
    """Get ordinal suffix for day (1st, 2nd, 3rd, etc.)"""
    if day > 3 and day < 21:
        return 'th'
    if day % 10 == 1:
        return 'st'
    elif day % 10 == 2:
        return 'nd'
    elif day % 10 == 3:
        return 'rd'
    else:
        return 'th'
