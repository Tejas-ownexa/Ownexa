#!/usr/bin/env python3
"""
Upload database_tables.sql to Neon PostgreSQL Database
This script connects to your Neon database and creates all the tables.
"""

import psycopg2
import os
import sys
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Neon Database Connection Details
NEON_CONNECTION_STRING = "postgresql://neondb_owner:npg_GrOEbhSsxK89@ep-green-smoke-ae7q078i-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def test_connection():
    """Test connection to Neon database"""
    try:
        print("🔌 Testing connection to Neon database...")
        conn = psycopg2.connect(NEON_CONNECTION_STRING)
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        
        print("✅ Connection successful!")
        print(f"PostgreSQL version: {version[0]}")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def read_sql_file():
    """Read the database_tables.sql file"""
    try:
        with open('database_tables.sql', 'r', encoding='utf-8') as file:
            return file.read()
    except FileNotFoundError:
        print("❌ database_tables.sql file not found!")
        return None
    except Exception as e:
        print(f"❌ Error reading SQL file: {e}")
        return None

def execute_sql_statements(conn, sql_content):
    """Execute SQL statements from the content"""
    cursor = conn.cursor()
    
    # Split the SQL into individual statements
    statements = sql_content.split(';')
    
    print("📝 Creating database tables...")
    executed_count = 0
    error_count = 0
    
    # First pass: Create extensions and tables
    print("🔧 Creating extensions and tables...")
    for i, statement in enumerate(statements):
        statement = statement.strip()
        if (statement and 
            not statement.startswith('--') and 
            not statement.startswith('SELECT') and
            not statement.startswith('CREATE INDEX') and
            not statement.startswith('COMMENT ON')):
            try:
                cursor.execute(statement)
                executed_count += 1
                print(f"✅ Statement {i+1} executed successfully")
            except Exception as e:
                error_count += 1
                print(f"⚠️  Warning executing statement {i+1}: {e}")
                print(f"Statement: {statement[:100]}...")
    
    # Second pass: Create indexes
    print("\n🔧 Creating indexes...")
    for i, statement in enumerate(statements):
        statement = statement.strip()
        if statement and statement.startswith('CREATE INDEX'):
            try:
                cursor.execute(statement)
                executed_count += 1
                print(f"✅ Index created successfully")
            except Exception as e:
                error_count += 1
                print(f"⚠️  Warning creating index: {e}")
    
    # Third pass: Add comments
    print("\n🔧 Adding table comments...")
    for i, statement in enumerate(statements):
        statement = statement.strip()
        if statement and statement.startswith('COMMENT ON'):
            try:
                cursor.execute(statement)
                executed_count += 1
                print(f"✅ Comment added successfully")
            except Exception as e:
                error_count += 1
                print(f"⚠️  Warning adding comment: {e}")
    
    cursor.close()
    return executed_count, error_count

def verify_tables(conn):
    """Verify that tables were created successfully"""
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)
    
    tables = cursor.fetchall()
    cursor.close()
    
    return tables

def main():
    """Main function to upload database schema to Neon"""
    print("🚀 Uploading Database Schema to Neon PostgreSQL")
    print("=" * 60)
    
    # Test connection first
    if not test_connection():
        print("\n❌ Cannot proceed without a valid database connection.")
        print("Please check your Neon connection string and try again.")
        return False
    
    # Read SQL file
    sql_content = read_sql_file()
    if not sql_content:
        return False
    
    # Connect and create tables
    try:
        print("\n🔗 Connecting to Neon database...")
        conn = psycopg2.connect(NEON_CONNECTION_STRING)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        
        # Execute SQL statements
        executed_count, error_count = execute_sql_statements(conn, sql_content)
        
        print(f"\n📊 Execution Summary:")
        print(f"  - Statements executed: {executed_count}")
        print(f"  - Errors encountered: {error_count}")
        
        # Verify tables were created
        tables = verify_tables(conn)
        
        if tables:
            print(f"\n✅ Successfully created {len(tables)} tables:")
            for table in tables:
                print(f"  - {table[0]}")
        else:
            print("\n⚠️  No tables found. There may have been issues during creation.")
        
        conn.close()
        
        if error_count == 0:
            print("\n🎉 Database schema uploaded successfully!")
            print("\n📝 Your Neon database is now ready to use!")
            print("\n🔗 Connection string for your application:")
            print(f"   {NEON_CONNECTION_STRING}")
            return True
        else:
            print(f"\n⚠️  Database schema uploaded with {error_count} warnings.")
            return True
            
    except Exception as e:
        print(f"\n❌ Error during database upload: {e}")
        return False

if __name__ == "__main__":
    success = main()
    
    if success:
        print("\n✅ Database upload completed!")
        print("\n📝 Next steps:")
        print("1. Update your config.py to use the Neon connection string")
        print("2. Test your application with the new database")
    else:
        print("\n❌ Database upload failed.")
        sys.exit(1)
