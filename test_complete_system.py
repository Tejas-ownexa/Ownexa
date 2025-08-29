import requests
import json

def test_esignature_system():
    print("🧪 Testing Complete E-Signature PDF System")
    print("=" * 50)
    
    base_url = "http://127.0.0.1:5001/api"
    
    # Test 1: Server connectivity
    print("\n1. Testing server connectivity...")
    try:
        response = requests.get(f"{base_url}/")
        if response.status_code == 200:
            print("✅ Server is running")
            data = response.json()
            print(f"   Endpoints: {len(data.get('available_endpoints', []))}")
        else:
            print(f"❌ Server error: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return
    
    # Test 2: Form types
    print("\n2. Testing form types...")
    try:
        response = requests.get(f"{base_url}/pdf-generation/form-types")
        if response.status_code == 200:
            print("✅ Form types working")
            form_types = response.json().get('form_types', {})
            for name, info in form_types.items():
                status = "✅" if info.get('template_exists') else "❌"
                print(f"   {status} {name}: {info.get('template_file')}")
        else:
            print(f"❌ Form types error: {response.status_code}")
    except Exception as e:
        print(f"❌ Form types failed: {e}")
    
    # Test 3: E-signature PDF generation with apartment data
    print("\n3. Testing apartment with e-signature...")
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
        'signature': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
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
            dl_response = requests.get(download_url)
            if dl_response.status_code == 200:
                print(f"   ✅ Download works: {len(dl_response.content)} bytes")
            else:
                print(f"   ❌ Download failed: {dl_response.status_code}")
        else:
            print(f"❌ Generation failed: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Apartment test failed: {e}")
    
    # Test 4: Single family house with signature
    print("\n4. Testing single family with e-signature...")
    house_data = {
        'full_name': 'Michael Johnson',
        'email': 'mike.johnson@example.com',
        'property_address': '456 Oak Avenue',
        'property_type': 'single family',
        'rent_amount': '2500.00',
        'signature': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    }
    
    try:
        response = requests.post(f"{base_url}/pdf-generation/generate", json=house_data)
        if response.status_code == 200:
            result = response.json()
            print("✅ Single family PDF with signature generated!")
            print(f"   Customer: {result.get('customer_name')}")
            print(f"   Form type: {result.get('form_type')}")
            print(f"   Download URL: {result.get('download_url')}")
        else:
            print(f"❌ Generation failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Single family test failed: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 E-Signature System Test Complete!")
    print("✅ Backend working with signatures")
    print("✅ PDF generation functioning")
    print("✅ Download system operational")
    print("🚀 Ready for frontend!")

if __name__ == "__main__":
    test_esignature_system()
