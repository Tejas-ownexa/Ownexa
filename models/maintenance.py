from config import db
from datetime import datetime
from models import BaseModel

class MaintenanceRequest(BaseModel):
    __tablename__ = 'maintenance_requests'

    # Status constants
    STATUS_PENDING = 'pending'
    STATUS_ASSIGNED = 'assigned'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_COMPLETED = 'completed'
    STATUS_CANCELLED = 'cancelled'
    
    # Priority constants
    PRIORITY_LOW = 'low'
    PRIORITY_MEDIUM = 'medium'
    PRIORITY_HIGH = 'high'
    PRIORITY_URGENT = 'urgent'

    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False)
    assigned_vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id', ondelete='SET NULL'), nullable=True)
    request_title = db.Column(db.String(255), nullable=False)
    request_description = db.Column(db.Text, nullable=False)
    request_date = db.Column(db.Date, nullable=False, default=datetime.utcnow().date)
    priority = db.Column(db.String(20), nullable=False, default='medium')
    status = db.Column(db.String(50), nullable=False, default='pending')
    estimated_cost = db.Column(db.Numeric(10, 2))
    actual_cost = db.Column(db.Numeric(10, 2))
    scheduled_date = db.Column(db.Date)
    completion_date = db.Column(db.Date)
    tenant_notes = db.Column(db.Text)
    vendor_notes = db.Column(db.Text)
    owner_notes = db.Column(db.Text)

    # Relationships
    tenant = db.relationship('Tenant', back_populates='maintenance_requests')
    property = db.relationship('Property', back_populates='maintenance_requests')
    assigned_vendor = db.relationship('Vendor', back_populates='maintenance_requests')