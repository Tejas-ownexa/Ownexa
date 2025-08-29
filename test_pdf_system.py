import requests
import json

def test_pdf_detection():
    try:
        print('🧪 Testing PDF Detection API...')
        
        test_data = {
            "test_cases": [
                {"property_address": "123 Main St, Apt 4B", "property_type": "apartment"},
                {"property_address": "456 Oak Avenue", "property_type": "single family"},
                {"property_address": "789 Pine St, Unit 12", "property_type": "condo"}
            ]
        }
        
        response = requests.post("http://127.0.0.1:5001/api/pdf-generation/test-detection", 
                               json=test_data)
        
        if response.status_code == 200:
            print("✅ PDF Detection API working!")
            result = response.json()
            for test_result in result["test_results"]:
                print(f"Input: {test_result['input']}")
                print(f"Detected: {test_result['detected_form_type']}")
                print(f"Template: {test_result['would_use_template']}")
                print("---")
        else:
            print(f"❌ API Error: {response.status_code} - {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Flask server not running. Start with: py app.py")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_pdf_generation():
    try:
        print("\n🧪 Testing PDF Generation API...")
        
        test_data = {
            "full_name": "John Doe",
            "email": "john.doe@example.com",
            "property_address": "123 Main St, Apt 4B",
            "unit_number": "4B",
            "rent_amount": "1200.00",
            "lease_start": "2024-03-01",
            "signature": "test_signature_data"
        }
        
        response = requests.post("http://127.0.0.1:5001/api/pdf-generation/generate", 
                               json=test_data)
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("✅ PDF Generation working!")
            print(f"Form type: {result.get('form_type')}")
            print(f"Message: {result.get('message')}")
            print(f"Customer: {result.get('customer_name')}")
            if "file_size" in result:
                print(f"File size: {result.get('file_size')} bytes")
            if "download_url" in result:
                print(f"Download URL: {result.get('download_url')}")
        else:
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_form_types():
    try:
        print("\n🧪 Testing Form Types API...")
        
        response = requests.get("http://127.0.0.1:5001/api/pdf-generation/form-types")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Form Types API working!")
            for form_type, info in result["form_types"].items():
                print(f"{form_type}: {info['description']}")
                print(f"  Template: {info['template_file']}")
                print(f"  Exists: {info['template_exists']}")
        else:
            print(f"❌ API Error: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_basic_server():
    try:
        print("🧪 Testing Basic Flask Server...")
        
        response = requests.get("http://127.0.0.1:5001/")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Flask server working!")
            print(f"Message: {result.get('message')}")
            print(f"Version: {result.get('version')}")
            if 'available_endpoints' in result:
                print("Available endpoints:")
                for name, url in result['available_endpoints'].items():
                    print(f"  {name}: {url}")
        else:
            print(f"❌ Server Error: {response.status_code} - {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Flask server not running. Start with: py app.py")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("=== PDF System Test Suite ===")
    test_basic_server()
    test_form_types()
    test_pdf_detection()
    test_pdf_generation()
    print("\n=== Test Complete ===")
