#!/usr/bin/env python3
"""
Fixed PDF Analyzer - handles import issues
"""
import sys
import os

def test_imports():
    """Test all PDF library imports"""
    print("🔍 Testing PDF Library Imports")
    print("=" * 40)
    print(f"Python executable: {sys.executable}")
    print(f"Current working directory: {os.getcwd()}")
    
    # Test PyMuPDF
    try:
        import fitz
        print("✅ PyMuPDF (fitz) imported successfully")
        print(f"   PyMuPDF version: {fitz.__doc__[:50] if hasattr(fitz, '__doc__') else 'Unknown'}")
        pymupdf_available = True
    except ImportError as e:
        print(f"❌ PyMuPDF import failed: {e}")
        pymupdf_available = False
    except Exception as e:
        print(f"❌ PyMuPDF error: {e}")
        pymupdf_available = False
    
    # Test PyPDF2
    try:
        import PyPDF2
        print("✅ PyPDF2 imported successfully")
        print(f"   PyPDF2 version: {PyPDF2.__version__ if hasattr(PyPDF2, '__version__') else 'Unknown'}")
        pypdf2_available = True
    except ImportError as e:
        print(f"❌ PyPDF2 import failed: {e}")
        pypdf2_available = False
    except Exception as e:
        print(f"❌ PyPDF2 error: {e}")
        pypdf2_available = False
    
    # Test ReportLab
    try:
        from reportlab.pdfgen import canvas
        print("✅ ReportLab imported successfully")
        reportlab_available = True
    except ImportError as e:
        print(f"❌ ReportLab import failed: {e}")
        reportlab_available = False
    except Exception as e:
        print(f"❌ ReportLab error: {e}")
        reportlab_available = False
    
    return pymupdf_available, pypdf2_available, reportlab_available

def analyze_pdf_simple(pdf_path):
    """Simple PDF analysis without heavy dependencies"""
    print(f"\n📄 Basic Analysis: {pdf_path}")
    
    if not os.path.exists(pdf_path):
        print(f"❌ File not found: {pdf_path}")
        return
    
    # Get file size
    file_size = os.path.getsize(pdf_path)
    print(f"   📊 File size: {file_size:,} bytes")
    
    # Try to read first few bytes to confirm it's a PDF
    try:
        with open(pdf_path, 'rb') as f:
            header = f.read(8)
            if header.startswith(b'%PDF'):
                version = header.decode('ascii', errors='ignore')
                print(f"   ✅ Valid PDF file: {version}")
            else:
                print(f"   ❌ Not a valid PDF file")
                return
    except Exception as e:
        print(f"   ❌ Error reading file: {e}")
        return
    
    # Try PyMuPDF analysis
    try:
        import fitz
        print(f"   🔍 Analyzing with PyMuPDF...")
        doc = fitz.open(pdf_path)
        print(f"      📄 Pages: {doc.page_count}")
        
        for page_num in range(min(2, doc.page_count)):
            page = doc[page_num]
            print(f"      📋 Page {page_num + 1}:")
            
            # Check for widgets (form fields)
            widgets = page.widgets()
            if widgets:
                print(f"         ✅ Found {len(widgets)} form fields:")
                for i, widget in enumerate(widgets[:5]):  # Show first 5
                    field_name = widget.field_name or f"field_{i}"
                    field_type = widget.field_type_string
                    rect = widget.rect
                    print(f"            • {field_name}: {field_type} at ({rect.x0:.0f}, {rect.y0:.0f})")
            else:
                print(f"         ❌ No form fields found")
            
            # Get text sample
            text = page.get_text()
            if text:
                # Look for common form patterns
                patterns = ['Name:', 'Address:', 'Phone:', 'Email:', 'Date:', 'Signature:', 'Rent:']
                found = [p for p in patterns if p.lower() in text.lower()]
                if found:
                    print(f"         📝 Found patterns: {', '.join(found)}")
                
                # Show sample text
                sample = text[:200].replace('\n', ' ').strip()
                if sample:
                    print(f"         📄 Sample: {sample[:100]}...")
            
        doc.close()
        return True
        
    except ImportError:
        print(f"   ⚠️ PyMuPDF not available for detailed analysis")
    except Exception as e:
        print(f"   ❌ PyMuPDF analysis failed: {e}")
    
    # Try PyPDF2 analysis
    try:
        import PyPDF2
        print(f"   🔍 Analyzing with PyPDF2...")
        
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            print(f"      📄 Pages: {len(reader.pages)}")
            
            # Check for form fields
            if hasattr(reader, 'get_form_text_fields'):
                try:
                    fields = reader.get_form_text_fields()
                    if fields:
                        print(f"      ✅ Found {len(fields)} text fields:")
                        for name, value in list(fields.items())[:5]:
                            print(f"         • {name}: '{value}'")
                    else:
                        print(f"      ❌ No text fields found")
                except Exception as e:
                    print(f"      ⚠️ Error getting fields: {e}")
        
        return True
        
    except ImportError:
        print(f"   ⚠️ PyPDF2 not available")
    except Exception as e:
        print(f"   ❌ PyPDF2 analysis failed: {e}")
    
    return False

def main():
    """Main analysis function"""
    print("🔍 Fixed PDF Form Field Analyzer")
    print("=" * 50)
    
    # Test imports first
    pymupdf_ok, pypdf2_ok, reportlab_ok = test_imports()
    
    if not (pymupdf_ok or pypdf2_ok):
        print("\n⚠️ No PDF libraries available for analysis")
        print("Your PDFs exist but cannot be analyzed in detail.")
        print("The basic PDF generator will still work for creating new PDFs.")
        return
    
    # Find PDF files
    pdf_files = ["condo or apt.pdf", "single family or duplex.pdf"]
    found_pdfs = [pdf for pdf in pdf_files if os.path.exists(pdf)]
    
    if not found_pdfs:
        print("\n❌ No PDF templates found!")
        return
    
    print(f"\n📁 Found {len(found_pdfs)} PDF templates")
    
    # Analyze each PDF
    for pdf_path in found_pdfs:
        analyze_pdf_simple(pdf_path)
    
    print(f"\n{'='*50}")
    print("📋 ANALYSIS COMPLETE")
    print("=" * 50)
    
    if pymupdf_ok or pypdf2_ok:
        print("✅ PDF analysis successful!")
        print("💡 You can now use the enhanced PDF filler")
    else:
        print("⚠️ Limited analysis - but basic PDF generation still works")

if __name__ == "__main__":
    main()
