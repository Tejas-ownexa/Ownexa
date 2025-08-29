#!/usr/bin/env python3
"""
Test single family house PDF generation
"""
import requests

# Test data for single family house
test_data = {
    'full_name': 'Jane Smith',
    'email': 'jane@example.com',
    'property_address': '456 Oak Avenue',
    'property_type': 'single family',
    'rent_amount': '1500.00'
}

try:
    print("🧪 Testing Single Family House PDF Generation...")
    response = requests.post('http://127.0.0.1:5001/api/pdf-generation/generate', json=test_data)
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Single family PDF generated successfully!")
        print(f"Form type: {result['form_type']}")
        print(f"Customer: {result['customer_name']}")
        print(f"Download URL: {result['download_url']}")
        print(f"File size: {result['file_size']} bytes")
    else:
        print(f"❌ Error: {response.status_code}")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"❌ Error: {e}")
