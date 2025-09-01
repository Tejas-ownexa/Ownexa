from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, Integer, DateTime
from datetime import datetime

# Database instance
db = SQLAlchemy()

class BaseModel(db.Model):
    """Base model with common fields"""
    __abstract__ = True
    
    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert model to dictionary"""
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                result[column.name] = value.isoformat()
            else:
                result[column.name] = value
        return result

# Import all models to register them with SQLAlchemy
def init_models():
    """Initialize all models"""
    # Import models from different modules
    from src.modules.auth.models.user import User
    from src.modules.properties.models.property import Property
    from src.modules.properties.models.listing import Listing
    from src.modules.properties.models.association import Association, AssociationMembership, AssociationBalance, Violation
    from src.modules.tenants.models.tenant import Tenant, RentRoll, OutstandingBalance, DraftLease, LeaseRenewal
    from src.modules.tenants.models.lease import LeaseRoll, RentalOwnerProfile, LeaseAgreement, LeasePayment
    from src.modules.tenants.models.rental_owner import RentalOwner, RentalOwnerManager
    from src.modules.maintenance.models.maintenance import MaintenanceRequest
    from src.modules.maintenance.models.vendor import Vendor
    from src.modules.financial.models.financial import PropertyFinancial, LoanPayment, FinancialTransaction
    from src.modules.financial.models.accountability import AccountabilityFinancial, GeneralLedger, Banking, BankingTransaction