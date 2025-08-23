from config import app, db
from models import *

with app.app_context():
    print("Creating database tables...")
    db.create_all()
    
    # Print all tables that were created
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    print("\nCreated tables:")
    for table_name in inspector.get_table_names():
        print(f"- {table_name}")
        columns = inspector.get_columns(table_name)
        for column in columns:
            print(f"  * {column['name']}: {column['type']}")
