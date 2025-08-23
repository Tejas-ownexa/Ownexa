from datetime import datetime
from config import db

# Base model for common fields
class BaseModel(db.Model):
    __abstract__ = True
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def save(self):
        db.session.add(self)
        db.session.commit()
    
    def delete(self):
        db.session.delete(self)
        db.session.commit()

# Import all models here
from models.user import User
from models.property import Property
from models.tenant import Tenant, DraftLease
from models.maintenance import MaintenanceRequest
from models.listing import Listing
from models.association import Association
from models.financial import PropertyFinancial, LoanPayment, FinancialTransaction
from models.vendor import Vendor