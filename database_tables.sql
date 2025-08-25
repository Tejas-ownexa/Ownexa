-- Real Estate Management System Database Tables
-- This file contains all the table definitions for the property management system
-- Run this SQL file in your PostgreSQL database to create all tables

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER TABLE
CREATE TABLE "user" (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
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

-- 2. PROPERTIES TABLE
CREATE TABLE properties (
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
    owner_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TENANTS TABLE
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    phone_number VARCHAR(20),
    property_id INTEGER REFERENCES properties(id),
    lease_start DATE,
    lease_end DATE,
    rent_amount NUMERIC(10, 2),
    payment_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. RENT ROLL TABLE
CREATE TABLE rent_roll (
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

-- 5. OUTSTANDING BALANCES TABLE
CREATE TABLE outstanding_balances (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    property_id INTEGER REFERENCES properties(id),
    due_amount NUMERIC(10, 2),
    due_date DATE,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. DRAFT LEASES TABLE
CREATE TABLE draft_leases (
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

-- 7. LEASE RENEWALS TABLE
CREATE TABLE lease_renewals (
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

-- 8. VENDORS TABLE
CREATE TABLE vendors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
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

-- 9. MAINTENANCE REQUESTS TABLE
CREATE TABLE maintenance_requests (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    assigned_vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
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

-- 10. PROPERTY FINANCIALS TABLE
CREATE TABLE property_financials (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
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

-- 11. LOAN PAYMENTS TABLE
CREATE TABLE loan_payments (
    id SERIAL PRIMARY KEY,
    property_financial_id INTEGER NOT NULL REFERENCES property_financials(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    due_date DATE NOT NULL,
    amount_paid NUMERIC(10, 2) NOT NULL,
    amount_due NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    late_fees NUMERIC(8, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. FINANCIAL TRANSACTIONS TABLE
CREATE TABLE financial_transactions (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
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

-- 13. ASSOCIATIONS TABLE
CREATE TABLE associations (
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

-- 14. PROPERTY FAVORITES TABLE
CREATE TABLE property_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id),
    property_id INTEGER NOT NULL REFERENCES properties(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, property_id)
);

-- 15. OWNERSHIP ACCOUNTS TABLE
CREATE TABLE ownership_accounts (
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

-- 16. ASSOCIATION MEMBERSHIPS TABLE
CREATE TABLE association_memberships (
    id SERIAL PRIMARY KEY,
    association_id INTEGER REFERENCES associations(id),
    user_type VARCHAR(20),
    owner_id INTEGER REFERENCES "user"(id),
    tenant_id INTEGER REFERENCES tenants(id),
    joined_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 17. ASSOCIATION BALANCES TABLE
CREATE TABLE association_balances (
    id SERIAL PRIMARY KEY,
    membership_id INTEGER REFERENCES association_memberships(id),
    amount_due NUMERIC(10, 2),
    due_date DATE,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. VIOLATIONS TABLE
CREATE TABLE violations (
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

-- 19. LISTINGS TABLE
CREATE TABLE listings (
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

-- 20. APPLICANTS TABLE
CREATE TABLE applicants (
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

-- Create indexes for better performance
CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_tenants_property_id ON tenants(property_id);
CREATE INDEX idx_maintenance_requests_property_id ON maintenance_requests(property_id);
CREATE INDEX idx_maintenance_requests_tenant_id ON maintenance_requests(tenant_id);
CREATE INDEX idx_maintenance_requests_vendor_id ON maintenance_requests(assigned_vendor_id);
CREATE INDEX idx_financial_transactions_property_id ON financial_transactions(property_id);
CREATE INDEX idx_property_financials_property_id ON property_financials(property_id);
CREATE INDEX idx_loan_payments_property_financial_id ON loan_payments(property_financial_id);
CREATE INDEX idx_rent_roll_tenant_id ON rent_roll(tenant_id);
CREATE INDEX idx_rent_roll_property_id ON rent_roll(property_id);
CREATE INDEX idx_outstanding_balances_tenant_id ON outstanding_balances(tenant_id);
CREATE INDEX idx_vendors_user_id ON vendors(user_id);
CREATE INDEX idx_listings_property_id ON listings(property_id);
CREATE INDEX idx_applicants_listing_id ON applicants(listing_id);

-- Add comments to tables
COMMENT ON TABLE "user" IS 'User accounts for property owners, tenants, and vendors';
COMMENT ON TABLE properties IS 'Property listings with details and status';
COMMENT ON TABLE tenants IS 'Tenant information and lease details';
COMMENT ON TABLE maintenance_requests IS 'Maintenance requests and their status';
COMMENT ON TABLE vendors IS 'Vendor profiles and contact information';
COMMENT ON TABLE property_financials IS 'Financial details for each property';
COMMENT ON TABLE financial_transactions IS 'All financial transactions for properties';
COMMENT ON TABLE associations IS 'Homeowner associations';
COMMENT ON TABLE listings IS 'Property listings for rent';
COMMENT ON TABLE applicants IS 'Applicants for property listings';

-- Success message
SELECT 'All tables created successfully!' as status;
