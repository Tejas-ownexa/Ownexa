from config import db
from datetime import datetime

class LeaseRoll(db.Model):
    """Model for lease roll data (Rent Roll page)"""
    __tablename__ = 'lease_roll'
    
    id = db.Column(db.Integer, primary_key=True)
    lease = db.Column(db.String(255), nullable=False)
    lease_id = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='Active')
    type = db.Column(db.String(100), nullable=False, default='Fixed w/rollover')
    lease_dates = db.Column(db.String(100), nullable=False)
    days_left = db.Column(db.String(50))
    rent = db.Column(db.String(50))
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id', ondelete='CASCADE'))
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id', ondelete='CASCADE'))
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    property = db.relationship('Property', backref='lease_rolls')
    tenant = db.relationship('Tenant', backref='lease_rolls')
    owner = db.relationship('User', backref='lease_rolls')
    
    def to_dict(self):
        return {
            'id': self.id,
            'lease': self.lease,
            'leaseId': self.lease_id,
            'status': self.status,
            'type': self.type,
            'leaseDates': self.lease_dates,
            'daysLeft': self.days_left,
            'rent': self.rent,
            'property_id': self.property_id,
            'tenant_id': self.tenant_id,
            'owner_id': self.owner_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class RentalOwnerProfile(db.Model):
    """Model for rental owner profiles (Rental Owners page)"""
    __tablename__ = 'rental_owner_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    business_name = db.Column(db.String(255))
    business_type = db.Column(db.String(100))
    tax_id = db.Column(db.String(50))
    business_address = db.Column(db.Text)
    emergency_contact_name = db.Column(db.String(100))
    emergency_contact_phone = db.Column(db.String(20))
    emergency_contact_email = db.Column(db.String(120))
    bank_account_info = db.Column(db.Text)
    insurance_info = db.Column(db.Text)
    agreement_start_date = db.Column(db.Date)
    agreement_end_date = db.Column(db.Date)
    management_fee_percentage = db.Column(db.Numeric(5, 2), default=0.00)
    is_active = db.Column(db.Boolean, default=True)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='rental_owner_profile')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'business_name': self.business_name,
            'business_type': self.business_type,
            'tax_id': self.tax_id,
            'business_address': self.business_address,
            'emergency_contact_name': self.emergency_contact_name,
            'emergency_contact_phone': self.emergency_contact_phone,
            'emergency_contact_email': self.emergency_contact_email,
            'bank_account_info': self.bank_account_info,
            'insurance_info': self.insurance_info,
            'agreement_start_date': self.agreement_start_date.isoformat() if self.agreement_start_date else None,
            'agreement_end_date': self.agreement_end_date.isoformat() if self.agreement_end_date else None,
            'management_fee_percentage': float(self.management_fee_percentage) if self.management_fee_percentage else 0.00,
            'is_active': self.is_active,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class LeaseAgreement(db.Model):
    """Model for detailed lease agreements"""
    __tablename__ = 'lease_agreements'
    
    id = db.Column(db.Integer, primary_key=True)
    lease_roll_id = db.Column(db.Integer, db.ForeignKey('lease_roll.id', ondelete='CASCADE'))
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    lease_number = db.Column(db.String(50), unique=True, nullable=False)
    lease_type = db.Column(db.String(50), nullable=False, default='Fixed')
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    rent_amount = db.Column(db.Numeric(10, 2), nullable=False)
    security_deposit = db.Column(db.Numeric(10, 2), default=0.00)
    late_fee_amount = db.Column(db.Numeric(8, 2), default=0.00)
    late_fee_days = db.Column(db.Integer, default=5)
    utilities_included = db.Column(db.Boolean, default=False)
    pet_policy = db.Column(db.Text)
    parking_spaces = db.Column(db.Integer, default=0)
    status = db.Column(db.String(50), nullable=False, default='Active')
    renewal_terms = db.Column(db.Text)
    special_conditions = db.Column(db.Text)
    signed_date = db.Column(db.Date)
    signed_by_tenant = db.Column(db.Boolean, default=False)
    signed_by_owner = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    lease_roll = db.relationship('LeaseRoll', backref='lease_agreements')
    property = db.relationship('Property', backref='lease_agreements')
    tenant = db.relationship('Tenant', backref='lease_agreements')
    owner = db.relationship('User', backref='lease_agreements')
    
    def to_dict(self):
        return {
            'id': self.id,
            'lease_roll_id': self.lease_roll_id,
            'property_id': self.property_id,
            'tenant_id': self.tenant_id,
            'owner_id': self.owner_id,
            'lease_number': self.lease_number,
            'lease_type': self.lease_type,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'rent_amount': float(self.rent_amount) if self.rent_amount else 0.00,
            'security_deposit': float(self.security_deposit) if self.security_deposit else 0.00,
            'late_fee_amount': float(self.late_fee_amount) if self.late_fee_amount else 0.00,
            'late_fee_days': self.late_fee_days,
            'utilities_included': self.utilities_included,
            'pet_policy': self.pet_policy,
            'parking_spaces': self.parking_spaces,
            'status': self.status,
            'renewal_terms': self.renewal_terms,
            'special_conditions': self.special_conditions,
            'signed_date': self.signed_date.isoformat() if self.signed_date else None,
            'signed_by_tenant': self.signed_by_tenant,
            'signed_by_owner': self.signed_by_owner,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class LeasePayment(db.Model):
    """Model for lease payment tracking"""
    __tablename__ = 'lease_payments'
    
    id = db.Column(db.Integer, primary_key=True)
    lease_agreement_id = db.Column(db.Integer, db.ForeignKey('lease_agreements.id', ondelete='CASCADE'))
    payment_date = db.Column(db.Date, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    amount_due = db.Column(db.Numeric(10, 2), nullable=False)
    amount_paid = db.Column(db.Numeric(10, 2), nullable=False)
    payment_method = db.Column(db.String(50))
    payment_status = db.Column(db.String(50), nullable=False, default='Paid')
    late_fees = db.Column(db.Numeric(8, 2), default=0.00)
    notes = db.Column(db.Text)
    receipt_number = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    lease_agreement = db.relationship('LeaseAgreement', backref='payments')
    
    def to_dict(self):
        return {
            'id': self.id,
            'lease_agreement_id': self.lease_agreement_id,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'amount_due': float(self.amount_due) if self.amount_due else 0.00,
            'amount_paid': float(self.amount_paid) if self.amount_paid else 0.00,
            'payment_method': self.payment_method,
            'payment_status': self.payment_status,
            'late_fees': float(self.late_fees) if self.late_fees else 0.00,
            'notes': self.notes,
            'receipt_number': self.receipt_number,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


