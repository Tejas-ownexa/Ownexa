from config import db
from models import BaseModel
from datetime import datetime

class PropertyUnitDetail(BaseModel):
    """Model for detailed property specifications"""
    __tablename__ = 'property_unit_details'
    
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False)
    unit_number = db.Column(db.String(50))
    bedrooms = db.Column(db.Integer, default=0, nullable=False)
    bathrooms = db.Column(db.Numeric(3, 1), default=0.0, nullable=False)
    square_feet = db.Column(db.Integer)
    rent_amount = db.Column(db.Numeric(10, 2))  # Added from actual schema
    deposit_amount = db.Column(db.Numeric(10, 2))  # Added from actual schema
    pet_deposit = db.Column(db.Numeric(10, 2))  # Added from actual schema
    pet_fee = db.Column(db.Numeric(10, 2))  # Added from actual schema
    utilities_included = db.Column(db.Text)
    amenities = db.Column(db.Text)
    floor_level = db.Column(db.String(50))  # Changed from floor_number to floor_level
    balcony = db.Column(db.Boolean, default=False)  # Changed from balcony_patio to balcony
    parking_spaces = db.Column(db.Integer, default=0)
    storage_unit = db.Column(db.Boolean, default=False)
    appliances_included = db.Column(db.Text)
    flooring_type = db.Column(db.String(100))
    last_renovated = db.Column(db.Date)  # Added from actual schema
    notes = db.Column(db.Text)
    is_available = db.Column(db.Boolean, default=True)  # Added from actual schema
    
    # Relationships
    property = db.relationship('Property', backref='unit_details')

class PropertyListingStatus(BaseModel):
    """Model for property listing and availability status"""
    __tablename__ = 'property_listing_status'
    
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False, unique=True)
    status = db.Column(db.String(50), default='Draft')  # Changed from listing_status to status
    listing_date = db.Column(db.Date)
    listing_price = db.Column(db.Numeric(10, 2))  # Changed from listing_rent to listing_price
    marketing_description = db.Column(db.Text)  # Changed from listing_description to marketing_description
    showing_instructions = db.Column(db.Text)  # Added from actual schema
    pet_policy = db.Column(db.Text)  # Added from actual schema
    lease_terms = db.Column(db.Text)  # Added from actual schema
    application_fee = db.Column(db.Numeric(10, 2))  # Added from actual schema
    security_deposit = db.Column(db.Numeric(10, 2))  # Added from actual schema
    first_month_rent = db.Column(db.Numeric(10, 2))  # Added from actual schema
    last_month_rent = db.Column(db.Numeric(10, 2))  # Added from actual schema
    broker_fee = db.Column(db.Numeric(10, 2))  # Added from actual schema
    minimum_lease_term = db.Column(db.Integer)  # Added from actual schema
    maximum_lease_term = db.Column(db.Integer)  # Added from actual schema
    available_date = db.Column(db.Date)  # Changed from availability_date to available_date
    photos_uploaded = db.Column(db.Boolean, default=False)  # Added from actual schema
    virtual_tour_link = db.Column(db.String(255))  # Added from actual schema
    listing_agent_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    
    # Relationships
    property = db.relationship('Property', backref='listing_status')
    listing_agent = db.relationship('User', backref='managed_listings')

class LeasingApplicant(BaseModel):
    """Model for individual applicants with workflow tracking"""
    __tablename__ = 'leasing_applicants'
    
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False)
    
    # Applicant information (matching actual database schema)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone_number = db.Column(db.String(20))
    
    # Additional applicant details
    date_of_birth = db.Column(db.Date)
    ssn_last_four = db.Column(db.String(4))
    current_address = db.Column(db.Text)
    employment_status = db.Column(db.String(50))
    employer_name = db.Column(db.String(255))
    monthly_income = db.Column(db.Numeric(10, 2))
    
    # Emergency contact
    emergency_contact_name = db.Column(db.String(255))
    emergency_contact_phone = db.Column(db.String(20))
    emergency_contact_relationship = db.Column(db.String(100))
    
    # Pet and occupancy information
    pets = db.Column(db.Boolean, default=False)
    pet_details = db.Column(db.Text)
    additional_occupants = db.Column(db.Integer, default=0)
    previous_rental_history = db.Column(db.Text)
    
    # Application status and workflow
    application_status = db.Column(db.String(50), default='Submitted', nullable=False)
    application_date = db.Column(db.Date, default=datetime.utcnow().date(), nullable=False)
    background_check_status = db.Column(db.String(50), default='Pending')
    credit_check_status = db.Column(db.String(50), default='Pending')
    references_verified = db.Column(db.Boolean, default=False)
    rejection_reason = db.Column(db.Text)  # Reason for rejection
    notes = db.Column(db.Text)
    
    # Lease information
    lease_start_date = db.Column(db.Date)
    lease_end_date = db.Column(db.Date)
    monthly_rent = db.Column(db.Numeric(10, 2))
    security_deposit = db.Column(db.Numeric(10, 2))
    application_fee_paid = db.Column(db.Boolean, default=False)
    documents_complete = db.Column(db.Boolean, default=False)
    
    # Relationships
    property = db.relationship('Property', backref='leasing_applicants')
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    def set_full_name(self, value):
        if value:
            parts = value.split(' ', 1)
            self.first_name = parts[0]
            self.last_name = parts[1] if len(parts) > 1 else ''

class ApplicantGroup(BaseModel):
    """Model for grouped applications with progress tracking"""
    __tablename__ = 'applicant_groups'
    
    id = db.Column(db.Integer, primary_key=True)
    group_name = db.Column(db.String(255))
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False)
    primary_applicant_id = db.Column(db.Integer, db.ForeignKey('leasing_applicants.id'))
    group_status = db.Column(db.String(50), default='Pending', nullable=False)
    total_monthly_income = db.Column(db.Numeric(10, 2))  # Added from actual schema
    
    # Relationships
    property = db.relationship('Property', backref='applicant_groups')
    primary_applicant = db.relationship('LeasingApplicant', backref='led_groups')

class ApplicantGroupMember(BaseModel):
    """Model for many-to-many relationship between groups and applicants"""
    __tablename__ = 'applicant_group_members'
    
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('applicant_groups.id', ondelete='CASCADE'), nullable=False)
    applicant_id = db.Column(db.Integer, db.ForeignKey('leasing_applicants.id', ondelete='CASCADE'), nullable=False)
    
    # Member role in group
    member_role = db.Column(db.String(50), default='Member')
    is_primary = db.Column(db.Boolean, default=False)
    
    # Member-specific status
    member_status = db.Column(db.String(50), default='Active')
    joined_date = db.Column(db.Date, default=datetime.utcnow().date())
    removed_date = db.Column(db.Date)
    removal_reason = db.Column(db.Text)
    
    # Relationships
    group = db.relationship('ApplicantGroup', backref='members')
    applicant = db.relationship('LeasingApplicant', backref='group_memberships')
    
    # Ensure unique group-applicant pairs
    __table_args__ = (db.UniqueConstraint('group_id', 'applicant_id'),)

class LeaseDraft(BaseModel):
    """Model for draft lease agreements"""
    __tablename__ = 'lease_drafts'
    
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False)
    applicant_id = db.Column(db.Integer, db.ForeignKey('leasing_applicants.id', ondelete='SET NULL'))
    lease_start_date = db.Column(db.Date)
    lease_end_date = db.Column(db.Date)
    monthly_rent = db.Column(db.Numeric(10, 2), nullable=False)
    security_deposit = db.Column(db.Numeric(10, 2), default=0.00)
    pet_deposit = db.Column(db.Numeric(8, 2), default=0.00)
    application_fee = db.Column(db.Numeric(8, 2), default=0.00)
    broker_fee = db.Column(db.Numeric(8, 2), default=0.00)  # Added from actual schema
    first_month_rent = db.Column(db.Numeric(10, 2))
    last_month_rent = db.Column(db.Numeric(10, 2), default=0.00)
    lease_terms = db.Column(db.Text)  # Added from actual schema
    special_conditions = db.Column(db.Text)  # Added from actual schema
    utilities_included = db.Column(db.Text)  # Added from actual schema
    parking_included = db.Column(db.Boolean, default=False)
    storage_included = db.Column(db.Boolean, default=False)  # Added from actual schema
    pet_policy = db.Column(db.Text)
    maintenance_responsibility = db.Column(db.Text)  # Added from actual schema
    late_fee_policy = db.Column(db.Text)  # Added from actual schema
    renewal_terms = db.Column(db.Text)  # Added from actual schema
    termination_clause = db.Column(db.Text)  # Added from actual schema
    draft_status = db.Column(db.String(50), default='Draft', nullable=False)
    created_by_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Fixed column name
    approved_by_user_id = db.Column(db.Integer, db.ForeignKey('user.id'))  # Added from actual schema
    approved_date = db.Column(db.Date)  # Added from actual schema
    tenant_signed_date = db.Column(db.Date)  # Added from actual schema
    landlord_signed_date = db.Column(db.Date)  # Added from actual schema
    lease_effective_date = db.Column(db.Date)  # Added from actual schema
    notes = db.Column(db.Text)  # Added from actual schema
    
    # Relationships
    property = db.relationship('Property', backref='lease_drafts')
    applicant = db.relationship('LeasingApplicant', backref='lease_drafts')
    created_by_user = db.relationship('User', foreign_keys=[created_by_user_id], backref='created_lease_drafts')
    approved_by_user = db.relationship('User', foreign_keys=[approved_by_user_id], backref='approved_lease_drafts')

class DraftLeaseApprovedApplicant(BaseModel):
    """Model for approved applicants in draft lease"""
    __tablename__ = 'draft_lease_approved_applicants'
    
    id = db.Column(db.Integer, primary_key=True)
    lease_draft_id = db.Column(db.Integer, db.ForeignKey('lease_drafts.id', ondelete='CASCADE'), nullable=False)
    applicant_id = db.Column(db.Integer, db.ForeignKey('leasing_applicants.id', ondelete='SET NULL'))
    
    # Applicant details (stored separately in case applicant is deleted)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120))
    phone_number = db.Column(db.String(20))
    
    # Move-in details
    move_in_date = db.Column(db.Date)
    relationship_to_primary = db.Column(db.String(50))
    emergency_contact_name = db.Column(db.String(100))
    emergency_contact_phone = db.Column(db.String(20))
    
    # Relationships
    lease_draft = db.relationship('LeaseDraft', backref='approved_applicants')
    applicant = db.relationship('LeasingApplicant', backref='draft_lease_approvals')

class DraftLeaseRecurringCharge(BaseModel):
    """Model for recurring charges in draft lease"""
    __tablename__ = 'draft_lease_recurring_charges'
    
    id = db.Column(db.Integer, primary_key=True)
    lease_draft_id = db.Column(db.Integer, db.ForeignKey('lease_drafts.id', ondelete='CASCADE'), nullable=False)
    
    # Charge details
    account = db.Column(db.String(100), nullable=False)
    next_due_date = db.Column(db.Date, nullable=False)
    amount = db.Column(db.Numeric(10, 2), default=0.00, nullable=False)
    memo = db.Column(db.Text)
    frequency = db.Column(db.String(50), default='monthly', nullable=False)
    
    # Status and tracking
    is_active = db.Column(db.Boolean, default=True)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    
    # Relationships
    lease_draft = db.relationship('LeaseDraft', backref='recurring_charges')
    created_by_user = db.relationship('User', backref='created_recurring_charges')

class DraftLeaseOneTimeCharge(BaseModel):
    """Model for one-time charges in draft lease"""
    __tablename__ = 'draft_lease_one_time_charges'
    
    id = db.Column(db.Integer, primary_key=True)
    lease_draft_id = db.Column(db.Integer, db.ForeignKey('lease_drafts.id', ondelete='CASCADE'), nullable=False)
    
    # Charge details
    account = db.Column(db.String(100), nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    amount = db.Column(db.Numeric(10, 2), default=0.00, nullable=False)
    memo = db.Column(db.Text)
    
    # Status and tracking
    is_paid = db.Column(db.Boolean, default=False)
    payment_date = db.Column(db.Date)
    payment_method = db.Column(db.String(50))
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    
    # Relationships
    lease_draft = db.relationship('LeaseDraft', backref='one_time_charges')
    created_by_user = db.relationship('User', backref='created_one_time_charges')

class DraftLeaseRentCharge(BaseModel):
    """Model for rent splitting in draft lease"""
    __tablename__ = 'draft_lease_rent_charges'
    
    id = db.Column(db.Integer, primary_key=True)
    lease_draft_id = db.Column(db.Integer, db.ForeignKey('lease_drafts.id', ondelete='CASCADE'), nullable=False)
    
    # Rent splitting details
    charge_name = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Numeric(10, 2), default=0.00, nullable=False)
    percentage_of_total = db.Column(db.Numeric(5, 2), default=100.00)
    is_prorated = db.Column(db.Boolean, default=False)
    proration_days = db.Column(db.Integer)
    proration_start_date = db.Column(db.Date)
    proration_end_date = db.Column(db.Date)
    
    # Responsible party
    responsible_applicant_id = db.Column(db.Integer, db.ForeignKey('draft_lease_approved_applicants.id', ondelete='SET NULL'))
    responsibility_percentage = db.Column(db.Numeric(5, 2), default=100.00)
    
    # Payment details
    due_date = db.Column(db.Date)
    due_day_of_month = db.Column(db.Integer, default=1)
    memo = db.Column(db.Text)
    
    # Relationships
    lease_draft = db.relationship('LeaseDraft', backref='rent_charges')
    responsible_applicant = db.relationship('DraftLeaseApprovedApplicant', backref='rent_responsibilities')

class DraftLeaseMoveInCharge(BaseModel):
    """Model for move-in charges in draft lease"""
    __tablename__ = 'draft_lease_move_in_charges'
    
    id = db.Column(db.Integer, primary_key=True)
    lease_draft_id = db.Column(db.Integer, db.ForeignKey('lease_drafts.id', ondelete='CASCADE'), nullable=False)
    
    # Move-in charge details
    charge_type = db.Column(db.String(100), nullable=False)
    charge_name = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Numeric(10, 2), default=0.00, nullable=False)
    
    # Due date and payment tracking
    due_date = db.Column(db.Date)
    is_required = db.Column(db.Boolean, default=True)
    is_refundable = db.Column(db.Boolean, default=False)
    refund_conditions = db.Column(db.Text)
    
    # Payment tracking
    is_paid = db.Column(db.Boolean, default=False)
    payment_date = db.Column(db.Date)
    payment_method = db.Column(db.String(50))
    payment_reference = db.Column(db.String(100))
    
    # Responsible party
    responsible_applicant_id = db.Column(db.Integer, db.ForeignKey('draft_lease_approved_applicants.id', ondelete='SET NULL'))
    memo = db.Column(db.Text)
    
    # Relationships
    lease_draft = db.relationship('LeaseDraft', backref='move_in_charges')
    responsible_applicant = db.relationship('DraftLeaseApprovedApplicant', backref='move_in_responsibilities')

class DraftLeaseSignature(BaseModel):
    """Model for tracking signature status"""
    __tablename__ = 'draft_lease_signatures'
    
    id = db.Column(db.Integer, primary_key=True)
    lease_draft_id = db.Column(db.Integer, db.ForeignKey('lease_drafts.id', ondelete='CASCADE'), nullable=False)
    
    # Signature tracking
    signature_status = db.Column(db.String(50), default='unsigned', nullable=False)
    esignature_status = db.Column(db.String(50), default='not-sent')
    lease_status = db.Column(db.String(50), default='draft')
    agent_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    
    # Signature dates and tracking
    esignature_sent_date = db.Column(db.DateTime)
    esignature_signed_date = db.Column(db.DateTime)
    signature_ip_address = db.Column(db.String(45))  # IPv6 compatible
    signature_location = db.Column(db.String(255))
    
    # Document management
    original_document_url = db.Column(db.String(500))
    signed_document_url = db.Column(db.String(500))
    esignature_provider = db.Column(db.String(50))
    esignature_envelope_id = db.Column(db.String(255))
    
    # Notifications and reminders
    reminder_count = db.Column(db.Integer, default=0)
    last_reminder_sent = db.Column(db.DateTime)
    notification_email = db.Column(db.String(120))
    
    # Execution details
    execution_method = db.Column(db.String(50), default='electronic')
    notary_required = db.Column(db.Boolean, default=False)
    witness_required = db.Column(db.Boolean, default=False)
    notary_info = db.Column(db.Text)
    witness_info = db.Column(db.Text)
    
    # Relationships
    lease_draft = db.relationship('LeaseDraft', backref='signatures')
    agent = db.relationship('User', backref='managed_signatures')
