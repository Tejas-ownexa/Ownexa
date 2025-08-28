#!/usr/bin/env python3
"""
Fix property_favorites table by adding missing updated_at column
"""

import psycopg2
import sys

# Neon Database Connection Details
NEON_CONNECTION_STRING = "postgresql://neondb_owner:npg_GrOEbhSsxK89@ep-green-smoke-ae7q078i-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def fix_property_favorites_table():
    """Fix the property_favorites table by adding updated_at column"""
    
    try:
        print("🔧 Fixing property_favorites table...")
        conn = psycopg2.connect(NEON_CONNECTION_STRING)
        cursor = conn.cursor()
        
        # Check if updated_at column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'property_favorites' 
            AND column_name = 'updated_at';
        """)
        
        column_exists = cursor.fetchone()
        
        if not column_exists:
            print("➕ Adding updated_at column to property_favorites table...")
            cursor.execute("""
                ALTER TABLE property_favorites 
                ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            """)
            conn.commit()
            print("✅ updated_at column added successfully!")
        else:
            print("✅ updated_at column already exists!")
        
        # Verify the fix
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'property_favorites' 
            ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        print("\n📋 property_favorites table structure:")
        for column in columns:
            print(f"   - {column[0]}: {column[1]}")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error fixing property_favorites table: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Fixing Database Schema Issues")
    print("=" * 40)
    
    success = fix_property_favorites_table()
    
    if success:
        print("\n✅ Database schema fixed successfully!")
        print("📝 Your application should now work without errors!")
    else:
        print("\n❌ Failed to fix database schema.")
        sys.exit(1)

if __name__ == "__main__":
    main()
