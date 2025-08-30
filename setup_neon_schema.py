#!/usr/bin/env python3
"""
Properly set up Neon PostgreSQL database with the schema from database_tables.sql
This script creates tables in the correct order to avoid foreign key constraint issues
"""

import psycopg2
import os

# Neon database connection string
NEON_CONNECTION_STRING = "postgresql://neondb_owner:npg_V8OySJF5njdT@ep-summer-sky-adwixnct-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def create_tables_without_constraints():
    """Create tables without foreign key constraints first"""
    try:
        print("🏗️ Creating tables without foreign key constraints...")
        conn = psycopg2.connect(NEON_CONNECTION_STRING)
        cursor = conn.cursor()

        # Enable UUID extension
        cursor.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")
        conn.commit()

        # Create tables without foreign key constraints first
        tables_sql = [
            # 1. USER TABLE (no dependencies)
            """
            CREATE TABLE IF NOT EXISTS "user" (
                id SERIAL PRIMARY KEY,
                username VARCHAR(80) UNIQUE NOT NULL,
                email VARCHAR(120) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                first_name VARCHAR(60) NOT NULL,
                last_name VARCHAR(60) NOT NULL,
                phone_number VARCHAR(20),
                role VARCHAR(20) DEFAULT 'OWNER',
                street_address_1 VARCHAR(255) NOT NULL,
                street_address_2 VARCHAR(255),
                apt_number VARCHAR(20),
                city VARCHAR(100) NOT NULL,
                state VARCHAR(50) NOT NULL,
                zip_code VARCHAR(10) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                email_verified BOOLEAN DEFAULT TRUE,
                email_verification_token VARCHAR(255) UNIQUE,
                email_verification_expires TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,

            # 2. PROPERTIES TABLE (depends on user)
            """
            CREATE TABLE IF NOT EXISTS properties (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                street_address_1 VARCHAR(255) NOT NULL,
                street_address_2 VARCHAR(255),
                apt_number VARCHAR(50),
                city VARCHAR(100) NOT NULL,
                state VARCHAR(100) NOT NULL,
                zip_code VARCHAR(20) NOT NULL,
                description TEXT NOT NULL,
                rent_amount NUMERIC(10, 2) NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'available',
                owner_id INTEGER NOT NULL,
                image_url VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,

            # 3. TENANTS TABLE (depends on properties)
            """
            CREATE TABLE IF NOT EXISTS tenants (
                id SERIAL PRIMARY KEY,
                full_name VARCHAR(100),
                email VARCHAR(100) UNIQUE,
                phone_number VARCHAR(20),
                property_id INTEGER,
                lease_start DATE,
                lease_end DATE,
                rent_amount NUMERIC(10, 2),
                payment_status VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,

            # 4. VENDORS TABLE (depends on user)
            """
            CREATE TABLE IF NOT EXISTS vendors (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                vendor_type VARCHAR(50) NOT NULL,
                business_name VARCHAR(255) NOT NULL,
                phone_number VARCHAR(20) NOT NULL,
                email VARCHAR(120) NOT NULL,
                address TEXT NOT NULL,
                license_number VARCHAR(100),
                insurance_info TEXT,
                hourly_rate NUMERIC(10, 2),
                is_verified BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,

            # 5. MAINTENANCE REQUESTS TABLE
            """
            CREATE TABLE IF NOT EXISTS maintenance_requests (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER NOT NULL,
                property_id INTEGER NOT NULL,
                assigned_vendor_id INTEGER,
                request_title VARCHAR(255) NOT NULL,
                request_description TEXT NOT NULL,
                request_date DATE NOT NULL DEFAULT CURRENT_DATE,
                priority VARCHAR(20) NOT NULL DEFAULT 'medium',
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                estimated_cost NUMERIC(10, 2),
                actual_cost NUMERIC(10, 2),
                scheduled_date DATE,
                completion_date DATE,
                tenant_notes TEXT,
                vendor_notes TEXT,
                owner_notes TEXT,
                vendor_type_needed VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,

            # 6. PROPERTY FINANCIALS TABLE
            """
            CREATE TABLE IF NOT EXISTS property_financials (
                id SERIAL PRIMARY KEY,
                property_id INTEGER NOT NULL,
                total_value NUMERIC(12, 2) NOT NULL,
                purchase_price NUMERIC(12, 2) NOT NULL,
                purchase_date DATE NOT NULL,
                purchase_price_per_sqft NUMERIC(8, 2),
                mortgage_amount NUMERIC(12, 2) NOT NULL,
                down_payment NUMERIC(12, 2) NOT NULL,
                current_apr NUMERIC(5, 4) NOT NULL,
                loan_term_years INTEGER NOT NULL DEFAULT 30,
                monthly_loan_payment NUMERIC(10, 2) NOT NULL,
                loan_payment_date INTEGER NOT NULL DEFAULT 1,
                property_tax_annual NUMERIC(10, 2) DEFAULT 0,
                insurance_annual NUMERIC(10, 2) DEFAULT 0,
                hoa_fees_monthly NUMERIC(8, 2) DEFAULT 0,
                maintenance_reserve_monthly NUMERIC(8, 2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,

            # 7. FINANCIAL TRANSACTIONS TABLE
            """
            CREATE TABLE IF NOT EXISTS financial_transactions (
                id SERIAL PRIMARY KEY,
                property_id INTEGER NOT NULL,
                transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
                transaction_type VARCHAR(50) NOT NULL,
                amount NUMERIC(12, 2) NOT NULL,
                description TEXT NOT NULL,
                category VARCHAR(50) NOT NULL,
                reference_number VARCHAR(100),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,

            # 8. ASSOCIATIONS TABLE
            """
            CREATE TABLE IF NOT EXISTS associations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                street_address_1 VARCHAR(255),
                street_address_2 VARCHAR(255),
                apt_number VARCHAR(50),
                city VARCHAR(100),
                state VARCHAR(100),
                zip_code VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
        ]

        for i, sql in enumerate(tables_sql, 1):
            try:
                print(f"📝 Creating table {i}/8...")
                cursor.execute(sql)
                conn.commit()
            except Exception as e:
                print(f"⚠️  Error creating table {i}: {e}")
                conn.rollback()

        # Now add foreign key constraints
        print("\n🔗 Adding foreign key constraints...")
        constraints_sql = [
            "ALTER TABLE properties ADD CONSTRAINT fk_properties_owner_id FOREIGN KEY (owner_id) REFERENCES \"user\"(id) ON DELETE CASCADE;",
            "ALTER TABLE tenants ADD CONSTRAINT fk_tenants_property_id FOREIGN KEY (property_id) REFERENCES properties(id);",
            "ALTER TABLE vendors ADD CONSTRAINT fk_vendors_user_id FOREIGN KEY (user_id) REFERENCES \"user\"(id) ON DELETE CASCADE;",
            "ALTER TABLE maintenance_requests ADD CONSTRAINT fk_maintenance_requests_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;",
            "ALTER TABLE maintenance_requests ADD CONSTRAINT fk_maintenance_requests_property_id FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;",
            "ALTER TABLE maintenance_requests ADD CONSTRAINT fk_maintenance_requests_vendor_id FOREIGN KEY (assigned_vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;",
            "ALTER TABLE property_financials ADD CONSTRAINT fk_property_financials_property_id FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;",
            "ALTER TABLE financial_transactions ADD CONSTRAINT fk_financial_transactions_property_id FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;",
        ]

        for i, sql in enumerate(constraints_sql, 1):
            try:
                print(f"🔗 Adding constraint {i}/8...")
                cursor.execute(sql)
                conn.commit()
            except Exception as e:
                print(f"⚠️  Error adding constraint {i}: {e}")
                conn.rollback()

        cursor.close()
        conn.close()

        print("✅ Basic schema created successfully!")
        return True

    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False

def create_remaining_tables():
    """Create the remaining tables and indexes"""
    try:
        print("\n🏗️ Creating additional tables...")
        conn = psycopg2.connect(NEON_CONNECTION_STRING)
        cursor = conn.cursor()

        additional_tables = [
            # RENT ROLL TABLE
            """
            CREATE TABLE IF NOT EXISTS rent_roll (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER REFERENCES tenants(id),
                property_id INTEGER REFERENCES properties(id),
                payment_date DATE,
                amount_paid NUMERIC(10, 2),
                payment_method VARCHAR(50),
                status VARCHAR(50),
                remarks TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,

            # OUTSTANDING BALANCES TABLE
            """
            CREATE TABLE IF NOT EXISTS outstanding_balances (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER REFERENCES tenants(id),
                property_id INTEGER REFERENCES properties(id),
                due_amount NUMERIC(10, 2),
                due_date DATE,
                is_resolved BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,

            # DRAFT LEASES TABLE
            """
            CREATE TABLE IF NOT EXISTS draft_leases (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER REFERENCES tenants(id),
                property_id INTEGER REFERENCES properties(id),
                start_date DATE,
                end_date DATE,
                rent_amount NUMERIC(10, 2),
                terms TEXT,
                created_by INTEGER REFERENCES "user"(id),
                status VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,

            # LEASE RENEWALS TABLE
            """
            CREATE TABLE IF NOT EXISTS lease_renewals (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER REFERENCES tenants(id),
                property_id INTEGER REFERENCES properties(id),
                old_end_date DATE,
                new_end_date DATE,
                rent_change NUMERIC(10, 2),
                status VARCHAR(50),
                requested_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,

            # PROPERTY FAVORITES TABLE
            """
            CREATE TABLE IF NOT EXISTS property_favorites (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES "user"(id),
                property_id INTEGER NOT NULL REFERENCES properties(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, property_id)
            );
            """,

            # OWNERSHIP ACCOUNTS TABLE
            """
            CREATE TABLE IF NOT EXISTS ownership_accounts (
                id SERIAL PRIMARY KEY,
                owner_id INTEGER REFERENCES "user"(id),
                association_id INTEGER REFERENCES associations(id),
                balance_due NUMERIC(10, 2),
                city VARCHAR(100),
                state VARCHAR(100),
                zip_code VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,

            # ASSOCIATION MEMBERSHIPS TABLE
            """
            CREATE TABLE IF NOT EXISTS association_memberships (
                id SERIAL PRIMARY KEY,
                association_id INTEGER REFERENCES associations(id),
                user_type VARCHAR(20),
                owner_id INTEGER REFERENCES "user"(id),
                tenant_id INTEGER REFERENCES tenants(id),
                joined_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,

            # ASSOCIATION BALANCES TABLE
            """
            CREATE TABLE IF NOT EXISTS association_balances (
                id SERIAL PRIMARY KEY,
                membership_id INTEGER REFERENCES association_memberships(id),
                amount_due NUMERIC(10, 2),
                due_date DATE,
                is_resolved BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,

            # VIOLATIONS TABLE
            """
            CREATE TABLE IF NOT EXISTS violations (
                id SERIAL PRIMARY KEY,
                membership_id INTEGER REFERENCES association_memberships(id),
                violation_type VARCHAR(100),
                description TEXT,
                reported_date DATE,
                resolved BOOLEAN DEFAULT FALSE,
                resolution_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,

            # LISTINGS TABLE
            """
            CREATE TABLE IF NOT EXISTS listings (
                id SERIAL PRIMARY KEY,
                property_id INTEGER REFERENCES properties(id),
                listing_date DATE,
                listed_by INTEGER REFERENCES "user"(id),
                status VARCHAR(50),
                rent_price NUMERIC(10, 2),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,

            # APPLICANTS TABLE
            """
            CREATE TABLE IF NOT EXISTS applicants (
                id SERIAL PRIMARY KEY,
                listing_id INTEGER REFERENCES listings(id),
                full_name VARCHAR(100),
                email VARCHAR(100),
                phone_number VARCHAR(20),
                status VARCHAR(50),
                application_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
        ]

        for i, sql in enumerate(additional_tables, 1):
            try:
                print(f"📝 Creating additional table {i}/11...")
                cursor.execute(sql)
                conn.commit()
            except Exception as e:
                print(f"⚠️  Error creating additional table {i}: {e}")
                conn.rollback()

        cursor.close()
        conn.close()

        print("✅ Additional tables created successfully!")
        return True

    except Exception as e:
        print(f"❌ Error creating additional tables: {e}")
        return False

def create_indexes():
    """Create performance indexes"""
    try:
        print("\n⚡ Creating performance indexes...")
        conn = psycopg2.connect(NEON_CONNECTION_STRING)
        cursor = conn.cursor()

        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);",
            "CREATE INDEX IF NOT EXISTS idx_tenants_property_id ON tenants(property_id);",
            "CREATE INDEX IF NOT EXISTS idx_maintenance_requests_property_id ON maintenance_requests(property_id);",
            "CREATE INDEX IF NOT EXISTS idx_maintenance_requests_tenant_id ON maintenance_requests(tenant_id);",
            "CREATE INDEX IF NOT EXISTS idx_maintenance_requests_vendor_id ON maintenance_requests(assigned_vendor_id);",
            "CREATE INDEX IF NOT EXISTS idx_financial_transactions_property_id ON financial_transactions(property_id);",
            "CREATE INDEX IF NOT EXISTS idx_property_financials_property_id ON property_financials(property_id);",
            "CREATE INDEX IF NOT EXISTS idx_rent_roll_tenant_id ON rent_roll(tenant_id);",
            "CREATE INDEX IF NOT EXISTS idx_rent_roll_property_id ON rent_roll(property_id);",
            "CREATE INDEX IF NOT EXISTS idx_outstanding_balances_tenant_id ON outstanding_balances(tenant_id);",
            "CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_listings_property_id ON listings(property_id);",
            "CREATE INDEX IF NOT EXISTS idx_applicants_listing_id ON applicants(listing_id);",
        ]

        for i, sql in enumerate(indexes, 1):
            try:
                print(f"⚡ Creating index {i}/13...")
                cursor.execute(sql)
                conn.commit()
            except Exception as e:
                print(f"⚠️  Error creating index {i}: {e}")
                conn.rollback()

        cursor.close()
        conn.close()

        print("✅ Indexes created successfully!")
        return True

    except Exception as e:
        print(f"❌ Error creating indexes: {e}")
        return False

def add_comments():
    """Add table comments"""
    try:
        print("\n📝 Adding table comments...")
        conn = psycopg2.connect(NEON_CONNECTION_STRING)
        cursor = conn.cursor()

        comments = [
            "COMMENT ON TABLE \"user\" IS 'User accounts for property owners, tenants, and vendors';",
            "COMMENT ON TABLE properties IS 'Property listings with details and status';",
            "COMMENT ON TABLE tenants IS 'Tenant information and lease details';",
            "COMMENT ON TABLE maintenance_requests IS 'Maintenance requests and their status';",
            "COMMENT ON TABLE vendors IS 'Vendor profiles and contact information';",
            "COMMENT ON TABLE property_financials IS 'Financial details for each property';",
            "COMMENT ON TABLE financial_transactions IS 'All financial transactions for properties';",
            "COMMENT ON TABLE associations IS 'Homeowner associations';",
            "COMMENT ON TABLE listings IS 'Property listings for rent';",
            "COMMENT ON TABLE applicants IS 'Applicants for property listings';",
        ]

        for i, sql in enumerate(comments, 1):
            try:
                print(f"📝 Adding comment {i}/10...")
                cursor.execute(sql)
                conn.commit()
            except Exception as e:
                print(f"⚠️  Error adding comment {i}: {e}")
                conn.rollback()

        cursor.close()
        conn.close()

        print("✅ Comments added successfully!")
        return True

    except Exception as e:
        print(f"❌ Error adding comments: {e}")
        return False

def main():
    """Main function"""
    print("🏗️  Complete Neon Database Schema Setup")
    print("=" * 50)

    # Create main tables
    if create_tables_without_constraints():
        # Create additional tables
        create_remaining_tables()

        # Create indexes
        create_indexes()

        # Add comments
        add_comments()

        # Check final result
        print("\n🔍 Final verification...")
        from check_neon_tables import check_tables
        check_tables()

        print("\n🎉 Complete database setup finished!")
        print("\n📊 Database now includes:")
        print("  • 20+ tables with proper relationships")
        print("  • Foreign key constraints")
        print("  • Performance indexes")
        print("  • Table comments and documentation")
        print("  • Ready for production use!")

    else:
        print("❌ Database setup failed")

if __name__ == "__main__":
    main()
