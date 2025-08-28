#!/usr/bin/env python3
"""
Simple script to create SQLite database using updated_database.sql
"""

import sqlite3
import os

def create_database():
    """Create SQLite database tables"""
    
    db_path = 'ownexa.db'
    
    try:
        print(f"🔌 Creating SQLite database: {db_path}")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("📖 Reading SQL file...")
        with open('updated_database.sql', 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        print("🔧 Executing SQL statements...")
        
        # Split SQL statements and execute them
        statements = sql_content.split(';')
        
        for statement in statements:
            statement = statement.strip()
            if statement and not statement.startswith('--'):
                try:
                    # Convert PostgreSQL syntax to SQLite
                    statement = convert_postgres_to_sqlite(statement)
                    if statement:  # Only execute if statement is not empty
                        cursor.execute(statement)
                except Exception as e:
                    print(f"⚠️  Warning: {e}")
                    # Continue with other statements
        
        # Commit changes
        conn.commit()
        
        # Verify tables were created
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        if tables:
            print(f"\n🎉 Successfully created {len(tables)} tables:")
            for table in tables:
                print(f"  - {table[0]}")
        else:
            print("\n⚠️  No tables found.")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
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

if __name__ == "__main__":
    print("🚀 Creating SQLite Database Tables")
    print("=" * 40)
    
    success = create_database()
    
    if success:
        print("\n✅ Database creation completed!")
        print("\n📝 Next steps:")
        print("1. Start your Flask application: python app.py")
        print("2. The database will be automatically initialized")
    else:
        print("\n❌ Database creation failed!")
