#!/usr/bin/env python3
"""
Check what tables exist in the Neon database
"""

import psycopg2
import os

# Neon database connection string
NEON_CONNECTION_STRING = "postgresql://neondb_owner:npg_V8OySJF5njdT@ep-summer-sky-adwixnct-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def check_tables():
    """Check what tables exist in the database"""
    try:
        print("🔍 Checking tables in Neon database...")
        conn = psycopg2.connect(NEON_CONNECTION_STRING)
        cursor = conn.cursor()

        # Query to check all tables
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)

        tables = cursor.fetchall()

        if tables:
            print(f"📋 Found {len(tables)} tables in database:")
            for table in tables:
                print(f"  • {table[0]}")

            # Check if our expected tables exist
            expected_tables = [
                'user', 'properties', 'tenants', 'maintenance_requests',
                'vendors', 'property_financials', 'financial_transactions'
            ]

            found_tables = [table[0] for table in tables]
            missing_tables = [t for t in expected_tables if t not in found_tables]

            if missing_tables:
                print(f"\n⚠️  Missing expected tables: {', '.join(missing_tables)}")
                return False
            else:
                print("\n✅ All expected tables are present!")
                return True
        else:
            print("⚠️  No tables found in database")
            return False

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"❌ Error checking tables: {e}")
        return False

def get_table_details():
    """Get details about each table"""
    try:
        print("\n📊 Getting table details...")
        conn = psycopg2.connect(NEON_CONNECTION_STRING)
        cursor = conn.cursor()

        # Get table row counts
        cursor.execute("""
            SELECT
                schemaname,
                tablename,
                tableowner
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename;
        """)

        tables = cursor.fetchall()

        for table in tables:
            print(f"\n📋 Table: {table[1]}")
            print(f"   Owner: {table[2]}")

            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table[1]}")
            count = cursor.fetchone()[0]
            print(f"   Rows: {count}")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"❌ Error getting table details: {e}")

def main():
    """Main function"""
    print("🔍 Neon Database Table Check")
    print("=" * 40)

    if check_tables():
        get_table_details()
        print("\n🎉 Your Neon database is properly configured!")
    else:
        print("\n⚠️  Some tables may be missing. Database needs setup.")

if __name__ == "__main__":
    main()
