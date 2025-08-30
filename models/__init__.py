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
    
    def to_dict(self):
        """Convert model instance to dictionary"""
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                result[column.name] = value.isoformat()
            elif hasattr(value, 'isoformat'):  # For date objects
                result[column.name] = value.isoformat()
            else:
                result[column.name] = value
        return result

# Import all models here
from models.user import User
from models.property import Property
from models.tenant import Tenant, RentRoll, OutstandingBalance, DraftLease, LeaseRenewal
from models.maintenance import MaintenanceRequest
from models.listing import Listing
from models.association import Association, AssociationMembership, AssociationBalance, Violation
from models.financial import PropertyFinancial, LoanPayment, FinancialTransaction
from models.vendor import Vendor
from models.accountability import AccountabilityFinancial, GeneralLedger, Banking, BankingTransaction
from models.lease import LeaseRoll, RentalOwnerProfile, LeaseAgreement, LeasePayment
from models.rental_owner import RentalOwner, RentalOwnerManager