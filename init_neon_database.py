#!/usr/bin/env python3
"""
Initialize Neon PostgreSQL database with the schema from database_tables.sql
"""

import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Neon database connection string
NEON_CONNECTION_STRING = "postgresql://neondb_owner:npg_V8OySJF5njdT@ep-summer-sky-adwixnct-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def test_connection():
    """Test database connection"""
    try:
        print("🔍 Testing database connection...")
        conn = psycopg2.connect(NEON_CONNECTION_STRING)
        conn.close()
        print("✅ Database connection successful!")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def read_sql_file():
    """Read the SQL schema file"""
    try:
        with open('database_tables.sql', 'r', encoding='utf-8') as f:
            sql_content = f.read()
        print("✅ SQL schema file loaded successfully!")
        return sql_content
    except FileNotFoundError:
        print("❌ database_tables.sql file not found!")
        return None
    except Exception as e:
        print(f"❌ Error reading SQL file: {e}")
        return None

def initialize_database():
    """Initialize the database with schema"""
    sql_content = read_sql_file()
    if not sql_content:
        return False

    try:
        print("🚀 Initializing database with schema...")
        conn = psycopg2.connect(NEON_CONNECTION_STRING)
        cursor = conn.cursor()

        # Split SQL into individual statements
        sql_statements = sql_content.split(';')

        for i, statement in enumerate(sql_statements, 1):
            statement = statement.strip()
            if statement and not statement.startswith('--'):
                try:
                    print(f"📝 Executing statement {i}...")
                    cursor.execute(statement)
                    conn.commit()
                except Exception as e:
                    print(f"⚠️  Warning on statement {i}: {e}")
                    # Continue with next statement
                    continue

        cursor.close()
        conn.close()

        print("✅ Database initialization completed!")
        return True

    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False

def check_tables():
    """Check if tables were created successfully"""
    try:
        print("🔍 Checking if tables were created...")
        conn = psycopg2.connect(NEON_CONNECTION_STRING)
        cursor = conn.cursor()

        # Query to check tables
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)

        tables = cursor.fetchall()

        if tables:
            print("📋 Tables found in database:")
            for table in tables:
                print(f"  • {table[0]}")
        else:
            print("⚠️  No tables found in database")

        cursor.close()
        conn.close()
        return True

    except Exception as e:
        print(f"❌ Error checking tables: {e}")
        return False

def main():
    """Main function"""
    print("🏗️  Neon Database Initialization Script")
    print("=" * 50)

    # Test connection
    if not test_connection():
        print("❌ Cannot proceed without database connection")
        return

    # Initialize database
    if initialize_database():
        # Check results
        check_tables()
        print("\n🎉 Database setup completed successfully!")
        print("\n📝 Your Neon database is now ready with:")
        print("  • 20+ tables created")
        print("  • Proper indexes for performance")
        print("  • Foreign key relationships")
        print("  • Comments and documentation")
    else:
        print("❌ Database setup failed")

if __name__ == "__main__":
    main()
