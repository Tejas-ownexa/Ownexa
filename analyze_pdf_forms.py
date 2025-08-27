#!/usr/bin/env python3
"""
PDF Form Analyzer
Analyzes the existing PDF templates to find fillable form fields
"""
import sys
import os

def analyze_pdf_with_pymupdf(pdf_path):
    """Analyze PDF using PyMuPDF to find form fields"""
    try:
        import fitz
        print(f"\n🔍 Analyzing {pdf_path} with PyMuPDF...")
        
        doc = fitz.open(pdf_path)
        print(f"   📄 Pages: {doc.page_count}")
        
        for page_num in range(doc.page_count):
            page = doc[page_num]
            print(f"\n   📋 Page {page_num + 1}:")
            
            # Check for form fields
            widgets = page.widgets()
            if widgets:
                print(f"      ✅ Found {len(widgets)} form fields:")
                for widget in widgets:
                    field_name = widget.field_name
                    field_type = widget.field_type_string
                    field_value = widget.field_value
                    rect = widget.rect
                    print(f"         • {field_name}: {field_type} at ({rect.x0:.1f}, {rect.y0:.1f})")
                    if field_value:
                        print(f"           Current value: '{field_value}'")
            else:
                print("      ❌ No form fields found")
            
            # Check for annotations
            annotations = page.annots()
            if annotations:
                print(f"      📝 Found {len(annotations)} annotations:")
                for annot in annotations:
                    print(f"         • {annot.type[1]}: {annot.info.get('content', 'No content')}")
        
        doc.close()
        return True
        
    except ImportError:
        print("❌ PyMuPDF not available")
        return False
    except Exception as e:
        print(f"❌ Error analyzing with PyMuPDF: {e}")
        return False

def analyze_pdf_with_pypdf(pdf_path):
    """Analyze PDF using PyPDF2/pypdf to find form fields"""
    try:
        import PyPDF2
        print(f"\n🔍 Analyzing {pdf_path} with PyPDF2...")
        
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            print(f"   📄 Pages: {len(pdf_reader.pages)}")
            
            # Check for form fields
            if pdf_reader.metadata:
                print(f"   📋 Metadata: {dict(pdf_reader.metadata)}")
            
            # Look for form fields in AcroForm
            if hasattr(pdf_reader, 'get_form_text_fields'):
                try:
                    fields = pdf_reader.get_form_text_fields()
                    if fields:
                        print(f"   ✅ Found {len(fields)} text fields:")
                        for field_name, field_value in fields.items():
                            print(f"      • {field_name}: '{field_value}'")
                    else:
                        print("   ❌ No text fields found")
                except Exception as e:
                    print(f"   ⚠️ Error getting form fields: {e}")
            
            # Try to get all form fields
            try:
                if '/AcroForm' in pdf_reader.trailer['/Root']:
                    print("   ✅ PDF contains AcroForm")
                    acro_form = pdf_reader.trailer['/Root']['/AcroForm']
                    if '/Fields' in acro_form:
                        fields = acro_form['/Fields']
                        print(f"   📝 Form has {len(fields)} field entries")
                else:
                    print("   ❌ No AcroForm found")
            except Exception as e:
                print(f"   ⚠️ Error checking AcroForm: {e}")
        
        return True
        
    except ImportError:
        print("❌ PyPDF2 not available")
        return False
    except Exception as e:
        print(f"❌ Error analyzing with PyPDF2: {e}")
        return False

def analyze_pdf_text_content(pdf_path):
    """Analyze PDF text content to identify potential form areas"""
    try:
        import fitz
        print(f"\n📝 Analyzing text content in {pdf_path}...")
        
        doc = fitz.open(pdf_path)
        
        for page_num in range(min(2, doc.page_count)):  # First 2 pages
            page = doc[page_num]
            text = page.get_text()
            
            print(f"\n   📋 Page {page_num + 1} text analysis:")
            
            # Look for common form patterns
            form_patterns = [
                'Name:', 'name:', 'NAME:',
                'Address:', 'address:', 'ADDRESS:',
                'Phone:', 'phone:', 'PHONE:',
                'Email:', 'email:', 'EMAIL:',
                'Date:', 'date:', 'DATE:',
                'Signature:', 'signature:', 'SIGNATURE:',
                'Rent:', 'rent:', 'RENT:',
                'Security:', 'security:', 'SECURITY:',
                'Unit:', 'unit:', 'UNIT:',
                'Apartment:', 'apartment:', 'APARTMENT:',
                'Lease:', 'lease:', 'LEASE:',
                '_____', '______', '_______'  # Blank lines
            ]
            
            found_patterns = []
            for pattern in form_patterns:
                if pattern in text:
                    # Count occurrences
                    count = text.count(pattern)
                    found_patterns.append(f"{pattern} ({count}x)")
            
            if found_patterns:
                print(f"      ✅ Found potential form fields:")
                for pattern in found_patterns:
                    print(f"         • {pattern}")
            else:
                print("      ❌ No obvious form patterns found")
            
            # Show first 500 characters as sample
            print(f"\n      📄 Sample text (first 300 chars):")
            print(f"         {text[:300].replace(chr(10), ' ').replace(chr(13), ' ')}...")
        
        doc.close()
        return True
        
    except Exception as e:
        print(f"❌ Error analyzing text content: {e}")
        return False

def main():
    """Main function to analyze both PDF templates"""
    print("🔍 PDF Form Field Analyzer")
    print("=" * 50)
    
    # Check if we're in the right directory
    current_dir = os.getcwd()
    print(f"📁 Current directory: {current_dir}")
    
    # Look for PDF files
    pdf_files = [
        "condo or apt.pdf",
        "single family or duplex.pdf"
    ]
    
    # Also check in Ownexa-JP subdirectory
    if os.path.exists("Ownexa-JP"):
        for pdf in pdf_files:
            if os.path.exists(f"Ownexa-JP/{pdf}"):
                pdf_files.append(f"Ownexa-JP/{pdf}")
    
    found_pdfs = []
    for pdf_file in pdf_files:
        if os.path.exists(pdf_file):
            found_pdfs.append(pdf_file)
            print(f"✅ Found: {pdf_file}")
        else:
            print(f"❌ Not found: {pdf_file}")
    
    if not found_pdfs:
        print("\n⚠️ No PDF templates found!")
        print("Please ensure the PDF files are in the current directory:")
        print("   • condo or apt.pdf")
        print("   • single family or duplex.pdf")
        return
    
    # Analyze each PDF
    for pdf_path in found_pdfs:
        print(f"\n{'='*60}")
        print(f"📄 ANALYZING: {pdf_path}")
        print(f"{'='*60}")
        
        # Try different analysis methods
        success_pymupdf = analyze_pdf_with_pymupdf(pdf_path)
        success_pypdf = analyze_pdf_with_pypdf(pdf_path)
        
        # Always try text analysis
        analyze_pdf_text_content(pdf_path)
        
        if not (success_pymupdf or success_pypdf):
            print("⚠️ Limited analysis - install PyMuPDF or PyPDF2 for better results")
    
    print(f"\n{'='*60}")
    print("📋 ANALYSIS COMPLETE")
    print("=" * 60)
    print("\n💡 Next Steps:")
    print("   1. If form fields were found, we can fill them directly")
    print("   2. If no form fields, we'll overlay text at specific coordinates")
    print("   3. Text patterns show us where to place customer information")

if __name__ == "__main__":
    main()
