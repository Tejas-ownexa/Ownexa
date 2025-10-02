from config import db
from models import BaseModel
from datetime import datetime, date
from sqlalchemy import text

class Task(BaseModel):
    __tablename__ = 'tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)  # Changed from task_name to title
    description = db.Column(db.Text)
    status = db.Column(db.String(50), default='active')  # 'active', 'completed', 'cancelled'
    priority = db.Column(db.String(50))  # Added priority column
    due_date = db.Column(db.Date)  # Changed from start_date/end_date to due_date
    created_by_user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    assigned_to_user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='SET NULL'))
    
    # Relationships
    assigned_to_user = db.relationship('User', foreign_keys=[assigned_to_user_id], backref='assigned_tasks')
    created_by_user = db.relationship('User', foreign_keys=[created_by_user_id], backref='created_tasks')
    work_orders = db.relationship('WorkOrder', secondary='work_order_tasks', back_populates='tasks')

class WorkOrder(BaseModel):
    __tablename__ = 'work_orders'
    
    id = db.Column(db.Integer, primary_key=True)
    work_order_number = db.Column(db.String(50), unique=True)
    
    # Property and Unit Information
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id', ondelete='CASCADE'), nullable=False)
    unit_number = db.Column(db.String(50))
    
    # Work Order Details
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(20), default='medium', nullable=False)  # 'low', 'medium', 'high', 'urgent'
    status = db.Column(db.String(50), default='new', nullable=False)  # 'new', 'in_progress', 'complete', 'cancelled'
    category = db.Column(db.String(100))  # 'plumbing', 'electrical', 'hvac', etc.
    
    # Assignment and Scheduling
    assigned_to_user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='SET NULL'))
    assigned_vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id', ondelete='SET NULL'))
    due_date = db.Column(db.Date)
    scheduled_date = db.Column(db.Date)
    completed_date = db.Column(db.Date)
    
    # Financial Information
    estimated_cost = db.Column(db.Numeric(10, 2))
    actual_cost = db.Column(db.Numeric(10, 2))
    bill_total = db.Column(db.Numeric(10, 2))
    bill_status = db.Column(db.String(50), default='pending')  # 'pending', 'submitted', 'approved', 'paid'
    
    # Timestamps and Tracking
    created_by_user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    age_days = db.Column(db.Integer)  # Will be calculated automatically
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Additional Fields
    notes = db.Column(db.Text)
    vendor_notes = db.Column(db.Text)
    work_to_be_performed = db.Column(db.Text)
    entry_details = db.Column(db.String(255))
    entry_contact = db.Column(db.String(255))
    work_hours = db.Column(db.Numeric(8, 2))
    charge_hours_to = db.Column(db.String(255))
    is_emergency = db.Column(db.Boolean, default=False)
    tenant_notified = db.Column(db.Boolean, default=False)
    photos_required = db.Column(db.Boolean, default=False)
    
    # Relationships
    property = db.relationship('Property', backref='work_orders')
    assigned_to_user = db.relationship('User', foreign_keys=[assigned_to_user_id], backref='assigned_work_orders')
    assigned_vendor = db.relationship('Vendor', back_populates='work_orders')
    created_by_user = db.relationship('User', foreign_keys=[created_by_user_id], backref='created_work_orders')
    parts = db.relationship('WorkOrderPart', back_populates='work_order', cascade='all, delete-orphan')
    files = db.relationship('WorkOrderFile', back_populates='work_order', cascade='all, delete-orphan')
    tasks = db.relationship('Task', secondary='work_order_tasks', back_populates='work_orders')
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.work_order_number:
            # This will be set by database trigger, but we can provide a fallback
            pass
    
    def get_age_days(self):
        if self.created_at:
            delta = datetime.utcnow().date() - self.created_at.date()
            return delta.days
        return 0
    
    def get_total_parts_cost(self):
        return sum(part.total_price or 0 for part in self.parts)

class WorkOrderPart(BaseModel):
    __tablename__ = 'work_order_parts'
    
    id = db.Column(db.Integer, primary_key=True)
    work_order_id = db.Column(db.Integer, db.ForeignKey('work_orders.id', ondelete='CASCADE'), nullable=False)
    qty = db.Column(db.Integer, default=0)
    account = db.Column(db.String(255))
    description = db.Column(db.Text)
    unit_price = db.Column(db.Numeric(10, 2), default=0.00)
    total_price = db.Column(db.Numeric(10, 2), default=0.00)
    line_order = db.Column(db.Integer, default=0)
    
    # Relationships
    work_order = db.relationship('WorkOrder', back_populates='parts')
    
    def calculate_total(self):
        """Calculate total price based on quantity and unit price"""
        if self.qty and self.unit_price:
            self.total_price = self.qty * self.unit_price
        else:
            self.total_price = 0.00

class WorkOrderFile(BaseModel):
    __tablename__ = 'work_order_files'
    
    id = db.Column(db.Integer, primary_key=True)
    work_order_id = db.Column(db.Integer, db.ForeignKey('work_orders.id', ondelete='CASCADE'), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer)
    file_type = db.Column(db.String(100))
    uploaded_by_user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='SET NULL'))
    
    # Relationships
    work_order = db.relationship('WorkOrder', back_populates='files')
    uploaded_by_user = db.relationship('User', backref='uploaded_work_order_files')

# Association table for many-to-many relationship between work orders and tasks
work_order_tasks = db.Table('work_order_tasks',
    db.Column('id', db.Integer, primary_key=True),
    db.Column('work_order_id', db.Integer, db.ForeignKey('work_orders.id', ondelete='CASCADE'), nullable=False),
    db.Column('task_id', db.Integer, db.ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False),
    db.Column('created_at', db.DateTime, default=datetime.utcnow),
    db.UniqueConstraint('work_order_id', 'task_id')
)
