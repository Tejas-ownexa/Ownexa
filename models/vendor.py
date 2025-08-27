from config import db
from models import BaseModel
from datetime import datetime

class Vendor(BaseModel):
    __tablename__ = 'vendors'
    
    # Vendor type constants
    VENDOR_TYPE_CARPENTER = 'carpenter'
    VENDOR_TYPE_ELECTRICIAN = 'electrician'
    VENDOR_TYPE_PLUMBER = 'plumber'
    VENDOR_TYPE_PEST_CONTROL = 'pest_control'
    VENDOR_TYPE_HVAC = 'hvac'
    VENDOR_TYPE_GENERAL = 'general'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    vendor_type = db.Column(db.String(50), nullable=False)
    business_name = db.Column(db.String(255), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    address = db.Column(db.Text, nullable=False)
    license_number = db.Column(db.String(100))
    insurance_info = db.Column(db.Text)
    hourly_rate = db.Column(db.Numeric(10, 2))
    is_verified = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    user = db.relationship('User', backref='vendor_profile')
    maintenance_requests = db.relationship('MaintenanceRequest', back_populates='assigned_vendor')
    
    @classmethod
    def get_vendor_types(cls):
        return [
            {'value': cls.VENDOR_TYPE_CARPENTER, 'label': 'Carpenter'},
            {'value': cls.VENDOR_TYPE_ELECTRICIAN, 'label': 'Electrician'},
            {'value': cls.VENDOR_TYPE_PLUMBER, 'label': 'Plumber'},
            {'value': cls.VENDOR_TYPE_PEST_CONTROL, 'label': 'Pest Control'},
            {'value': cls.VENDOR_TYPE_HVAC, 'label': 'HVAC'},
            {'value': cls.VENDOR_TYPE_GENERAL, 'label': 'General Contractor'}
        ]
