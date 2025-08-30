#!/usr/bin/env python3

from config import app, db
from models.user import User
from models.property import Property

with app.app_context():
    try:
        # Check if database is connected
        from sqlalchemy import text
        db.session.execute(text('SELECT 1'))
        print("Database connection successful!")
        
        # Check users
        users = User.query.all()
        print(f"Found {len(users)} users:")
        for user in users:
            print(f"  - ID: {user.id}, Username: {user.username}, Email: {user.email}")
            if hasattr(user, 'first_name') and hasattr(user, 'last_name'):
                print(f"    Name: {user.first_name} {user.last_name}")
            elif hasattr(user, 'full_name'):
                print(f"    Name: {user.full_name}")
        
        # Check properties
        properties = Property.query.all()
        print(f"Found {len(properties)} properties:")
        for prop in properties:
            print(f"  - ID: {prop.id}, Title: {prop.title}, Owner: {prop.owner_id}")
            
    except Exception as e:
        print(f"Database error: {e}")
