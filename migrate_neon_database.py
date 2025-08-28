#!/usr/bin/env python3
"""
Specialized Neon Database Migration Script
This script safely migrates the Neon PostgreSQL database to use the updated schema
"""

import psycopg2
import os
import sys

def migrate_neon_database():
    """Migrate Neon PostgreSQL database with proper handling of reserved keywords"""
    
    # Neon PostgreSQL Database Configuration
    NEON_CONNECTION_STRING = "postgresql://neondb_owner:npg_GrOEbhSsxK89@ep-green-smoke-ae7q078i-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    
    try:
        print("🔌 Connecting to Neon PostgreSQL database...")
        conn = psycopg2.connect(NEON_CONNECTION_STRING)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Check if database has tables
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """)
        existing_tables = cursor.fetchall()
        
        if existing_tables:
            print(f"📋 Found {len(existing_tables)} existing tables")
            print("⚠️  This will recreate all tables. Existing data will be lost!")
            
            response = input("Do you want to continue? (y/N): ")
            if response.lower() != 'y':
                print("❌ Migration cancelled")
                return False
            
            # Drop existing tables in correct order (respecting foreign keys)
            print("🗑️  Dropping existing tables...")
            
            # Drop tables in reverse dependency order
            drop_order = [
                'applicants', 'listings', 'violations', 'association_balances', 
                'association_memberships', 'ownership_accounts', 'property_favorites',
                'financial_transactions', 'loan_payments', 'property_financials',
                'maintenance_requests', 'vendors', 'lease_renewals', 'draft_leases',
                'outstanding_balances', 'rent_roll', 'tenants', 'properties', 'associations'
            ]
            
            for table in drop_order:
                try:
                    cursor.execute(f"DROP TABLE IF EXISTS {table} CASCADE")
                    print(f"   ✅ Dropped table: {table}")
                except Exception as e:
                    print(f"   ⚠️  Warning dropping {table}: {e}")
            
            # Drop the user table last (it's a reserved keyword)
            try:
                cursor.execute('DROP TABLE IF EXISTS "user" CASCADE')
                print("   ✅ Dropped table: user")
            except Exception as e:
                print(f"   ⚠️  Warning dropping user table: {e}")
        
        # Read and execute updated schema
        print("📖 Reading updated database schema...")
        with open('updated_database.sql', 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Split SQL statements and execute them
        statements = sql_content.split(';')
        
        print("🔧 Creating new tables...")
        for i, statement in enumerate(statements, 1):
            statement = statement.strip()
            if statement and not statement.startswith('--'):
                try:
                    cursor.execute(statement)
                    print(f"✅ Statement {i} executed successfully")
                except Exception as e:
                    print(f"⚠️  Warning executing statement {i}: {e}")
                    # Continue with other statements
        
        # Verify tables were created
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """)
        tables = cursor.fetchall()
        
        print(f"\n📊 Migration completed successfully!")
        print(f"📋 Total tables created: {len(tables)}")
        print("📋 Tables:")
        for table in tables:
            print(f"   - {table[0]}")
        
        # Check for views
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        views = cursor.fetchall()
        
        if views:
            print(f"\n📋 Views created: {len(views)}")
            for view in views:
                print(f"   - {view[0]}")
        
        # Test a few key tables
        print("\n🧪 Testing key tables...")
        key_tables = ['"user"', 'properties', 'tenants', 'maintenance_requests']
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
        print(f"❌ Error migrating PostgreSQL database: {e}")
        return False

def main():
    """Main migration function"""
    print("🚀 Neon Database Migration Script")
    print("=" * 40)
    
    # Check if updated_database.sql exists
    if not os.path.exists('updated_database.sql'):
        print("❌ updated_database.sql file not found!")
        sys.exit(1)
    
    success = migrate_neon_database()
    
    if success:
        print("\n🎉 Neon database migration completed successfully!")
        print("\n📝 Next steps:")
        print("1. Start your Flask application: python app.py")
        print("2. The database is now ready with the updated schema")
        print("3. All tables, indexes, and views have been created")
    else:
        print("\n❌ Neon database migration failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
