from config import db
from models import BaseModel
from datetime import datetime

class VendorCategory(BaseModel):
    __tablename__ = 'vendor_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    is_deletable = db.Column(db.Boolean, default=True, nullable=False)
    created_by_user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='SET NULL'))
    
    # Relationships
    created_by_user = db.relationship('User', backref='created_vendor_categories')
    vendors = db.relationship('Vendor', back_populates='category')

class Vendor(BaseModel):
    __tablename__ = 'vendors'
    
    id = db.Column(db.Integer, primary_key=True)
    created_by_user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    
    # Basic Information
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    company_name = db.Column(db.String(255))
    is_company = db.Column(db.Boolean, default=False)
    category_id = db.Column(db.Integer, db.ForeignKey('vendor_categories.id', ondelete='SET NULL'))
    expense_account = db.Column(db.String(100))
    account_number = db.Column(db.String(50))
    
    # Contact Information
    primary_email = db.Column(db.String(120), nullable=False)
    alternate_email = db.Column(db.String(120))
    phone_1 = db.Column(db.String(20))
    phone_2 = db.Column(db.String(20))
    phone_3 = db.Column(db.String(20))
    phone_4 = db.Column(db.String(20))
    
    # Address Information
    street_address = db.Column(db.Text)
    city = db.Column(db.String(100))
    state = db.Column(db.String(50))
    zip_code = db.Column(db.String(20))
    country = db.Column(db.String(100), default='United States')
    website = db.Column(db.String(255))
    comments = db.Column(db.Text)
    
    # Tax Filing Information (1099-NEC)
    tax_id_type = db.Column(db.String(20))  # 'ssn', 'ein', 'itin'
    taxpayer_id = db.Column(db.String(50))
    use_different_name = db.Column(db.Boolean, default=False)
    use_different_address = db.Column(db.Boolean, default=False)
    
    # Insurance Information
    insurance_provider = db.Column(db.String(255))
    policy_number = db.Column(db.String(100))
    insurance_expiration_date = db.Column(db.String(20))  # Format: m/yyyy
    
    # System Fields
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    
    # Relationships
    created_by_user = db.relationship('User', backref='created_vendors')
    category = db.relationship('VendorCategory', back_populates='vendors')
    work_orders = db.relationship('WorkOrder', back_populates='assigned_vendor')
    maintenance_requests = db.relationship('MaintenanceRequest', back_populates='assigned_vendor')
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    @property
    def display_name(self):
        if self.is_company and self.company_name:
            return self.company_name
        return self.full_name