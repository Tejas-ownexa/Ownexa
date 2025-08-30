#!/usr/bin/env python3

import requests
import json

# Test property creation
def test_property_creation():
    # First, get a token (you'll need to login first)
    login_data = {
        "username": "owner1",
        "password": "password123"
    }
    
    try:
        # Login to get token
        login_response = requests.post('http://localhost:5002/api/auth/token', json=login_data)
        print(f"Login response status: {login_response.status_code}")
        print(f"Login response text: {login_response.text}")
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.status_code}")
            return
        
        token = login_response.json().get('access_token')
        if not token:
            print("No token received")
            print("Response:", login_response.json())
            return
        
        print(f"Login successful, token: {token[:20]}...")
        
        # Test property creation
        property_data = {
            "title": "Test Property",
            "street_address_1": "123 Test St",
            "city": "Test City",
            "state": "TS",
            "zip_code": "12345",
            "description": "Test property description",
            "rent_amount": 1500.00,
            "status": "available"
        }
        
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        response = requests.post('http://localhost:5002/api/properties/add', 
                               json=property_data, 
                               headers=headers)
        
        print(f"Property creation response: {response.status_code}")
        print(f"Response body: {response.text}")
        
        if response.status_code == 201:
            print("Property created successfully!")
        else:
            print("Property creation failed!")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_property_creation()
