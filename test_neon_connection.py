#!/usr/bin/env python3
"""
Test Neon PostgreSQL Database Connection
This script tests the connection to your Neon database.
"""

import psycopg2
import sys

# Neon Database Connection Details
NEON_CONNECTION_STRING = "postgresql://neondb_owner:npg_GrOEbhSsxK89@ep-green-smoke-ae7q078i-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def test_connection():
    """Test connection to Neon database"""
    try:
        print("🔌 Testing connection to Neon database...")
        print(f"Host: ep-green-smoke-ae7q078i-pooler.c-2.us-east-2.aws.neon.tech")
        print(f"Database: neondb")
        print(f"User: neondb_owner")
        
        conn = psycopg2.connect(NEON_CONNECTION_STRING)
        cursor = conn.cursor()
        
        # Test basic connection
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✅ Connection successful!")
        print(f"PostgreSQL version: {version[0]}")
        
        # Test if tables exist
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        
        if tables:
            print(f"\n📋 Found {len(tables)} tables in the database:")
            for table in tables:
                print(f"   - {table[0]}")
        else:
            print("\n⚠️  No tables found in the database.")
            print("   Run upload_to_neon.py to create the tables.")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Testing Neon PostgreSQL Database Connection")
    print("=" * 50)
    
    success = test_connection()
    
    if success:
        print("\n✅ Connection test completed successfully!")
        print("\n📝 Your Neon database is ready to use!")
    else:
        print("\n❌ Connection test failed!")
        print("\n🔧 Troubleshooting:")
        print("1. Check your internet connection")
        print("2. Verify the connection string is correct")
        print("3. Ensure your Neon database is active")
        sys.exit(1)

if __name__ == "__main__":
    main()
