#!/usr/bin/env python3
"""
Test script to verify deployment configuration
"""

import os
import sys
import requests
from config import app, db
from models import User, Property, Tenant

def test_database_connection():
    """Test database connection"""
    print("🔍 Testing database connection...")
    try:
        # Test basic database connection
        with app.app_context():
            # Try to query the database
            user_count = User.query.count()
            property_count = Property.query.count()
            tenant_count = Tenant.query.count()
            
            print(f"✅ Database connection successful!")
            print(f"   - Users: {user_count}")
            print(f"   - Properties: {property_count}")
            print(f"   - Tenants: {tenant_count}")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False

def test_api_endpoints(base_url):
    """Test API endpoints"""
    print(f"\n🔍 Testing API endpoints at {base_url}...")
    
    endpoints = [
        ('/', 'GET', 'Root endpoint'),
        ('/api/auth/register', 'POST', 'Registration endpoint'),
        ('/api/properties', 'GET', 'Properties endpoint'),
        ('/api/tenants', 'GET', 'Tenants endpoint'),
    ]
    
    for endpoint, method, description in endpoints:
        try:
            url = f"{base_url}{endpoint}"
            if method == 'GET':
                response = requests.get(url, timeout=10)
            else:
                response = requests.post(url, timeout=10)
            
            if response.status_code in [200, 201, 401, 404]:  # Acceptable responses
                print(f"✅ {description}: {response.status_code}")
            else:
                print(f"⚠️  {description}: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ {description}: Connection failed - {str(e)}")

def main():
    """Main test function"""
    print("🚀 Real Estate Management System - Deployment Test")
    print("=" * 50)
    
    # Test database connection
    db_success = test_database_connection()
    
    # Test API endpoints
    base_url = os.getenv('API_BASE_URL', 'http://localhost:5001')
    test_api_endpoints(base_url)
    
    print("\n" + "=" * 50)
    if db_success:
        print("✅ Database connection is working!")
    else:
        print("❌ Database connection failed!")
    
    print("\n📋 Next steps:")
    print("1. Deploy backend: vercel --prod")
    print("2. Deploy frontend: cd frontend && vercel --prod")
    print("3. Set environment variables in Vercel dashboard")
    print("4. Test the deployed application")

if __name__ == "__main__":
    main()

