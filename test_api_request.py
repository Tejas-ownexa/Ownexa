import requests
import json
from config import app

def test_api_request():
    try:
        print("Testing API Request...")
        
        # First, let's test if the Flask app is running and accessible
        print("\n1. Testing if Flask app is accessible...")
        
        # We'll test this by starting the app in test mode
        with app.test_client() as client:
            # Test root endpoint first
            print("Testing root endpoint...")
            response = client.get('/')
            print(f"Root endpoint status: {response.status_code}")
            print(f"Root response: {response.get_json()}")
            
            # Test if we need authentication first
            print("\n2. Testing prorated rent endpoint without auth...")
            response = client.post('/api/tenants/calculate-prorated-rent', 
                                 json={
                                     'propertyId': 1,
                                     'leaseStartDate': '2025-09-01',
                                     'rentPaymentDay': 10
                                 })
            print(f"Without auth status: {response.status_code}")
            print(f"Without auth response: {response.get_json()}")
            
            # We need to get a token first
            print("\n3. Getting authentication token...")
            
            # Try to login to get a token
            login_response = client.post('/api/auth/login',
                                       json={
                                           'email': 'abc12@gmail.com',  # Use the test user
                                           'password': 'password123'
                                       })
            print(f"Login status: {login_response.status_code}")
            login_data = login_response.get_json()
            print(f"Login response: {login_data}")
            
            if login_response.status_code == 200 and 'token' in login_data:
                token = login_data['token']
                print(f"Got token: {token[:50]}...")
                
                # Now test with authentication
                print("\n4. Testing prorated rent endpoint with auth...")
                headers = {'Authorization': f'Bearer {token}'}
                response = client.post('/api/tenants/calculate-prorated-rent',
                                     json={
                                         'propertyId': 1,
                                         'leaseStartDate': '2025-09-01',
                                         'rentPaymentDay': 10
                                     },
                                     headers=headers)
                
                print(f"With auth status: {response.status_code}")
                response_data = response.get_json()
                print(f"With auth response: {json.dumps(response_data, indent=2)}")
                
                if response.status_code == 200:
                    print("✅ API endpoint is working correctly!")
                else:
                    print(f"❌ API endpoint failed with status {response.status_code}")
                    print(f"Error: {response_data}")
            else:
                print("❌ Failed to get authentication token")
                print("Available users for testing:")
                
                # Let's check what users exist
                from models.user import User
                with app.app_context():
                    users = User.query.all()
                    for user in users:
                        print(f"  - {user.email} (Role: {user.role})")
        
        print(f"\n✅ API request test completed!")
        
    except Exception as e:
        print(f"❌ Error testing API request: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_api_request()
