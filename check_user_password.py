#!/usr/bin/env python3

from config import app, db
from models.user import User
from werkzeug.security import check_password_hash

with app.app_context():
    try:
        # Check user password
        user = User.query.filter_by(username='owner1').first()
        if user:
            print(f"User found: {user.username}")
            print(f"Email: {user.email}")
            print(f"Name: {user.first_name} {user.last_name}")
            
            # Test password
            test_password = "password123"
            if check_password_hash(user.password, test_password):
                print("Password 'password123' is correct!")
            else:
                print("Password 'password123' is incorrect!")
                
            # Let's try to create a new password
            from werkzeug.security import generate_password_hash
            new_password = "password123"
            hashed_password = generate_password_hash(new_password)
            print(f"New hashed password: {hashed_password}")
            
            # Update the user's password
            user.password = hashed_password
            db.session.commit()
            print("Password updated successfully!")
            
        else:
            print("User 'owner1' not found!")
            
    except Exception as e:
        print(f"Error: {e}")
