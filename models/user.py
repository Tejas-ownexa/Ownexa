from models import db

class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    phone_number = db.Column(db.String(20))
    role = db.Column(db.String(20), default='OWNER')
    street_address_1 = db.Column(db.String(255), nullable=False)
    street_address_2 = db.Column(db.String(255))
    apt_number = db.Column(db.String(20))
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(50), nullable=False)
    zip_code = db.Column(db.String(10), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    email_verified = db.Column(db.Boolean, default=True)
    email_verification_token = db.Column(db.String(255), unique=True)
    email_verification_expires = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())
    
    # Relationships (commented out for now to avoid circular imports)
    # accountability_financials = db.relationship('AccountabilityFinancial', back_populates='user', cascade='all, delete-orphan')
    # general_ledger_entries = db.relationship('GeneralLedger', back_populates='user', cascade='all, delete-orphan')
    # banking_accounts = db.relationship('Banking', back_populates='user', cascade='all, delete-orphan')
    
    @property
    def full_name(self):
        """Get user's full name"""
        return f"{self.first_name} {self.last_name}"