#!/usr/bin/env python3

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from datetime import date, timedelta

# Database connection parameters
DB_PARAMS = {
    'host': 'localhost',
    'port': 5432,
    'database': 'flask_db',
    'user': 'admin',
    'password': 'admin123'
}

def update_lease_dates():
    """Update lease dates to be current"""
    try:
        # Connect to the database
        conn = psycopg2.connect(**DB_PARAMS)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print("Connected to database successfully")
        
        # Set lease dates to current year
        start_date = date(2025, 1, 1)
        end_date = date(2025, 12, 31)
        
        # Update lease dates for existing tenants
        cursor.execute("""
            UPDATE tenants 
            SET lease_start = %s, lease_end = %s 
            WHERE id IN (28, 29)
        """, (start_date, end_date))
        
        print(f"Updated {cursor.rowcount} tenant lease dates")
        
        # Verify the update
        cursor.execute("SELECT id, full_name, lease_start, lease_end FROM tenants WHERE id IN (28, 29)")
        tenants = cursor.fetchall()
        
        print("\nUpdated tenant lease dates:")
        for tenant in tenants:
            print(f"  ID {tenant[0]}: {tenant[1]} - {tenant[2]} to {tenant[3]}")
        
        cursor.close()
        conn.close()
        print("\nDatabase connection closed")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_lease_dates()
