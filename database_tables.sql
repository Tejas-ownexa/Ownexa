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
    rental_owner_id INTEGER REFERENCES rental_owners(id) ON DELETE CASCADE,
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
    rent_payment_day INTEGER DEFAULT 1,
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



-- 8. VENDOR CATEGORIES TABLE
CREATE TABLE vendor_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_deletable BOOLEAN DEFAULT TRUE,
    created_by_user_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO vendor_categories (name, description, is_deletable) VALUES 
('Uncategorized', 'Default category for vendors without specific classification', FALSE),
('Plumbing', 'Plumbing contractors and services', TRUE),
('Electrical', 'Electrical contractors and services', TRUE),
('HVAC', 'Heating, Ventilation, and Air Conditioning services', TRUE),
('Landscaping', 'Landscaping and grounds maintenance services', TRUE),
('Cleaning', 'Cleaning and janitorial services', TRUE);

-- 9. VENDORS TABLE (Enhanced)
CREATE TABLE vendors (
    id SERIAL PRIMARY KEY,
    created_by_user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    
    -- Basic Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company_name VARCHAR(255),
    is_company BOOLEAN DEFAULT FALSE,
    category_id INTEGER REFERENCES vendor_categories(id) ON DELETE SET NULL,
    expense_account VARCHAR(100),
    account_number VARCHAR(50),
    
    -- Contact Information
    primary_email VARCHAR(120) NOT NULL,
    alternate_email VARCHAR(120),
    phone_1 VARCHAR(20),
    phone_2 VARCHAR(20),
    phone_3 VARCHAR(20),
    phone_4 VARCHAR(20),
    
    -- Address Information
    street_address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'United States',
    website VARCHAR(255),
    comments TEXT,
    
    -- Tax Filing Information (1099-NEC)
    tax_id_type VARCHAR(20), -- 'ssn', 'ein', 'itin'
    taxpayer_id VARCHAR(50),
    use_different_name BOOLEAN DEFAULT FALSE,
    use_different_address BOOLEAN DEFAULT FALSE,
    
    -- Insurance Information
    insurance_provider VARCHAR(255),
    policy_number VARCHAR(100),
    insurance_expiration_date VARCHAR(20), -- Format: m/yyyy
    
    -- System Fields
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. WORK ORDERS TABLE
CREATE TABLE work_orders (
    id SERIAL PRIMARY KEY,
    work_order_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Property and Unit Information
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_number VARCHAR(50),
    
    -- Work Order Details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    status VARCHAR(50) NOT NULL DEFAULT 'new', -- 'new', 'in_progress', 'complete', 'cancelled'
    category VARCHAR(100), -- 'plumbing', 'electrical', 'hvac', etc.
    
    -- Assignment and Scheduling
    assigned_to_user_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL,
    assigned_vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
    due_date DATE,
    scheduled_date DATE,
    completed_date DATE,
    
    -- Financial Information
    estimated_cost NUMERIC(10, 2),
    actual_cost NUMERIC(10, 2),
    bill_total NUMERIC(10, 2),
    bill_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'submitted', 'approved', 'paid'
    
    -- Timestamps and Tracking
    created_by_user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    age_days INTEGER GENERATED ALWAYS AS (EXTRACT(days FROM CURRENT_DATE - created_at::date)) STORED,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional Fields
    notes TEXT,
    vendor_notes TEXT,
    work_to_be_performed TEXT,
    entry_details VARCHAR(255),
    entry_contact VARCHAR(255),
    work_hours NUMERIC(8, 2),
    charge_hours_to VARCHAR(255),
    is_emergency BOOLEAN DEFAULT FALSE,
    tenant_notified BOOLEAN DEFAULT FALSE,
    photos_required BOOLEAN DEFAULT FALSE
);

-- Add trigger to update work_order_number automatically
CREATE OR REPLACE FUNCTION generate_work_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.work_order_number IS NULL OR NEW.work_order_number = '' THEN
        NEW.work_order_number = 'WO-' || LPAD(NEW.id::text, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_work_order_number
    BEFORE INSERT ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_work_order_number();

-- Add trigger to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_work_order_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_work_order_timestamp
    BEFORE UPDATE ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_work_order_timestamp();

-- 11. WORK ORDER PARTS AND LABOR TABLE
CREATE TABLE work_order_parts (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    qty INTEGER DEFAULT 0,
    account VARCHAR(255),
    description TEXT,
    unit_price NUMERIC(10, 2) DEFAULT 0.00,
    total_price NUMERIC(10, 2) DEFAULT 0.00,
    line_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. WORK ORDER FILES TABLE
CREATE TABLE work_order_files (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    uploaded_by_user_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. TASKS TABLE (for task management)
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    task_name VARCHAR(255) NOT NULL,
    task_type VARCHAR(100), -- 'maintenance', 'repair', 'inspection', 'emergency'
    description TEXT,
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    assigned_to_user_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    start_date DATE,
    end_date DATE,
    created_by_user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. WORK ORDER TASKS RELATIONSHIP TABLE
CREATE TABLE work_order_tasks (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(work_order_id, task_id)
);

-- 15. MAINTENANCE REQUESTS TABLE
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
    manager VARCHAR(255),
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

-- 21. LEASE ROLL TABLE (for Rent Roll page)
CREATE TABLE lease_roll (
    id SERIAL PRIMARY KEY,
    lease VARCHAR(255) NOT NULL,
    lease_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    type VARCHAR(100) NOT NULL DEFAULT 'Fixed w/rollover',
    lease_dates VARCHAR(100) NOT NULL,
    days_left VARCHAR(50),
    rent VARCHAR(50),
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    owner_id INTEGER REFERENCES "user"(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 22. RENTAL OWNERS TABLE (for companies/organizations that own properties)
CREATE TABLE rental_owners (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100),
    tax_id VARCHAR(50),
    business_address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    phone_number VARCHAR(20),
    email VARCHAR(120),
    website VARCHAR(255),
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(120),
    bank_account_info TEXT,
    insurance_info TEXT,
    management_fee_percentage NUMERIC(5, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 23. RENTAL OWNER MANAGERS TABLE (users who manage rental owners)
CREATE TABLE rental_owner_managers (
    id SERIAL PRIMARY KEY,
    rental_owner_id INTEGER NOT NULL REFERENCES rental_owners(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'MANAGER', -- MANAGER, ADMIN, VIEWER
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rental_owner_id, user_id)
);

-- 24. RENTAL OWNER PROFILES TABLE (for Rental Owners page - legacy, can be removed later)
CREATE TABLE rental_owner_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    business_type VARCHAR(100),
    tax_id VARCHAR(50),
    business_address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_email VARCHAR(120),
    bank_account_info TEXT,
    insurance_info TEXT,
    agreement_start_date DATE,
    agreement_end_date DATE,
    management_fee_percentage NUMERIC(5, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 23. LEASE AGREEMENTS TABLE (for detailed lease management)
CREATE TABLE lease_agreements (
    id SERIAL PRIMARY KEY,
    lease_roll_id INTEGER REFERENCES lease_roll(id) ON DELETE CASCADE,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    owner_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    lease_number VARCHAR(50) UNIQUE NOT NULL,
    lease_type VARCHAR(50) NOT NULL DEFAULT 'Fixed',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    rent_amount NUMERIC(10, 2) NOT NULL,
    security_deposit NUMERIC(10, 2) DEFAULT 0.00,
    late_fee_amount NUMERIC(8, 2) DEFAULT 0.00,
    late_fee_days INTEGER DEFAULT 5,
    utilities_included BOOLEAN DEFAULT FALSE,
    pet_policy TEXT,
    parking_spaces INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    renewal_terms TEXT,
    special_conditions TEXT,
    signed_date DATE,
    signed_by_tenant BOOLEAN DEFAULT FALSE,
    signed_by_owner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 24. LEASE PAYMENTS TABLE (for tracking lease payments)
CREATE TABLE lease_payments (
    id SERIAL PRIMARY KEY,
    lease_agreement_id INTEGER REFERENCES lease_agreements(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    due_date DATE NOT NULL,
    amount_due NUMERIC(10, 2) NOT NULL,
    amount_paid NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'Paid',
    late_fees NUMERIC(8, 2) DEFAULT 0.00,
    notes TEXT,
    receipt_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 25. LEASE RENEWALS TABLE (for tracking lease renewals)
CREATE TABLE lease_renewals (
    id SERIAL PRIMARY KEY,
    original_lease_id INTEGER REFERENCES lease_agreements(id) ON DELETE CASCADE,
    new_lease_id INTEGER REFERENCES lease_agreements(id) ON DELETE CASCADE,
    renewal_date DATE NOT NULL,
    rent_change_amount NUMERIC(10, 2) DEFAULT 0.00,
    rent_change_percentage NUMERIC(5, 2) DEFAULT 0.00,
    renewal_terms TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    approved_by_tenant BOOLEAN DEFAULT FALSE,
    approved_by_owner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 26. PROPERTY UNIT DETAILS TABLE (for Listed Units - detailed property information)
CREATE TABLE property_unit_details (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_number VARCHAR(50), -- Unit identifier (if applicable)
    bedrooms INTEGER NOT NULL DEFAULT 0,
    bathrooms NUMERIC(3,1) NOT NULL DEFAULT 0.0, -- Allows for 1.5, 2.5, etc.
    square_feet INTEGER, -- Property size in square feet
    unit_type VARCHAR(50) DEFAULT 'Apartment', -- Apartment, House, Condo, etc.
    floor_number INTEGER, -- Floor number (for multi-story buildings)
    amenities TEXT, -- JSON or comma-separated list of amenities
    parking_spaces INTEGER DEFAULT 0,
    storage_unit BOOLEAN DEFAULT FALSE,
    balcony_patio BOOLEAN DEFAULT FALSE,
    furnished BOOLEAN DEFAULT FALSE,
    pet_friendly BOOLEAN DEFAULT FALSE,
    laundry_type VARCHAR(50), -- In-unit, Shared, None
    hvac_type VARCHAR(50), -- Central, Window, None
    flooring_type VARCHAR(100), -- Hardwood, Carpet, Tile, etc.
    appliances_included TEXT, -- List of included appliances
    utilities_included TEXT, -- List of utilities included in rent
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 27. PROPERTY LISTING STATUS TABLE (for tracking listed vs unlisted status)
CREATE TABLE property_listing_status (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    is_listed BOOLEAN NOT NULL DEFAULT FALSE,
    listing_date DATE, -- Date when property was listed
    listing_rent NUMERIC(10, 2), -- Listed rent amount (may differ from actual rent)
    listing_status VARCHAR(50) DEFAULT 'Draft', -- Draft, Active, Paused, Expired
    availability_date DATE, -- When the property becomes available
    listing_description TEXT, -- Marketing description for listing
    listing_photos TEXT, -- JSON array of photo URLs
    marketing_channels TEXT, -- Where the property is listed (websites, etc.)
    listing_agent_id INTEGER REFERENCES "user"(id), -- Who manages the listing
    
    -- Lease transition information (for unlisted units)
    current_lease_end DATE, -- When current lease ends
    next_lease_start DATE, -- When next lease starts (if scheduled)
    lease_transition_status VARCHAR(50), -- Active, Ending Soon, Vacant, Maintenance
    current_tenant_names TEXT, -- Names of current tenants
    lease_renewal_option BOOLEAN DEFAULT TRUE, -- Whether renewal is possible
    rent_increase_amount NUMERIC(10, 2) DEFAULT 0.00, -- Planned rent increase
    
    -- Marketing metrics
    listing_views INTEGER DEFAULT 0,
    inquiries_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one status record per property
    UNIQUE(property_id)
);

-- 28. LEASING APPLICANTS TABLE (for tracking applicants to listed properties)
CREATE TABLE leasing_applicants (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    
    -- Applicant information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL,
    phone_number VARCHAR(20),
    
    -- Unit information (for Individual view)
    unit_number VARCHAR(50), -- Specific unit they're applying for
    
    -- Application details
    application_date DATE NOT NULL DEFAULT CURRENT_DATE,
    application_received DATE NOT NULL DEFAULT CURRENT_DATE, -- When application was first received
    move_in_date DATE,
    desired_lease_term INTEGER, -- Months
    monthly_income NUMERIC(10, 2),
    employment_status VARCHAR(50),
    employer_name VARCHAR(100),
    
    -- Application status and workflow (for Individual view)
    application_status VARCHAR(50) NOT NULL DEFAULT 'Submitted', -- Submitted, Under Review, Approved, Rejected, Withdrawn
    stage_in_process VARCHAR(100) DEFAULT 'Application Submitted', -- Current stage: Application Submitted, Background Check, Reference Verification, Final Review, etc.
    background_check_status VARCHAR(50) DEFAULT 'Pending', -- Pending, Completed, Failed
    credit_score INTEGER,
    references_checked BOOLEAN DEFAULT FALSE,
    
    -- Decision information
    approved_by INTEGER REFERENCES "user"(id), -- Who approved/rejected
    approval_date DATE,
    rejection_reason TEXT,
    notes TEXT,
    
    -- Workflow tracking
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- When application was last modified
    workflow_stage_history TEXT, -- JSON array of stage changes with timestamps
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 29. LEASE DRAFTS TABLE (for Draft Lease functionality)
CREATE TABLE lease_drafts (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    applicant_id INTEGER REFERENCES leasing_applicants(id) ON DELETE SET NULL,
    created_by INTEGER NOT NULL REFERENCES "user"(id),
    
    -- Draft lease details
    draft_name VARCHAR(255) NOT NULL,
    lease_type VARCHAR(50) NOT NULL DEFAULT 'Fixed Term', -- Fixed Term, Month-to-Month, etc.
    lease_start_date DATE,
    lease_end_date DATE,
    lease_term_months INTEGER,
    
    -- Financial terms
    monthly_rent NUMERIC(10, 2) NOT NULL,
    security_deposit NUMERIC(10, 2) DEFAULT 0.00,
    first_month_rent NUMERIC(10, 2),
    last_month_rent NUMERIC(10, 2) DEFAULT 0.00,
    pet_deposit NUMERIC(8, 2) DEFAULT 0.00,
    application_fee NUMERIC(8, 2) DEFAULT 0.00,
    
    -- Lease terms
    late_fee_amount NUMERIC(8, 2) DEFAULT 0.00,
    late_fee_grace_days INTEGER DEFAULT 5,
    utilities_tenant_pays TEXT, -- JSON or comma-separated list
    utilities_landlord_pays TEXT,
    parking_included BOOLEAN DEFAULT FALSE,
    pet_policy TEXT,
    subletting_allowed BOOLEAN DEFAULT FALSE,
    smoking_allowed BOOLEAN DEFAULT FALSE,
    
    -- Custom terms and conditions
    special_terms TEXT,
    custom_clauses TEXT,
    
    -- Draft status
    draft_status VARCHAR(50) NOT NULL DEFAULT 'Draft', -- Draft, Ready for Review, Sent to Tenant, Signed
    version_number INTEGER DEFAULT 1,
    is_template BOOLEAN DEFAULT FALSE, -- Can be saved as template for future use
    
    -- Approval workflow
    reviewed_by INTEGER REFERENCES "user"(id),
    review_date DATE,
    review_notes TEXT,
    approved_for_sending BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 30. APPLICANT GROUPS TABLE (for tracking grouped applications)
CREATE TABLE applicant_groups (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    
    -- Group information
    group_name VARCHAR(255), -- Optional group identifier
    unit_number VARCHAR(50), -- Unit they're applying for as a group
    
    -- Group status and progress (for Group view)
    group_status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- Active, Pending, Inactive, Approved, Rejected
    percent_complete INTEGER DEFAULT 0 CHECK (percent_complete >= 0 AND percent_complete <= 100), -- Progress percentage 0-100
    
    -- Group workflow tracking
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- When group was last modified
    completion_milestones TEXT, -- JSON object tracking completion stages
    
    -- Group settings
    max_members INTEGER DEFAULT NULL, -- Maximum allowed members (NULL = unlimited)
    is_joint_application BOOLEAN DEFAULT TRUE, -- Whether this is a joint application or separate applications
    primary_applicant_id INTEGER REFERENCES leasing_applicants(id), -- Lead applicant for the group
    
    -- Group notes and history
    group_notes TEXT,
    status_change_history TEXT, -- JSON array of status changes with timestamps
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 31. APPLICANT GROUP MEMBERS TABLE (many-to-many relationship)
CREATE TABLE applicant_group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES applicant_groups(id) ON DELETE CASCADE,
    applicant_id INTEGER NOT NULL REFERENCES leasing_applicants(id) ON DELETE CASCADE,
    
    -- Member role in group
    member_role VARCHAR(50) DEFAULT 'Member', -- Primary, Co-applicant, Member, Guarantor
    is_primary BOOLEAN DEFAULT FALSE, -- Whether this is the primary contact for the group
    
    -- Member-specific status
    member_status VARCHAR(50) DEFAULT 'Active', -- Active, Inactive, Removed
    joined_date DATE DEFAULT CURRENT_DATE,
    removed_date DATE,
    removal_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique group-applicant pairs
    UNIQUE(group_id, applicant_id)
);

-- 32. DRAFT LEASE APPROVED APPLICANTS TABLE (for approved applicants in draft lease)
CREATE TABLE draft_lease_approved_applicants (
    id SERIAL PRIMARY KEY,
    lease_draft_id INTEGER NOT NULL REFERENCES lease_drafts(id) ON DELETE CASCADE,
    applicant_id INTEGER REFERENCES leasing_applicants(id) ON DELETE SET NULL,
    
    -- Applicant details (stored separately in case applicant is deleted)
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120),
    phone_number VARCHAR(20),
    
    -- Move-in details
    move_in_date DATE,
    relationship_to_primary VARCHAR(50), -- Primary, Spouse, Roommate, Child, etc.
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 33. DRAFT LEASE RECURRING CHARGES TABLE (for recurring charges in draft lease)
CREATE TABLE draft_lease_recurring_charges (
    id SERIAL PRIMARY KEY,
    lease_draft_id INTEGER NOT NULL REFERENCES lease_drafts(id) ON DELETE CASCADE,
    
    -- Charge details
    account VARCHAR(100) NOT NULL, -- maintenance, utilities, parking, pet-fee, other
    next_due_date DATE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    memo TEXT,
    frequency VARCHAR(50) NOT NULL DEFAULT 'monthly', -- weekly, bi-weekly, monthly, quarterly, yearly
    
    -- Status and tracking
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES "user"(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 34. DRAFT LEASE ONE-TIME CHARGES TABLE (for one-time charges in draft lease)
CREATE TABLE draft_lease_one_time_charges (
    id SERIAL PRIMARY KEY,
    lease_draft_id INTEGER NOT NULL REFERENCES lease_drafts(id) ON DELETE CASCADE,
    
    -- Charge details
    account VARCHAR(100) NOT NULL, -- maintenance, utilities, parking, pet-fee, security-deposit, cleaning-fee, other
    due_date DATE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    memo TEXT,
    
    -- Status and tracking
    is_paid BOOLEAN DEFAULT FALSE,
    payment_date DATE,
    payment_method VARCHAR(50),
    created_by INTEGER REFERENCES "user"(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 35. DRAFT LEASE RENT CHARGES TABLE (for rent splitting in draft lease)
CREATE TABLE draft_lease_rent_charges (
    id SERIAL PRIMARY KEY,
    lease_draft_id INTEGER NOT NULL REFERENCES lease_drafts(id) ON DELETE CASCADE,
    
    -- Rent splitting details
    charge_name VARCHAR(100) NOT NULL, -- e.g., "Primary Rent", "Prorated Rent", "Split Rent"
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    percentage_of_total NUMERIC(5, 2) DEFAULT 100.00, -- Percentage of total rent (0-100)
    is_prorated BOOLEAN DEFAULT FALSE,
    proration_days INTEGER, -- If prorated, number of days
    proration_start_date DATE,
    proration_end_date DATE,
    
    -- Responsible party
    responsible_applicant_id INTEGER REFERENCES draft_lease_approved_applicants(id) ON DELETE SET NULL,
    responsibility_percentage NUMERIC(5, 2) DEFAULT 100.00, -- How much of this charge this applicant pays
    
    -- Payment details
    due_date DATE,
    due_day_of_month INTEGER DEFAULT 1, -- Recurring payment day (1-31)
    memo TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 36. DRAFT LEASE MOVE_IN_CHARGES TABLE (for move-in charges in draft lease)
CREATE TABLE draft_lease_move_in_charges (
    id SERIAL PRIMARY KEY,
    lease_draft_id INTEGER NOT NULL REFERENCES lease_drafts(id) ON DELETE CASCADE,
    
    -- Move-in charge details
    charge_type VARCHAR(100) NOT NULL, -- security-deposit, first-month-rent, last-month-rent, pet-deposit, application-fee, cleaning-fee, key-deposit, other
    charge_name VARCHAR(100) NOT NULL, -- Display name for the charge
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    
    -- Due date and payment tracking
    due_date DATE, -- When this charge is due (usually before move-in)
    is_required BOOLEAN DEFAULT TRUE, -- Whether this charge is mandatory
    is_refundable BOOLEAN DEFAULT FALSE, -- Whether this charge is refundable
    refund_conditions TEXT, -- Conditions for refund (if applicable)
    
    -- Payment tracking
    is_paid BOOLEAN DEFAULT FALSE,
    payment_date DATE,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    
    -- Responsible party
    responsible_applicant_id INTEGER REFERENCES draft_lease_approved_applicants(id) ON DELETE SET NULL,
    memo TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 37. DRAFT LEASE SIGNATURES TABLE (for tracking signature status)
CREATE TABLE draft_lease_signatures (
    id SERIAL PRIMARY KEY,
    lease_draft_id INTEGER NOT NULL REFERENCES lease_drafts(id) ON DELETE CASCADE,
    
    -- Signature tracking
    signature_status VARCHAR(50) NOT NULL DEFAULT 'unsigned', -- signed, unsigned
    esignature_status VARCHAR(50) DEFAULT 'not-sent', -- not-sent, sent, pending, signed, declined
    lease_status VARCHAR(50) DEFAULT 'draft', -- draft, ready-for-signature, active, expired, terminated
    agent_id INTEGER REFERENCES "user"(id), -- Leasing agent responsible
    
    -- Signature dates and tracking
    esignature_sent_date TIMESTAMP,
    esignature_signed_date TIMESTAMP,
    signature_ip_address INET, -- IP address where signature was made
    signature_location VARCHAR(255), -- Geographic location of signature
    
    -- Document management
    original_document_url VARCHAR(500), -- URL to original unsigned document
    signed_document_url VARCHAR(500), -- URL to final signed document
    esignature_provider VARCHAR(50), -- DocuSign, HelloSign, Adobe Sign, etc.
    esignature_envelope_id VARCHAR(255), -- Provider's envelope/document ID
    
    -- Notifications and reminders
    reminder_count INTEGER DEFAULT 0,
    last_reminder_sent TIMESTAMP,
    notification_email VARCHAR(120), -- Email for notifications
    
    -- Execution details
    execution_method VARCHAR(50) DEFAULT 'electronic', -- electronic, wet-signature, notarized
    notary_required BOOLEAN DEFAULT FALSE,
    witness_required BOOLEAN DEFAULT FALSE,
    notary_info TEXT, -- Notary details if required
    witness_info TEXT, -- Witness details if required
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance

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
-- Vendor related indexes
CREATE INDEX idx_vendor_categories_name ON vendor_categories(name);
CREATE INDEX idx_vendor_categories_created_by ON vendor_categories(created_by_user_id);
CREATE INDEX idx_vendors_created_by_user ON vendors(created_by_user_id);
CREATE INDEX idx_vendors_category ON vendors(category_id);
CREATE INDEX idx_vendors_primary_email ON vendors(primary_email);
CREATE INDEX idx_vendors_first_last_name ON vendors(first_name, last_name);
CREATE INDEX idx_vendors_company_name ON vendors(company_name);
CREATE INDEX idx_vendors_active ON vendors(is_active);
-- Work Orders indexes
CREATE INDEX idx_work_orders_property_id ON work_orders(property_id);
CREATE INDEX idx_work_orders_assigned_user ON work_orders(assigned_to_user_id);
CREATE INDEX idx_work_orders_assigned_vendor ON work_orders(assigned_vendor_id);
CREATE INDEX idx_work_orders_created_by ON work_orders(created_by_user_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_priority ON work_orders(priority);
CREATE INDEX idx_work_orders_due_date ON work_orders(due_date);
CREATE INDEX idx_work_orders_work_order_number ON work_orders(work_order_number);
CREATE INDEX idx_work_orders_created_at ON work_orders(created_at);
-- Work Order Parts indexes
CREATE INDEX idx_work_order_parts_work_order_id ON work_order_parts(work_order_id);
CREATE INDEX idx_work_order_parts_line_order ON work_order_parts(work_order_id, line_order);
-- Work Order Files indexes
CREATE INDEX idx_work_order_files_work_order_id ON work_order_files(work_order_id);
CREATE INDEX idx_work_order_files_uploaded_by ON work_order_files(uploaded_by_user_id);
-- Tasks indexes
CREATE INDEX idx_tasks_property_id ON tasks(property_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to_user_id);
CREATE INDEX idx_tasks_created_by ON tasks(created_by_user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_task_type ON tasks(task_type);
-- Work Order Tasks relationship indexes
CREATE INDEX idx_work_order_tasks_work_order_id ON work_order_tasks(work_order_id);
CREATE INDEX idx_work_order_tasks_task_id ON work_order_tasks(task_id);
CREATE INDEX idx_listings_property_id ON listings(property_id);
CREATE INDEX idx_applicants_listing_id ON applicants(listing_id);
CREATE INDEX idx_lease_roll_property_id ON lease_roll(property_id);
CREATE INDEX idx_lease_roll_tenant_id ON lease_roll(tenant_id);
CREATE INDEX idx_lease_roll_owner_id ON lease_roll(owner_id);
CREATE INDEX idx_rental_owners_company_name ON rental_owners(company_name);
CREATE INDEX idx_rental_owner_managers_rental_owner_id ON rental_owner_managers(rental_owner_id);
CREATE INDEX idx_rental_owner_managers_user_id ON rental_owner_managers(user_id);
CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_rental_owner_profiles_user_id ON rental_owner_profiles(user_id);
CREATE INDEX idx_lease_agreements_property_id ON lease_agreements(property_id);
CREATE INDEX idx_lease_agreements_tenant_id ON lease_agreements(tenant_id);
CREATE INDEX idx_lease_agreements_owner_id ON lease_agreements(owner_id);
CREATE INDEX idx_lease_payments_lease_agreement_id ON lease_payments(lease_agreement_id);
CREATE INDEX idx_lease_renewals_original_lease_id ON lease_renewals(original_lease_id);
CREATE INDEX idx_lease_renewals_new_lease_id ON lease_renewals(new_lease_id);
CREATE INDEX idx_property_unit_details_property_id ON property_unit_details(property_id);
CREATE INDEX idx_property_listing_status_property_id ON property_listing_status(property_id);
CREATE INDEX idx_property_listing_status_is_listed ON property_listing_status(is_listed);
CREATE INDEX idx_property_listing_status_listing_status ON property_listing_status(listing_status);
CREATE INDEX idx_leasing_applicants_property_id ON leasing_applicants(property_id);
CREATE INDEX idx_leasing_applicants_listing_status_id ON leasing_applicants(listing_status_id);
CREATE INDEX idx_leasing_applicants_application_status ON leasing_applicants(application_status);
CREATE INDEX idx_lease_drafts_property_id ON lease_drafts(property_id);
CREATE INDEX idx_lease_drafts_applicant_id ON lease_drafts(applicant_id);
CREATE INDEX idx_lease_drafts_created_by ON lease_drafts(created_by);
CREATE INDEX idx_lease_drafts_draft_status ON lease_drafts(draft_status);
CREATE INDEX idx_leasing_applicants_unit_number ON leasing_applicants(unit_number);
CREATE INDEX idx_leasing_applicants_stage_in_process ON leasing_applicants(stage_in_process);
CREATE INDEX idx_leasing_applicants_last_updated ON leasing_applicants(last_updated);
CREATE INDEX idx_leasing_applicants_application_received ON leasing_applicants(application_received);
CREATE INDEX idx_applicant_groups_property_id ON applicant_groups(property_id);
CREATE INDEX idx_applicant_groups_unit_number ON applicant_groups(unit_number);
CREATE INDEX idx_applicant_groups_group_status ON applicant_groups(group_status);
CREATE INDEX idx_applicant_groups_percent_complete ON applicant_groups(percent_complete);
CREATE INDEX idx_applicant_groups_last_updated ON applicant_groups(last_updated);
CREATE INDEX idx_applicant_groups_primary_applicant_id ON applicant_groups(primary_applicant_id);
CREATE INDEX idx_applicant_group_members_group_id ON applicant_group_members(group_id);
CREATE INDEX idx_applicant_group_members_applicant_id ON applicant_group_members(applicant_id);
CREATE INDEX idx_applicant_group_members_member_role ON applicant_group_members(member_role);
CREATE INDEX idx_applicant_group_members_member_status ON applicant_group_members(member_status);
CREATE INDEX idx_draft_lease_approved_applicants_lease_draft_id ON draft_lease_approved_applicants(lease_draft_id);
CREATE INDEX idx_draft_lease_approved_applicants_applicant_id ON draft_lease_approved_applicants(applicant_id);
CREATE INDEX idx_draft_lease_recurring_charges_lease_draft_id ON draft_lease_recurring_charges(lease_draft_id);
CREATE INDEX idx_draft_lease_recurring_charges_account ON draft_lease_recurring_charges(account);
CREATE INDEX idx_draft_lease_recurring_charges_next_due_date ON draft_lease_recurring_charges(next_due_date);
CREATE INDEX idx_draft_lease_one_time_charges_lease_draft_id ON draft_lease_one_time_charges(lease_draft_id);
CREATE INDEX idx_draft_lease_one_time_charges_account ON draft_lease_one_time_charges(account);
CREATE INDEX idx_draft_lease_one_time_charges_due_date ON draft_lease_one_time_charges(due_date);
CREATE INDEX idx_draft_lease_rent_charges_lease_draft_id ON draft_lease_rent_charges(lease_draft_id);
CREATE INDEX idx_draft_lease_rent_charges_responsible_applicant_id ON draft_lease_rent_charges(responsible_applicant_id);
CREATE INDEX idx_draft_lease_move_in_charges_lease_draft_id ON draft_lease_move_in_charges(lease_draft_id);
CREATE INDEX idx_draft_lease_move_in_charges_charge_type ON draft_lease_move_in_charges(charge_type);
CREATE INDEX idx_draft_lease_move_in_charges_responsible_applicant_id ON draft_lease_move_in_charges(responsible_applicant_id);
CREATE INDEX idx_draft_lease_signatures_lease_draft_id ON draft_lease_signatures(lease_draft_id);
CREATE INDEX idx_draft_lease_signatures_signature_status ON draft_lease_signatures(signature_status);
CREATE INDEX idx_draft_lease_signatures_esignature_status ON draft_lease_signatures(esignature_status);
CREATE INDEX idx_draft_lease_signatures_lease_status ON draft_lease_signatures(lease_status);

-- Add comments to tables
COMMENT ON TABLE "user" IS 'User accounts for property owners, tenants, and vendors';
COMMENT ON TABLE properties IS 'Property listings with details and status';
COMMENT ON TABLE tenants IS 'Tenant information and lease details';
COMMENT ON TABLE maintenance_requests IS 'Maintenance requests and their status';
COMMENT ON TABLE vendor_categories IS 'Categories for organizing vendors by service type';
COMMENT ON TABLE vendors IS 'Comprehensive vendor profiles with contact, tax, and insurance information';
COMMENT ON TABLE work_orders IS 'Work orders for property maintenance and repairs with tracking and billing';
COMMENT ON TABLE work_order_parts IS 'Parts and labor line items for work orders with pricing and quantities';
COMMENT ON TABLE work_order_files IS 'File attachments for work orders (photos, documents, etc.)';
COMMENT ON TABLE tasks IS 'Task management for organizing and grouping work orders';
COMMENT ON TABLE work_order_tasks IS 'Many-to-many relationship between work orders and tasks';
COMMENT ON TABLE property_financials IS 'Financial details for each property';
COMMENT ON TABLE financial_transactions IS 'All financial transactions for properties';
COMMENT ON TABLE associations IS 'Homeowner associations';
COMMENT ON TABLE listings IS 'Property listings for rent';
COMMENT ON TABLE applicants IS 'Applicants for property listings';
COMMENT ON TABLE lease_roll IS 'Lease roll data for rent roll management';
COMMENT ON TABLE rental_owners IS 'Companies/organizations that own properties';
COMMENT ON TABLE rental_owner_managers IS 'Users who manage rental owner companies';
COMMENT ON TABLE rental_owner_profiles IS 'Detailed profiles for rental owners';
COMMENT ON TABLE lease_agreements IS 'Detailed lease agreements and terms';
COMMENT ON TABLE lease_payments IS 'Payment tracking for lease agreements';
COMMENT ON TABLE lease_renewals IS 'Lease renewal tracking and history';
COMMENT ON TABLE property_unit_details IS 'Detailed property specifications including beds, baths, size, and amenities';
COMMENT ON TABLE property_listing_status IS 'Property listing status, availability, and lease transition information';
COMMENT ON TABLE leasing_applicants IS 'Individual applicants with workflow tracking, stage progression, and detailed status';
COMMENT ON TABLE lease_drafts IS 'Draft lease agreements for properties with terms and approval workflow';
COMMENT ON TABLE applicant_groups IS 'Grouped applications with progress tracking and completion percentages';
COMMENT ON TABLE applicant_group_members IS 'Many-to-many relationship linking applicants to groups with member roles';
COMMENT ON TABLE draft_lease_approved_applicants IS 'Approved applicants associated with draft leases including move-in details';
COMMENT ON TABLE draft_lease_recurring_charges IS 'Recurring charges configured for draft leases (utilities, maintenance, etc.)';
COMMENT ON TABLE draft_lease_one_time_charges IS 'One-time charges configured for draft leases (deposits, fees, etc.)';
COMMENT ON TABLE draft_lease_rent_charges IS 'Rent splitting and proration details for draft leases';
COMMENT ON TABLE draft_lease_move_in_charges IS 'Move-in charges and deposits required before tenant occupancy';
COMMENT ON TABLE draft_lease_signatures IS 'Electronic signature tracking and document management for draft leases';

-- 38. WAREHOUSES TABLE
CREATE TABLE warehouses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    total_square_feet INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    owner_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    purchase_price NUMERIC(15, 2),
    total_value NUMERIC(15, 2),
    mortgage_amount NUMERIC(15, 2),
    loan_term INTEGER,
    down_payment NUMERIC(15, 2),
    interest_rate NUMERIC(5, 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 39. ASSOCIATION MANAGERS TABLE
CREATE TABLE association_managers (
    id SERIAL PRIMARY KEY,
    association_id INTEGER NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 40. ASSOCIATION PROPERTY ASSIGNMENTS TABLE
CREATE TABLE association_property_assignments (
    id SERIAL PRIMARY KEY,
    association_id INTEGER NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    hoa_fees NUMERIC(10, 2),
    special_assessment NUMERIC(10, 2),
    ship_street_address_1 VARCHAR(255),
    ship_street_address_2 VARCHAR(255),
    ship_city VARCHAR(100),
    ship_state VARCHAR(100),
    ship_zip_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 41. ACCOUNTABILITY FINANCIALS TABLE
CREATE TABLE accountability_financials (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    financial_year INTEGER NOT NULL,
    financial_period VARCHAR(20) NOT NULL,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    total_rental_income NUMERIC(12, 2) DEFAULT 0,
    other_income NUMERIC(12, 2) DEFAULT 0,
    total_income NUMERIC(12, 2) DEFAULT 0,
    mortgage_payments NUMERIC(12, 2) DEFAULT 0,
    property_taxes NUMERIC(12, 2) DEFAULT 0,
    insurance_costs NUMERIC(12, 2) DEFAULT 0,
    maintenance_costs NUMERIC(12, 2) DEFAULT 0,
    utilities NUMERIC(12, 2) DEFAULT 0,
    hoa_fees NUMERIC(12, 2) DEFAULT 0,
    property_management_fees NUMERIC(12, 2) DEFAULT 0,
    other_expenses NUMERIC(12, 2) DEFAULT 0,
    total_expenses NUMERIC(12, 2) DEFAULT 0,
    net_income NUMERIC(12, 2) DEFAULT 0,
    cash_flow NUMERIC(12, 2) DEFAULT 0,
    roi_percentage NUMERIC(5, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 42. GENERAL LEDGER TABLE
CREATE TABLE general_ledger (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transaction_type VARCHAR(50) NOT NULL,
    account_category VARCHAR(100) NOT NULL,
    account_subcategory VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    running_balance NUMERIC(12, 2) NOT NULL,
    reference_number VARCHAR(100),
    description TEXT NOT NULL,
    notes TEXT,
    posted_by VARCHAR(100),
    approved_by VARCHAR(100),
    approval_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 43. BANKING TABLE
CREATE TABLE banking (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    bank_name VARCHAR(100) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    routing_number VARCHAR(20),
    current_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    available_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    last_reconciliation_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    is_primary BOOLEAN DEFAULT FALSE,
    interest_rate NUMERIC(5, 4) DEFAULT 0,
    monthly_fee NUMERIC(8, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 44. BANKING TRANSACTIONS TABLE
CREATE TABLE banking_transactions (
    id SERIAL PRIMARY KEY,
    banking_account_id INTEGER NOT NULL REFERENCES banking(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    posted_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transaction_type VARCHAR(50) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    description TEXT NOT NULL,
    reference_number VARCHAR(100),
    payee VARCHAR(200),
    category VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    is_reconciled BOOLEAN DEFAULT FALSE,
    reconciliation_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for new tables
CREATE INDEX idx_warehouses_owner_id ON warehouses(owner_id);
CREATE INDEX idx_warehouses_status ON warehouses(status);
CREATE INDEX idx_association_managers_association_id ON association_managers(association_id);
CREATE INDEX idx_association_managers_is_primary ON association_managers(is_primary);
CREATE INDEX idx_association_property_assignments_association_id ON association_property_assignments(association_id);
CREATE INDEX idx_association_property_assignments_property_id ON association_property_assignments(property_id);
CREATE INDEX idx_accountability_financials_property_id ON accountability_financials(property_id);
CREATE INDEX idx_accountability_financials_user_id ON accountability_financials(user_id);
CREATE INDEX idx_accountability_financials_financial_year ON accountability_financials(financial_year);
CREATE INDEX idx_general_ledger_property_id ON general_ledger(property_id);
CREATE INDEX idx_general_ledger_user_id ON general_ledger(user_id);
CREATE INDEX idx_general_ledger_transaction_date ON general_ledger(transaction_date);
CREATE INDEX idx_banking_property_id ON banking(property_id);
CREATE INDEX idx_banking_user_id ON banking(user_id);
CREATE INDEX idx_banking_is_active ON banking(is_active);
CREATE INDEX idx_banking_transactions_banking_account_id ON banking_transactions(banking_account_id);
CREATE INDEX idx_banking_transactions_transaction_date ON banking_transactions(transaction_date);
CREATE INDEX idx_banking_transactions_status ON banking_transactions(status);

-- Add comments for new tables
COMMENT ON TABLE warehouses IS 'Warehouse properties with financial tracking and ownership details';
COMMENT ON TABLE association_managers IS 'Managers for homeowner associations with contact information';
COMMENT ON TABLE association_property_assignments IS 'Property assignments to associations with HOA fees and shipping details';
COMMENT ON TABLE accountability_financials IS 'Financial accountability tracking for properties with income and expense details';
COMMENT ON TABLE general_ledger IS 'General ledger entries for property financial transactions';
COMMENT ON TABLE banking IS 'Bank account information for properties with balance tracking';
COMMENT ON TABLE banking_transactions IS 'Banking transaction records with reconciliation status';

-- Success message
SELECT 'All tables created successfully!' as status;

-- Additional indexes for new tables
CREATE INDEX idx_property_unit_details_property_id ON property_unit_details(property_id);
CREATE INDEX idx_property_listing_status_property_id ON property_listing_status(property_id);
CREATE INDEX idx_applicant_groups_property_id ON applicant_groups(property_id);
CREATE INDEX idx_applicant_group_members_group_id ON applicant_group_members(group_id);
CREATE INDEX idx_applicant_group_members_applicant_id ON applicant_group_members(applicant_id);
CREATE INDEX idx_lease_drafts_property_id ON lease_drafts(property_id);
CREATE INDEX idx_lease_drafts_applicant_id ON lease_drafts(applicant_id);
CREATE INDEX idx_draft_lease_approved_applicants_lease_draft_id ON draft_lease_approved_applicants(lease_draft_id);
CREATE INDEX idx_draft_lease_recurring_charges_lease_draft_id ON draft_lease_recurring_charges(lease_draft_id);
CREATE INDEX idx_draft_lease_one_time_charges_lease_draft_id ON draft_lease_one_time_charges(lease_draft_id);
CREATE INDEX idx_draft_lease_rent_charges_lease_draft_id ON draft_lease_rent_charges(lease_draft_id);
CREATE INDEX idx_draft_lease_move_in_charges_lease_draft_id ON draft_lease_move_in_charges(lease_draft_id);
CREATE INDEX idx_draft_lease_signatures_lease_draft_id ON draft_lease_signatures(lease_draft_id);
