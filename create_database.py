#!/usr/bin/env python3
"""
Script to create the SQLite database using updated_database.sql
"""

import sqlite3
import os
import sys

def create_sqlite_database():
    """Create SQLite database and tables"""
    
    db_path = 'ownexa.db'
    
    try:
        # Create/connect to SQLite database
        print(f"🔌 Creating SQLite database: {db_path}")
        conn = sqlite3.connect(db_path)
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
                    # Convert PostgreSQL syntax to SQLite
                    statement = convert_postgres_to_sqlite(statement)
                    cursor.execute(statement)
                    print(f"✅ Table {i} created successfully")
                except Exception as e:
                    print(f"⚠️  Warning creating table {i}: {e}")
                    # Continue with other tables
        
        # Commit changes
        conn.commit()
        
        # Verify tables were created
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print(f"\n📊 Database created successfully!")
        print(f"📋 Total tables created: {len(tables)}")
        print("📋 Tables:")
        for table in tables:
            print(f"   - {table[0]}")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating database: {e}")
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
    """Main function"""
    print("🚀 Creating SQLite Database for Real Estate Management System")
    print("=" * 60)
    
    success = create_sqlite_database()
    
    if success:
        print("\n🎉 Database setup completed successfully!")
        print("\n📝 Next steps:")
        print("1. Start your Flask application: python app.py")
        print("2. The database will be automatically initialized")
        print("3. You can now use the application locally")
    else:
        print("\n❌ Database setup failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
