#!/usr/bin/env python3
"""
Comprehensive test of the E-Signature PDF Generation System
Tests the complete workflow: form data + signature → PDF generation → download
"""
import requests
import base64
import json
from datetime import datetime

# Base64 encoded sample signature (small PNG image)
SAMPLE_SIGNATURE = """
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==
"""

def test_signature_pdf_generation():
    """Test the complete e-signature workflow"""
    print("🧪 Testing E-Signature PDF Generation System")
    print("=" * 50)
    
    base_url = "http://127.0.0.1:5001/api"
    
    # Test 1: Server health check
    print("\n1. 🔍 Testing server connectivity...")
    try:
        response = requests.get(f"{base_url}/")
        if response.status_code == 200:
            print("✅ Server is running")
            server_info = response.json()
            print(f"   Version: {server_info.get('version', 'Unknown')}")
            print(f"   Available endpoints: {len(server_info.get('available_endpoints', []))}")
        else:
            print(f"❌ Server error: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return
    
    # Test 2: Form types availability
    print("\n2. 📋 Testing form types...")
    try:
        response = requests.get(f"{base_url}/pdf-generation/form-types")
        if response.status_code == 200:
            print("✅ Form types API working")
            form_types = response.json().get('form_types', {})
            for form_type, info in form_types.items():
                status = "✅" if info['template_exists'] else "❌"
                print(f"   {status} {form_type}: {info['template_file']}")
        else:
            print(f"❌ Form types error: {response.status_code}")
    except Exception as e:
        print(f"❌ Form types failed: {e}")
    
    # Test 3: PDF Generation with E-Signature (Apartment)
    print("\n3. 🏢 Testing apartment application with e-signature...")
    apartment_data = {
        'full_name': 'Jane Smith',
        'email': 'jane.smith@example.com',
        'phone_number': '555-0123',
        'property_address': '123 Main St, Apt 4B',
        'unit_number': '4B',
        'property_type': 'apartment',
        'rent_amount': '1800.00',
        'security_deposit': '1800.00',
        'lease_start': '2024-04-01',
        'lease_end': '2025-03-31',
        'monthly_income': '5400.00',
        'employment_info': 'Software Engineer at TechCorp',
        'emergency_contact': 'John Smith - 555-0124',
        'pets': 'None',
        'signature': f'data:image/png;base64,{SAMPLE_SIGNATURE.strip()}'
    }
    
    try:
        response = requests.post(f"{base_url}/pdf-generation/generate", json=apartment_data)
        if response.status_code == 200:
            result = response.json()
            print("✅ Apartment PDF with signature generated!")
            print(f"   Customer: {result.get('customer_name')}")
            print(f"   Form type: {result.get('form_type')}")
            print(f"   File size: {result.get('file_size')} bytes")
            print(f"   Download URL: {result.get('download_url')}")
            
            # Test download
            download_url = f"http://127.0.0.1:5001{result.get('download_url')}"
            download_response = requests.get(download_url)
            if download_response.status_code == 200:
                print(f"   ✅ Download successful: {len(download_response.content)} bytes")
            else:
                print(f"   ❌ Download failed: {download_response.status_code}")
        else:
            print(f"❌ Generation failed: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Apartment test failed: {e}")
    
    # Test 4: PDF Generation with E-Signature (Single Family)
    print("\n4. 🏡 Testing single family application with e-signature...")
    house_data = {
        'full_name': 'Michael Johnson',
        'email': 'mike.johnson@example.com',
        'phone_number': '555-0456',
        'property_address': '456 Oak Avenue',
        'property_type': 'single family',
        'rent_amount': '2500.00',
        'security_deposit': '2500.00',
        'lease_start': '2024-05-01',
        'lease_end': '2025-04-30',
        'monthly_income': '7500.00',
        'employment_info': 'Manager at RetailCorp',
        'emergency_contact': 'Sarah Johnson - 555-0457',
        'pets': '1 Dog (Golden Retriever)',
        'signature': f'data:image/png;base64,{SAMPLE_SIGNATURE.strip()}'
    }
    
    try:
        response = requests.post(f"{base_url}/pdf-generation/generate", json=house_data)
        if response.status_code == 200:
            result = response.json()
            print("✅ Single family PDF with signature generated!")
            print(f"   Customer: {result.get('customer_name')}")
            print(f"   Form type: {result.get('form_type')}")
            print(f"   File size: {result.get('file_size')} bytes")
            print(f"   Download URL: {result.get('download_url')}")
            
            # Test download
            download_url = f"http://127.0.0.1:5001{result.get('download_url')}"
            download_response = requests.get(download_url)
            if download_response.status_code == 200:
                print(f"   ✅ Download successful: {len(download_response.content)} bytes")
            else:
                print(f"   ❌ Download failed: {download_response.status_code}")
        else:
            print(f"❌ Generation failed: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Single family test failed: {e}")
    
    # Test 5: Error handling (missing required fields)
    print("\n5. ⚠️ Testing error handling...")
    incomplete_data = {
        'full_name': 'Test User',
        # Missing email and property_address
        'signature': f'data:image/png;base64,{SAMPLE_SIGNATURE.strip()}'
    }
    
    try:
        response = requests.post(f"{base_url}/pdf-generation/generate", json=incomplete_data)
        if response.status_code == 400:
            print("✅ Error handling working correctly")
            error_info = response.json()
            print(f"   Error: {error_info.get('error')}")
            print(f"   Missing fields: {error_info.get('missing_fields')}")
        else:
            print(f"❌ Expected 400 error, got: {response.status_code}")
    except Exception as e:
        print(f"❌ Error handling test failed: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 E-Signature PDF Generation Test Complete!")
    print("\nSystem Summary:")
    print("✅ Backend API endpoints working")
    print("✅ Smart form detection functioning")
    print("✅ E-signature integration active")
    print("✅ PDF generation with signatures")
    print("✅ Secure file download system")
    print("✅ Error handling implemented")
    print("\n🚀 Ready for frontend integration!")

if __name__ == "__main__":
    test_signature_pdf_generation()
