from . import BaseModel, db

class Tenant(BaseModel):
    __tablename__ = 'tenants'
    
    # Tenant status constants
    STATUS_ACTIVE = 'active'
    STATUS_INACTIVE = 'inactive'
    STATUS_PENDING = 'pending'
    
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100))
    email = db.Column(db.String(100), unique=True)
    phone_number = db.Column(db.String(20))
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'))
    lease_start = db.Column(db.Date)
    lease_end = db.Column(db.Date)
    rent_amount = db.Column(db.Numeric(10, 2))
    rent_payment_day = db.Column(db.Integer, default=1)  # Day of month when rent is due (1-31)
    payment_status = db.Column(db.String(50))
    
    # Relationships
    property = db.relationship('Property', back_populates='tenants', foreign_keys=[property_id])
    rent_rolls = db.relationship('RentRoll', back_populates='tenant')
    maintenance_requests = db.relationship('MaintenanceRequest', back_populates='tenant')
    outstanding_balances = db.relationship('OutstandingBalance', back_populates='tenant')
    draft_leases = db.relationship('DraftLease', back_populates='tenant')

    association_memberships = db.relationship('AssociationMembership', back_populates='tenant')

class RentRoll(BaseModel):
    __tablename__ = 'rent_roll'
    
    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'))
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'))
    payment_date = db.Column(db.Date)
    amount_paid = db.Column(db.Numeric(10, 2))
    payment_method = db.Column(db.String(50))
    status = db.Column(db.String(50))
    remarks = db.Column(db.Text)
    
    # Relationships
    tenant = db.relationship('Tenant', back_populates='rent_rolls')
    property = db.relationship('Property')

class OutstandingBalance(BaseModel):
    __tablename__ = 'outstanding_balances'
    
    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'))
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'))
    due_amount = db.Column(db.Numeric(10, 2))
    due_date = db.Column(db.Date)
    is_resolved = db.Column(db.Boolean, default=False)
    
    # Relationships
    tenant = db.relationship('Tenant', back_populates='outstanding_balances')
    property = db.relationship('Property')

class DraftLease(BaseModel):
    __tablename__ = 'draft_leases'
    
    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'))
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    rent_amount = db.Column(db.Numeric(10, 2))
    terms = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    status = db.Column(db.String(50))
    
    # Relationships
    tenant = db.relationship('Tenant', back_populates='draft_leases')
    property = db.relationship('Property')
    created_by_user = db.relationship('User')

class LeaseRenewal(BaseModel):
    __tablename__ = 'lease_renewals'
    
    id = db.Column(db.Integer, primary_key=True)
    original_lease_id = db.Column(db.Integer, db.ForeignKey('lease_agreements.id', ondelete='CASCADE'))
    new_lease_id = db.Column(db.Integer, db.ForeignKey('lease_agreements.id', ondelete='CASCADE'))
    renewal_date = db.Column(db.Date, nullable=False)
    rent_change_amount = db.Column(db.Numeric(10, 2), default=0.00)
    rent_change_percentage = db.Column(db.Numeric(5, 2), default=0.00)
    renewal_terms = db.Column(db.Text)
    status = db.Column(db.String(50), nullable=False, default='Pending')
    approved_by_tenant = db.Column(db.Boolean, default=False)
    approved_by_owner = db.Column(db.Boolean, default=False)
    
    # Relationships (commented out to avoid circular imports)
    # original_lease = db.relationship('LeaseAgreement', foreign_keys=[original_lease_id])
    # new_lease = db.relationship('LeaseAgreement', foreign_keys=[new_lease_id])