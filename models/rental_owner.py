from config import db
from datetime import datetime

class RentalOwner(db.Model):
    """Model for rental owner companies/organizations"""
    __tablename__ = 'rental_owners'
    
    id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(255), nullable=False)
    business_type = db.Column(db.String(100))
    tax_id = db.Column(db.String(50))
    business_address = db.Column(db.Text)
    city = db.Column(db.String(100))
    state = db.Column(db.String(50))
    zip_code = db.Column(db.String(20))
    phone_number = db.Column(db.String(20))
    email = db.Column(db.String(120))
    website = db.Column(db.String(255))
    contact_person = db.Column(db.String(100))
    contact_phone = db.Column(db.String(20))
    contact_email = db.Column(db.String(120))
    bank_account_info = db.Column(db.Text)
    insurance_info = db.Column(db.Text)
    management_fee_percentage = db.Column(db.Numeric(5, 2), default=0.00)
    is_active = db.Column(db.Boolean, default=True)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    properties = db.relationship('Property', back_populates='rental_owner')
    managers = db.relationship('RentalOwnerManager', back_populates='rental_owner')
    
    def to_dict(self):
        return {
            'id': self.id,
            'company_name': self.company_name,
            'business_type': self.business_type,
            'tax_id': self.tax_id,
            'business_address': self.business_address,
            'city': self.city,
            'state': self.state,
            'zip_code': self.zip_code,
            'phone_number': self.phone_number,
            'email': self.email,
            'website': self.website,
            'contact_person': self.contact_person,
            'contact_phone': self.contact_phone,
            'contact_email': self.contact_email,
            'bank_account_info': self.bank_account_info,
            'insurance_info': self.insurance_info,
            'management_fee_percentage': float(self.management_fee_percentage) if self.management_fee_percentage else 0.00,
            'is_active': self.is_active,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class RentalOwnerManager(db.Model):
    """Model for users who manage rental owner companies"""
    __tablename__ = 'rental_owner_managers'
    
    id = db.Column(db.Integer, primary_key=True)
    rental_owner_id = db.Column(db.Integer, db.ForeignKey('rental_owners.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    role = db.Column(db.String(50), default='MANAGER')
    is_primary = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    rental_owner = db.relationship('RentalOwner', back_populates='managers')
    user = db.relationship('User', backref='managed_rental_owners')
    
    def to_dict(self):
        return {
            'id': self.id,
            'rental_owner_id': self.rental_owner_id,
            'user_id': self.user_id,
            'role': self.role,
            'is_primary': self.is_primary,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
