from config import db
from datetime import datetime

class ClientInquiry(db.Model):
    __tablename__ = 'client_inquiry'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Personal Information
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone_number = db.Column(db.String(20))
    
    # Property Requirements
    property_type = db.Column(db.String(50))  # apartment, house, commercial, etc.
    budget_min = db.Column(db.Numeric(10, 2))
    budget_max = db.Column(db.Numeric(10, 2))
    preferred_location = db.Column(db.String(255))
    move_in_date = db.Column(db.Date)
    lease_duration = db.Column(db.String(50))  # 6 months, 1 year, etc.
    
    # Additional Requirements
    bedrooms = db.Column(db.Integer)
    bathrooms = db.Column(db.Integer)
    parking_needed = db.Column(db.Boolean, default=False)
    pet_friendly = db.Column(db.Boolean, default=False)
    furnished = db.Column(db.Boolean, default=False)
    
    # Message
    message = db.Column(db.Text)
    
    # Status tracking
    status = db.Column(db.String(50), default='NEW')  # NEW, CONTACTED, QUALIFIED, CLOSED
    assigned_agent = db.Column(db.String(100))
    notes = db.Column(db.Text)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<ClientInquiry {self.first_name} {self.last_name} - {self.email}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'email': self.email,
            'phone_number': self.phone_number,
            'property_type': self.property_type,
            'budget_min': float(self.budget_min) if self.budget_min else None,
            'budget_max': float(self.budget_max) if self.budget_max else None,
            'preferred_location': self.preferred_location,
            'move_in_date': self.move_in_date.isoformat() if self.move_in_date else None,
            'lease_duration': self.lease_duration,
            'bedrooms': self.bedrooms,
            'bathrooms': self.bathrooms,
            'parking_needed': self.parking_needed,
            'pet_friendly': self.pet_friendly,
            'furnished': self.furnished,
            'message': self.message,
            'status': self.status,
            'assigned_agent': self.assigned_agent,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
