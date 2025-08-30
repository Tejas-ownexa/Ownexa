from config import app, db
from models import *
import traceback
from sqlalchemy import text

def create_database():
    with app.app_context():
        try:
            print("Testing database connection...")
            # Test the connection using SQLAlchemy 2.0 syntax
            with db.engine.connect() as connection:
                result = connection.execute(text("SELECT version();"))
                version = result.fetchone()[0]
                print(f"Connected to PostgreSQL: {version}")
            
            print("Creating database tables...")
            db.create_all()
            
            # Verify tables were created
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            table_names = inspector.get_table_names()
            
            if table_names:
                print(f"\nSuccessfully created {len(table_names)} tables:")
                for table_name in table_names:
                    print(f"- {table_name}")
                    columns = inspector.get_columns(table_name)
                    for column in columns:
                        print(f"  * {column['name']}: {column['type']}")
            else:
                print("\nNo tables found! Something went wrong.")
                
        except Exception as e:
            print(f"Error: {e}")
            print("Full traceback:")
            traceback.print_exc()

if __name__ == "__main__":
    create_database()
