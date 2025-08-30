#!/usr/bin/env python3
"""
Simple test script to verify deployment configuration
"""

import os
from config import app, db

def test_database_connection():
    """Test database connection"""
    print("🔍 Testing database connection...")
    try:
        # Test basic database connection
        with app.app_context():
            # Try to execute a simple query
            result = db.session.execute('SELECT 1')
            print("✅ Database connection successful!")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False

def test_environment():
    """Test environment configuration"""
    print("\n🔍 Testing environment configuration...")
    
    # Check database URL
    db_url = os.getenv('NEON_DATABASE_URL')
    if db_url:
        print(f"✅ NEON_DATABASE_URL is set")
        # Mask the password for security
        masked_url = db_url.replace(db_url.split('@')[0].split(':')[-1], '***')
        print(f"   Database: {masked_url}")
    else:
        print("⚠️  NEON_DATABASE_URL not set, using fallback")
    
    # Check secret key
    secret_key = os.getenv('SECRET_KEY')
    if secret_key:
        print("✅ SECRET_KEY is set")
    else:
        print("⚠️  SECRET_KEY not set, using default")

def main():
    """Main test function"""
    print("🚀 Real Estate Management System - Simple Deployment Test")
    print("=" * 50)
    
    # Test environment
    test_environment()
    
    # Test database connection
    db_success = test_database_connection()
    
    print("\n" + "=" * 50)
    if db_success:
        print("✅ Database connection is working!")
        print("✅ Ready for deployment!")
    else:
        print("❌ Database connection failed!")
        print("❌ Please check your database configuration")
    
    print("\n📋 Next steps:")
    print("1. Deploy backend: vercel --prod")
    print("2. Deploy frontend: cd frontend && vercel --prod")
    print("3. Set environment variables in Vercel dashboard")
    print("4. Test the deployed application")

if __name__ == "__main__":
    main()
