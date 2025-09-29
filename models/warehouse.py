from config import db
from models import BaseModel
from datetime import datetime

class Warehouse(BaseModel):
    __tablename__ = 'warehouses'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    address = db.Column(db.String(500), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    zip_code = db.Column(db.String(20), nullable=False)
    total_square_feet = db.Column(db.Integer, nullable=False)  # Total square feet
    status = db.Column(db.String(50), default='active')  # active, inactive, maintenance
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    purchase_price = db.Column(db.Numeric(15, 2))  # Purchase price
    total_value = db.Column(db.Numeric(15, 2))  # Total current value
    mortgage_amount = db.Column(db.Numeric(15, 2))  # Mortgage amount (optional)
    loan_term = db.Column(db.Integer)  # Loan term in months (optional)
    down_payment = db.Column(db.Numeric(15, 2))  # Down payment amount
    interest_rate = db.Column(db.Numeric(5, 4))  # Interest rate as decimal (e.g., 0.05 for 5%)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = db.relationship('User', foreign_keys=[owner_id], backref='owned_warehouses')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'zip_code': self.zip_code,
            'total_square_feet': self.total_square_feet,
            'status': self.status,
            'owner_id': self.owner_id,
            'purchase_price': float(self.purchase_price) if self.purchase_price else None,
            'total_value': float(self.total_value) if self.total_value else None,
            'mortgage_amount': float(self.mortgage_amount) if self.mortgage_amount else None,
            'loan_term': self.loan_term,
            'down_payment': float(self.down_payment) if self.down_payment else None,
            'interest_rate': float(self.interest_rate) if self.interest_rate else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
