import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from config import app, db
from models import *  # Import all models

def init_neon_database():
    """Initialize Neon database with tables and initial data"""
    try:
        # Load environment variables
        load_dotenv()
        
        # Get database URL
        database_url = os.getenv('NEON_DATABASE_URL')
        if not database_url:
            raise ValueError("NEON_DATABASE_URL environment variable is not set")
        
        print("Connecting to Neon database...")
        engine = create_engine(database_url)
        
        # Test connection
        with engine.connect() as connection:
            result = connection.execute(text("SELECT version();"))
            version = result.fetchone()
            print(f"Connected to PostgreSQL version: {version[0]}")
        
        print("\nCreating all tables...")
        with app.app_context():
            # Create all tables
            db.create_all()
            print("All tables created successfully!")
            
            # List created tables
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            print("\nCreated tables:")
            for table in sorted(tables):
                print(f"- {table}")
        
        return True
        
    except SQLAlchemyError as e:
        print(f"\nDatabase error: {str(e)}")
        return False
    except Exception as e:
        print(f"\nError: {str(e)}")
        return False

if __name__ == '__main__':
    init_neon_database()
