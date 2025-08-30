#!/usr/bin/env python3
"""
Test the deployed backend API to ensure it can connect to Neon database
"""

import requests
import json

# Backend API URL
API_BASE_URL = "https://test-flask-amtt3avhk-tejas-1588s-projects.vercel.app"

def test_api_connection():
    """Test basic API connection"""
    try:
        print("🔍 Testing API connection...")
        response = requests.get(f"{API_BASE_URL}/")

        if response.status_code == 200:
            data = response.json()
            print("✅ API connection successful!")
            print(f"   Response: {data}")
            return True
        else:
            print(f"❌ API returned status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API connection failed: {e}")
        return False

def test_database_connection():
    """Test if the API can connect to the database"""
    try:
        print("\n🔍 Testing database connection through API...")

        # Test user registration (this will test database write)
        test_user = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "TestPassword123!",
            "first_name": "Test",
            "last_name": "User",
            "role": "OWNER",
            "street_address_1": "123 Test St",
            "city": "Test City",
            "state": "TX",
            "zip_code": "12345"
        }

        response = requests.post(
            f"{API_BASE_URL}/api/auth/register",
            json=test_user,
            headers={"Content-Type": "application/json"}
        )

        if response.status_code == 201:
            print("✅ Database write test successful!")
            data = response.json()
            print(f"   User created with ID: {data.get('user_id')}")
            return True
        elif response.status_code == 400 and "already exists" in response.text:
            print("✅ Database connection working (user already exists)")
            return True
        else:
            print(f"❌ Database test failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False

def test_property_creation():
    """Test property creation"""
    try:
        print("\n🔍 Testing property creation...")

        # First, login to get token
        login_data = {
            "username": "testuser",
            "password": "TestPassword123!"
        }

        login_response = requests.post(
            f"{API_BASE_URL}/api/auth/token",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )

        if login_response.status_code != 200:
            print("⚠️  Could not login to test property creation")
            return False

        token = login_response.json().get("access_token")
        if not token:
            print("⚠️  No token received")
            return False

        # Create a test property
        property_data = {
            "title": "Test Property",
            "rent_amount": 2500.00,
            "street_address_1": "456 Test Ave",
            "city": "Test City",
            "state": "TX",
            "zip_code": "12345",
            "description": "A test property for API testing"
        }

        response = requests.post(
            f"{API_BASE_URL}/api/properties/add",
            json=property_data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}"
            }
        )

        if response.status_code == 200:
            print("✅ Property creation test successful!")
            data = response.json()
            print(f"   Property created with ID: {data.get('property_id')}")
            return True
        else:
            print(f"❌ Property creation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Property creation test failed: {e}")
        return False

def test_csv_pipeline():
    """Test CSV import pipeline"""
    try:
        print("\n🔍 Testing CSV import pipeline...")

        # Test the pipeline status endpoint
        response = requests.get(
            f"{API_BASE_URL}/api/pipeline/status",
            headers={"Content-Type": "application/json"}
        )

        if response.status_code == 200:
            print("✅ CSV pipeline test successful!")
            data = response.json()
            print(f"   Available import types: {len(data.get('import_types', []))}")
            for import_type in data.get('import_types', []):
                status = "✅" if import_type.get('available') else "❌"
                print(f"     {status} {import_type.get('name')}")
            return True
        else:
            print(f"❌ CSV pipeline test failed: {response.status_code}")
            return False

    except Exception as e:
        print(f"❌ CSV pipeline test failed: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 Testing Ownexa Backend API")
    print("=" * 40)

    results = []

    # Test API connection
    results.append(test_api_connection())

    # Test database connection
    results.append(test_database_connection())

    # Test property creation
    results.append(test_property_creation())

    # Test CSV pipeline
    results.append(test_csv_pipeline())

    # Summary
    print("\n" + "=" * 40)
    print("📊 Test Results Summary:")
    print(f"   API Connection: {'✅ PASS' if results[0] else '❌ FAIL'}")
    print(f"   Database Connection: {'✅ PASS' if results[1] else '❌ FAIL'}")
    print(f"   Property Creation: {'✅ PASS' if results[2] else '❌ FAIL'}")
    print(f"   CSV Pipeline: {'✅ PASS' if results[3] else '❌ FAIL'}")

    passed = sum(results)
    total = len(results)

    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        print("   Your Neon database and API are working perfectly!")
        print("   ✅ Ready for production use!")
        print(f"\n🚀 Your application URLs:")
        print(f"   Frontend: https://frontend-jvvd0f69d-tejas-1588s-projects.vercel.app")
        print(f"   Backend API: {API_BASE_URL}")
    else:
        print(f"\n⚠️  {passed}/{total} tests passed")
        print("   Some issues detected - please check the logs above")

if __name__ == "__main__":
    main()
