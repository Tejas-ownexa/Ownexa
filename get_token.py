#!/usr/bin/env python3
import requests
import json

def get_auth_token():
    """Get a fresh authentication token"""
    login_url = "http://localhost:5002/api/auth/token"
    
    # Try with the known user credentials
    login_data = {
        "username": "jp201@gmail.com",  # Using email as username
        "password": "password123"  # This might need to be updated with the actual password
    }
    
    try:
        response = requests.post(login_url, json=login_data)
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            print(f"✅ Login successful!")
            print(f"🔑 Token: {token}")
            print(f"👤 User: {data.get('user', {}).get('full_name', 'Unknown')}")
            return token
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error during login: {e}")
        return None

if __name__ == "__main__":
    print("🔐 Getting fresh authentication token...")
    token = get_auth_token()
    
    if token:
        print("\n📋 Test the admin bot with this token:")
        print(f"curl -X POST http://localhost:5002/api/admin-bot/admin-chat \\")
        print(f"  -H \"Content-Type: application/json\" \\")
        print(f"  -H \"Authorization: Bearer {token}\" \\")
        print(f"  -d '{{\"query\": \"property report\"}}'")
    else:
        print("\n❌ Could not get token. Please check your credentials.")
