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
    unit_type = db.Column(db.String(50), default='Apartment')
    floor_number = db.Column(db.Integer)
    amenities = db.Column(db.Text)
    parking_spaces = db.Column(db.Integer, default=0)
    storage_unit = db.Column(db.Boolean, default=False)
    balcony_patio = db.Column(db.Boolean, default=False)
    furnished = db.Column(db.Boolean, default=False)
    pet_friendly = db.Column(db.Boolean, default=False)
    laundry_type = db.Column(db.String(50))
    hvac_type = db.Column(db.String(50))
    flooring_type = db.Column(db.String(100))
    appliances_included = db.Column(db.Text)
    utilities_included = db.Column(db.Text)
    notes = db.Column(db.Text)
    
    # Relationships
    property = db.relationship('Property', backref='unit_details')

class PropertyListingStatus(BaseModel):
    """Model for property listing and availability status"""
    __tablename__ = 'property_listing_status'
    
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False, unique=True)
    is_listed = db.Column(db.Boolean, default=False, nullable=False)
    listing_date = db.Column(db.Date)
    listing_rent = db.Column(db.Numeric(10, 2))
    listing_status = db.Column(db.String(50), default='Draft')
    availability_date = db.Column(db.Date)
    listing_description = db.Column(db.Text)
    listing_photos = db.Column(db.Text)
    marketing_channels = db.Column(db.Text)
    listing_agent_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    
    # Lease transition information
    current_lease_end = db.Column(db.Date)
    next_lease_start = db.Column(db.Date)
    lease_transition_status = db.Column(db.String(50))
    current_tenant_names = db.Column(db.Text)
    lease_renewal_option = db.Column(db.Boolean, default=True)
    rent_increase_amount = db.Column(db.Numeric(10, 2), default=0.00)
    
    # Marketing metrics
    listing_views = db.Column(db.Integer, default=0)
    inquiries_count = db.Column(db.Integer, default=0)
    applications_count = db.Column(db.Integer, default=0)
    
    # Relationships
    property = db.relationship('Property', backref='listing_status')
    listing_agent = db.relationship('User', backref='managed_listings')

class LeasingApplicant(BaseModel):
    """Model for individual applicants with workflow tracking"""
    __tablename__ = 'leasing_applicants'
    
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False)
    listing_status_id = db.Column(db.Integer, db.ForeignKey('property_listing_status.id', ondelete='CASCADE'))
    
    # Applicant information
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone_number = db.Column(db.String(20))
    
    # Unit information
    unit_number = db.Column(db.String(50))
    
    # Application details
    application_date = db.Column(db.Date, default=datetime.utcnow().date(), nullable=False)
    application_received = db.Column(db.Date, default=datetime.utcnow().date(), nullable=False)
    move_in_date = db.Column(db.Date)
    desired_lease_term = db.Column(db.Integer)  # Months
    monthly_income = db.Column(db.Numeric(10, 2))
    employment_status = db.Column(db.String(50))
    employer_name = db.Column(db.String(100))
    
    # Application status and workflow
    application_status = db.Column(db.String(50), default='Submitted', nullable=False)
    stage_in_process = db.Column(db.String(100), default='Application Submitted')
    background_check_status = db.Column(db.String(50), default='Pending')
    credit_score = db.Column(db.Integer)
    references_checked = db.Column(db.Boolean, default=False)
    
    # Decision information
    approved_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    approval_date = db.Column(db.Date)
    rejection_reason = db.Column(db.Text)
    notes = db.Column(db.Text)
    
    # Workflow tracking
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    workflow_stage_history = db.Column(db.Text)  # JSON array
    
    # Relationships
    property = db.relationship('Property', backref='leasing_applicants')
    listing_status = db.relationship('PropertyListingStatus', backref='applicants')
    approved_by_user = db.relationship('User', backref='approved_applicants')

class ApplicantGroup(BaseModel):
    """Model for grouped applications with progress tracking"""
    __tablename__ = 'applicant_groups'
    
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False)
    
    # Group information
    group_name = db.Column(db.String(255))
    unit_number = db.Column(db.String(50))
    
    # Group status and progress
    group_status = db.Column(db.String(50), default='Pending', nullable=False)
    percent_complete = db.Column(db.Integer, default=0)  # 0-100
    
    # Group workflow tracking
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    completion_milestones = db.Column(db.Text)  # JSON object
    
    # Group settings
    max_members = db.Column(db.Integer)
    is_joint_application = db.Column(db.Boolean, default=True)
    primary_applicant_id = db.Column(db.Integer, db.ForeignKey('leasing_applicants.id'))
    
    # Group notes and history
    group_notes = db.Column(db.Text)
    status_change_history = db.Column(db.Text)  # JSON array
    
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
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Draft lease details
    draft_name = db.Column(db.String(255), nullable=False)
    lease_type = db.Column(db.String(50), default='Fixed Term', nullable=False)
    lease_start_date = db.Column(db.Date)
    lease_end_date = db.Column(db.Date)
    lease_term_months = db.Column(db.Integer)
    
    # Financial terms
    monthly_rent = db.Column(db.Numeric(10, 2), nullable=False)
    security_deposit = db.Column(db.Numeric(10, 2), default=0.00)
    first_month_rent = db.Column(db.Numeric(10, 2))
    last_month_rent = db.Column(db.Numeric(10, 2), default=0.00)
    pet_deposit = db.Column(db.Numeric(8, 2), default=0.00)
    application_fee = db.Column(db.Numeric(8, 2), default=0.00)
    
    # Lease terms
    late_fee_amount = db.Column(db.Numeric(8, 2), default=0.00)
    late_fee_grace_days = db.Column(db.Integer, default=5)
    utilities_tenant_pays = db.Column(db.Text)
    utilities_landlord_pays = db.Column(db.Text)
    parking_included = db.Column(db.Boolean, default=False)
    pet_policy = db.Column(db.Text)
    subletting_allowed = db.Column(db.Boolean, default=False)
    smoking_allowed = db.Column(db.Boolean, default=False)
    
    # Custom terms and conditions
    special_terms = db.Column(db.Text)
    custom_clauses = db.Column(db.Text)
    
    # Draft status
    draft_status = db.Column(db.String(50), default='Draft', nullable=False)
    version_number = db.Column(db.Integer, default=1)
    is_template = db.Column(db.Boolean, default=False)
    
    # Approval workflow
    reviewed_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    review_date = db.Column(db.Date)
    review_notes = db.Column(db.Text)
    approved_for_sending = db.Column(db.Boolean, default=False)
    
    # Relationships
    property = db.relationship('Property', backref='lease_drafts')
    applicant = db.relationship('LeasingApplicant', backref='lease_drafts')
    created_by_user = db.relationship('User', foreign_keys=[created_by], backref='created_lease_drafts')
    reviewed_by_user = db.relationship('User', foreign_keys=[reviewed_by], backref='reviewed_lease_drafts')

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
