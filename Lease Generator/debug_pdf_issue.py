#!/usr/bin/env python3
"""
Simple debug script to test PDF generation issue
"""
import os
import sys

# Add backend to path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

def debug_pdf_issue():
    """Debug the PDF loading issue"""
    print("🔍 DEBUGGING PDF GENERATION ISSUE")
    print("=" * 50)
    
    # Check current directory
    print(f"Current directory: {os.getcwd()}")
    
    # Check if backend directory exists
    if os.path.exists('backend'):
        print("✅ Backend directory found")
        os.chdir('backend')
        print(f"Changed to: {os.getcwd()}")
    else:
        print("❌ Backend directory not found")
        return
    
    # Check templates
    template_paths = [
        'uploads/templates/fillable_lease_template.pdf',
        'uploads/templates/condo or apt 1.pdf'
    ]
    
    for path in template_paths:
        if os.path.exists(path):
            size = os.path.getsize(path)
            print(f"✅ Template found: {path} ({size} bytes)")
        else:
            print(f"❌ Template missing: {path}")
    
    # Test import
    try:
        from utils import fill_pdf_form
        print("✅ Successfully imported fill_pdf_form")
    except Exception as e:
        print(f"❌ Import error: {e}")
        return
    
    # Test simple data
    test_data = {
        'tenantFullName': 'Test Tenant',
        'landlordFullName': 'Test Landlord',
        'monthlyRent': '1000'
    }
    
    print("\n🧪 Testing PDF generation...")
    try:
        result = fill_pdf_form(test_data)
        if result:
            print(f"✅ PDF generation returned: {result}")
            
            # Check if file exists
            output_path = os.path.join('uploads', 'generated', result)
            if os.path.exists(output_path):
                size = os.path.getsize(output_path)
                print(f"✅ Generated file exists: {size} bytes")
            else:
                print(f"❌ Generated file not found at: {output_path}")
        else:
            print("❌ PDF generation returned None")
    except Exception as e:
        print(f"❌ PDF generation error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    debug_pdf_issue()
