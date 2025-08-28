#!/usr/bin/env python3
"""
Database Schema Test Script
This script tests the database connection and verifies the schema from updated_database.sql
"""

import os
import sys
import sqlite3
import psycopg2
from urllib.parse import urlparse

def get_database_type():
    """Determine database type from config"""
    try:
        from config import app
        db_uri = app.config['SQLALCHEMY_DATABASE_URI']
        if 'sqlite' in db_uri.lower():
            return 'sqlite'
        elif 'postgresql' in db_uri.lower():
            return 'postgresql'
        else:
            return 'unknown'
    except Exception as e:
        print(f"⚠️  Could not determine database type: {e}")
        return 'sqlite'  # Default to SQLite

def test_sqlite_schema():
    """Test SQLite database schema"""
    db_path = 'ownexa.db'
    
    if not os.path.exists(db_path):
        print(f"❌ SQLite database file not found: {db_path}")
        return False
    
    try:
        print(f"🔌 Testing SQLite database: {db_path}")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print(f"📋 Found {len(tables)} tables:")
        for table in tables:
            print(f"   - {table[0]}")
        
        # Expected tables from updated_database.sql
        expected_tables = [
            'user', 'properties', 'tenants', 'rent_roll', 'outstanding_balances',
            'draft_leases', 'lease_renewals', 'vendors', 'maintenance_requests',
            'property_financials', 'loan_payments', 'financial_transactions',
            'associations', 'property_favorites', 'ownership_accounts',
            'association_memberships', 'association_balances', 'violations',
            'listings', 'applicants'
        ]
        
        # Check for missing tables
        existing_table_names = [table[0] for table in tables]
        missing_tables = [table for table in expected_tables if table not in existing_table_names]
        
        if missing_tables:
            print(f"\n⚠️  Missing tables: {missing_tables}")
            return False
        else:
            print(f"\n✅ All expected tables are present!")
        
        # Test a few key tables
        key_tables = ['user', 'properties', 'tenants', 'maintenance_requests']
        for table in key_tables:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                print(f"   📊 {table}: {count} records")
            except Exception as e:
                print(f"   ❌ Error querying {table}: {e}")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing SQLite database: {e}")
        return False

def test_postgresql_schema():
    """Test PostgreSQL database schema"""
    # Neon PostgreSQL Database Configuration
    NEON_CONNECTION_STRING = "postgresql://neondb_owner:npg_GrOEbhSsxK89@ep-green-smoke-ae7q078i-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    
    try:
        print("🔌 Testing Neon PostgreSQL database...")
        conn = psycopg2.connect(NEON_CONNECTION_STRING)
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """)
        tables = cursor.fetchall()
        
        print(f"📋 Found {len(tables)} tables:")
        for table in tables:
            print(f"   - {table[0]}")
        
        # Expected tables from updated_database.sql
        expected_tables = [
            'user', 'properties', 'tenants', 'rent_roll', 'outstanding_balances',
            'draft_leases', 'lease_renewals', 'vendors', 'maintenance_requests',
            'property_financials', 'loan_payments', 'financial_transactions',
            'associations', 'property_favorites', 'ownership_accounts',
            'association_memberships', 'association_balances', 'violations',
            'listings', 'applicants'
        ]
        
        # Check for missing tables
        existing_table_names = [table[0] for table in tables]
        missing_tables = [table for table in expected_tables if table not in existing_table_names]
        
        if missing_tables:
            print(f"\n⚠️  Missing tables: {missing_tables}")
            return False
        else:
            print(f"\n✅ All expected tables are present!")
        
        # Check for views
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        views = cursor.fetchall()
        
        if views:
            print(f"\n📋 Found {len(views)} views:")
            for view in views:
                print(f"   - {view[0]}")
        
        # Test a few key tables
        key_tables = ['user', 'properties', 'tenants', 'maintenance_requests']
        for table in key_tables:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                print(f"   📊 {table}: {count} records")
            except Exception as e:
                print(f"   ❌ Error querying {table}: {e}")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing PostgreSQL database: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 Database Schema Test")
    print("=" * 30)
    
    # Determine database type
    db_type = get_database_type()
    print(f"📊 Database type detected: {db_type}")
    
    # Run appropriate test
    if db_type == 'sqlite':
        success = test_sqlite_schema()
    elif db_type == 'postgresql':
        success = test_postgresql_schema()
    else:
        print("❌ Unknown database type")
        sys.exit(1)
    
    if success:
        print("\n🎉 Database schema test passed!")
        print("✅ All tables are properly created")
        print("✅ Database is ready for use")
    else:
        print("\n❌ Database schema test failed!")
        print("⚠️  Some tables may be missing or corrupted")
        sys.exit(1)

if __name__ == "__main__":
    main()
