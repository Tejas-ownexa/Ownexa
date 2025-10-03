#!/usr/bin/env python3
"""
Script to reset database connection and clear failed transactions
Run this if you're experiencing "current transaction is aborted" errors
"""

import os
import sys
import requests
import time

def reset_database_connection():
    """Reset the database connection via the API endpoint"""
    try:
        # Try to reset via API endpoint
        response = requests.post('http://localhost:5002/api/db/reset', timeout=10)
        if response.status_code == 200:
            print("✅ Database connection reset successfully via API")
            return True
        else:
            print(f"❌ API reset failed: {response.status_code} - {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Could not connect to API: {e}")
        return False

def check_database_health():
    """Check if the database is healthy"""
    try:
        response = requests.get('http://localhost:5002/api/db/health', timeout=10)
        if response.status_code == 200:
            print("✅ Database is healthy")
            return True
        else:
            print(f"❌ Database health check failed: {response.status_code} - {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Could not check database health: {e}")
        return False

def main():
    print("🔧 Database Connection Reset Tool")
    print("=" * 40)
    
    # Check if Flask app is running
    print("1. Checking if Flask app is running...")
    if not check_database_health():
        print("❌ Flask app is not running or database is unhealthy")
        print("   Please start the Flask app first with: python app.py")
        return
    
    # Reset the connection
    print("\n2. Resetting database connection...")
    if reset_database_connection():
        print("\n3. Verifying reset...")
        time.sleep(2)  # Wait a moment for the reset to take effect
        
        if check_database_health():
            print("\n🎉 Database connection reset completed successfully!")
            print("   You can now try your operations again.")
        else:
            print("\n⚠️  Reset completed but database health check failed.")
            print("   You may need to restart the Flask application.")
    else:
        print("\n❌ Failed to reset database connection.")
        print("   Try restarting the Flask application manually.")

if __name__ == "__main__":
    main()
