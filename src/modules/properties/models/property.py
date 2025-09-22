from config import db
from models import BaseModel
from datetime import datetime

class Property(BaseModel):
    __tablename__ = 'properties'
    
    # Property status constants
    STATUS_AVAILABLE = 'available'
    STATUS_OCCUPIED = 'occupied'
    STATUS_MAINTENANCE = 'maintenance'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    street_address_1 = db.Column(db.String(255), nullable=False)
    street_address_2 = db.Column(db.String(255))
    apt_number = db.Column(db.String(50))
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    zip_code = db.Column(db.String(20), nullable=False)
    description = db.Column(db.Text, nullable=False)
    rent_amount = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='available')
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
<<<<<<< HEAD:src/modules/properties/models/property.py
=======
    rental_owner_id = db.Column(db.Integer, db.ForeignKey('rental_owners.id', ondelete='CASCADE'), nullable=True)
>>>>>>> c4000e91ef9e66dfad67d379435355dc7c1a0112:models/property.py
    image_url = db.Column(db.String(500))  # Store image URL/path
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
<<<<<<< HEAD:src/modules/properties/models/property.py
    owner = db.relationship('User', backref='properties')
=======
    owner = db.relationship('User', foreign_keys=[owner_id], backref='owned_properties')
    rental_owner = db.relationship('RentalOwner', foreign_keys=[rental_owner_id], backref='properties')
>>>>>>> c4000e91ef9e66dfad67d379435355dc7c1a0112:models/property.py
    tenants = db.relationship('Tenant', back_populates='property')
    maintenance_requests = db.relationship('MaintenanceRequest', back_populates='property')
    listings = db.relationship('Listing', back_populates='property')
    financial_details = db.relationship('PropertyFinancial', back_populates='property', uselist=False, cascade='all, delete-orphan')
    financial_transactions = db.relationship('FinancialTransaction', back_populates='property', cascade='all, delete-orphan')
    # accountability_financials = db.relationship('AccountabilityFinancial', back_populates='property', cascade='all, delete-orphan')
    # general_ledger_entries = db.relationship('GeneralLedger', back_populates='property', cascade='all, delete-orphan')
    # banking_accounts = db.relationship('Banking', back_populates='property', cascade='all, delete-orphan')