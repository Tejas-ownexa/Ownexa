import os
from dotenv import load_dotenv
import psycopg2
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError

def test_neon_connection():
    """Test connection to Neon database"""
    try:
        # Load environment variables
        load_dotenv()
        
        # Get database URL
        database_url = os.getenv('NEON_DATABASE_URL')
        if not database_url:
            raise ValueError("NEON_DATABASE_URL environment variable is not set")
        
        print("Testing direct PostgreSQL connection...")
        # Test direct PostgreSQL connection
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        cur.execute('SELECT version();')
        version = cur.fetchone()
        print(f"PostgreSQL version: {version[0]}")
        cur.close()
        conn.close()
        print("PostgreSQL connection successful!")
        
        print("\nTesting SQLAlchemy connection...")
        # Test SQLAlchemy connection
        engine = create_engine(database_url)
        with engine.connect() as connection:
            result = connection.execute("SELECT version();")
            version = result.fetchone()
            print(f"SQLAlchemy connection successful!")
            print(f"Database version: {version[0]}")
        
        return True
        
    except (Exception, SQLAlchemyError) as error:
        print(f"\nError connecting to Neon database: {error}")
        return False

if __name__ == '__main__':
    test_neon_connection()