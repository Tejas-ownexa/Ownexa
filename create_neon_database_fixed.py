#!/usr/bin/env python3
"""
Fixed Neon Database Creation Script
This script creates the PostgreSQL database using updated_database.sql with proper SQL parsing
"""

import psycopg2
import os
import sys
import re

def create_neon_database():
    """Create Neon PostgreSQL database with proper SQL parsing"""
    
    # Neon PostgreSQL Database Configuration
    NEON_CONNECTION_STRING = "postgresql://neondb_owner:npg_GrOEbhSsxK89@ep-green-smoke-ae7q078i-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    
    try:
        print("🔌 Connecting to Neon PostgreSQL database...")
        conn = psycopg2.connect(NEON_CONNECTION_STRING)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("✅ Database connection successful!")
        
        # Read SQL file
        sql_file = 'updated_database.sql'
        if not os.path.exists(sql_file):
            print(f"❌ SQL file '{sql_file}' not found!")
            return False
            
        with open(sql_file, 'r', encoding='utf-8') as file:
            sql_content = file.read()
        
        # Remove comments and clean up the SQL
        sql_content = re.sub(r'--.*$', '', sql_content, flags=re.MULTILINE)
        sql_content = re.sub(r'/\*.*?\*/', '', sql_content, flags=re.DOTALL)
        
        # Split SQL statements properly (handle semicolons in strings and comments)
        statements = []
        current_statement = ""
        in_string = False
        string_char = None
        
        for char in sql_content:
            current_statement += char
            
            if char in ["'", '"']:
                if not in_string:
                    in_string = True
                    string_char = char
                elif string_char == char:
                    in_string = False
                    string_char = None
            
            elif char == ';' and not in_string:
                statement = current_statement.strip()
                if statement and not statement.startswith('--'):
                    statements.append(statement)
                current_statement = ""
        
        # Add any remaining statement
        if current_statement.strip():
            statements.append(current_statement.strip())
        
        print(f"📝 Found {len(statements)} SQL statements to execute")
        
        # Execute statements
        print("🔧 Creating database tables...")
        successful_statements = 0
        
        for i, statement in enumerate(statements, 1):
            statement = statement.strip()
            if statement and not statement.startswith('--'):
                try:
                    cursor.execute(statement)
                    successful_statements += 1
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
        
        print(f"\n📊 Database creation completed!")
        print(f"📋 Total tables created: {len(tables)}")
        print(f"📋 Successful statements: {successful_statements}/{len(statements)}")
        
        if tables:
            print("📋 Tables:")
            for table in tables:
                print(f"   - {table[0]}")
        else:
            print("⚠️  No tables found - there may have been an issue with the SQL execution")
        
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
        if tables:
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
        
        return len(tables) > 0
        
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Creating Neon PostgreSQL Database")
    print("=" * 50)
    
    success = create_neon_database()
    
    if success:
        print("\n🎉 Database setup completed successfully!")
        print("\n📝 Next steps:")
        print("1. Start your Flask application: python app.py")
        print("2. The database will be automatically initialized")
        print("3. You can now use the application with Neon PostgreSQL")
    else:
        print("\n❌ Database setup failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
