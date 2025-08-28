#!/usr/bin/env python3
"""
Script to create PostgreSQL database using updated_database.sql for Neon
"""

import psycopg2
import os
import sys
from urllib.parse import urlparse

def create_postgresql_database():
    """Create PostgreSQL database and tables"""
    
    # Neon PostgreSQL Database Configuration
    NEON_CONNECTION_STRING = "postgresql://neondb_owner:npg_GrOEbhSsxK89@ep-green-smoke-ae7q078i-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    
    try:
        # Connect to PostgreSQL database
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
        
        # Split SQL statements and execute them
        statements = sql_content.split(';')
        
        print("📝 Creating database tables...")
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
        
        print(f"\n📊 Database created successfully!")
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
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Creating PostgreSQL Database for Real Estate Management System")
    print("=" * 60)
    
    success = create_postgresql_database()
    
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
