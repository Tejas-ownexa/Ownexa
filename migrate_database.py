#!/usr/bin/env python3
"""
Database Migration Script
This script migrates the database to use the updated schema from updated_database.sql
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

def migrate_sqlite_database():
    """Migrate SQLite database"""
    db_path = 'ownexa.db'
    
    try:
        print(f"🔌 Connecting to SQLite database: {db_path}")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if database exists and has tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        existing_tables = cursor.fetchall()
        
        if existing_tables:
            print(f"📋 Found {len(existing_tables)} existing tables")
            print("⚠️  This will recreate all tables. Existing data will be lost!")
            
            response = input("Do you want to continue? (y/N): ")
            if response.lower() != 'y':
                print("❌ Migration cancelled")
                return False
            
            # Drop existing tables
            print("🗑️  Dropping existing tables...")
            for table in existing_tables:
                cursor.execute(f"DROP TABLE IF EXISTS {table[0]}")
        
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
                    # Convert PostgreSQL syntax to SQLite
                    statement = convert_postgres_to_sqlite(statement)
                    if statement:  # Only execute if statement is not empty
                        cursor.execute(statement)
                        print(f"✅ Statement {i} executed successfully")
                except Exception as e:
                    print(f"⚠️  Warning executing statement {i}: {e}")
        
        # Commit changes
        conn.commit()
        
        # Verify tables were created
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print(f"\n📊 Migration completed successfully!")
        print(f"📋 Total tables created: {len(tables)}")
        print("📋 Tables:")
        for table in tables:
            print(f"   - {table[0]}")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error migrating SQLite database: {e}")
        return False

def migrate_postgresql_database():
    """Migrate PostgreSQL database"""
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
            
            # Drop existing tables
            print("🗑️  Dropping existing tables...")
            for table in existing_tables:
                cursor.execute(f"DROP TABLE IF EXISTS {table[0]} CASCADE")
        
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
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error migrating PostgreSQL database: {e}")
        return False

def convert_postgres_to_sqlite(sql_statement):
    """Convert PostgreSQL syntax to SQLite compatible syntax"""
    
    # Remove PostgreSQL-specific syntax
    sql_statement = sql_statement.replace('SERIAL', 'INTEGER PRIMARY KEY AUTOINCREMENT')
    sql_statement = sql_statement.replace('BIGSERIAL', 'INTEGER PRIMARY KEY AUTOINCREMENT')
    sql_statement = sql_statement.replace('TIMESTAMP WITH TIME ZONE', 'TEXT')
    sql_statement = sql_statement.replace('TIMESTAMP', 'TEXT')
    sql_statement = sql_statement.replace('TEXT[]', 'TEXT')
    sql_statement = sql_statement.replace('JSONB', 'TEXT')
    sql_statement = sql_statement.replace('JSON', 'TEXT')
    sql_statement = sql_statement.replace('NUMERIC(10, 2)', 'REAL')
    sql_statement = sql_statement.replace('NUMERIC(12, 2)', 'REAL')
    sql_statement = sql_statement.replace('NUMERIC(8, 2)', 'REAL')
    sql_statement = sql_statement.replace('NUMERIC(5, 4)', 'REAL')
    
    # Remove PostgreSQL-specific constraints that SQLite doesn't support
    sql_statement = sql_statement.replace('ON DELETE CASCADE', '')
    sql_statement = sql_statement.replace('ON UPDATE CASCADE', '')
    sql_statement = sql_statement.replace('ON DELETE SET NULL', '')
    
    # Remove PostgreSQL-specific extensions
    if 'CREATE EXTENSION' in sql_statement:
        return ''
    
    # Remove PostgreSQL-specific comments
    if 'COMMENT ON TABLE' in sql_statement:
        return ''
    
    # Remove PostgreSQL-specific views (SQLite has limited view support)
    if 'CREATE VIEW' in sql_statement:
        return ''
    
    return sql_statement

def main():
    """Main migration function"""
    print("🚀 Database Migration Script")
    print("=" * 40)
    
    # Check if updated_database.sql exists
    if not os.path.exists('updated_database.sql'):
        print("❌ updated_database.sql file not found!")
        sys.exit(1)
    
    # Determine database type
    db_type = get_database_type()
    print(f"📊 Database type detected: {db_type}")
    
    # Run appropriate migration
    if db_type == 'sqlite':
        success = migrate_sqlite_database()
    elif db_type == 'postgresql':
        success = migrate_postgresql_database()
    else:
        print("❌ Unknown database type")
        sys.exit(1)
    
    if success:
        print("\n🎉 Database migration completed successfully!")
        print("\n📝 Next steps:")
        print("1. Start your Flask application: python app.py")
        print("2. The database is now ready with the updated schema")
    else:
        print("\n❌ Database migration failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
