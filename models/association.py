from . import BaseModel, db

class Association(BaseModel):
    __tablename__ = 'associations'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    street_address_1 = db.Column(db.String(255))
    street_address_2 = db.Column(db.String(255))
    apt_number = db.Column(db.String(50))
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    zip_code = db.Column(db.String(20))
    manager = db.Column(db.String(255))
    
    # Relationships
    memberships = db.relationship('AssociationMembership', back_populates='association')
    ownership_accounts = db.relationship('OwnershipAccount', back_populates='association')

class PropertyFavorite(BaseModel):
    __tablename__ = 'property_favorites'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    
    # Relationships
    user = db.relationship('User', backref='property_favorites')
    property = db.relationship('Property', backref='favorites')
    
    # Unique constraint to prevent duplicate favorites
    __table_args__ = (db.UniqueConstraint('user_id', 'property_id', name='unique_user_property_favorite'),)

class OwnershipAccount(BaseModel):
    __tablename__ = 'ownership_accounts'
    
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    association_id = db.Column(db.Integer, db.ForeignKey('associations.id'))
    balance_due = db.Column(db.Numeric(10, 2))
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    zip_code = db.Column(db.String(20))
    
    # Relationships
    owner = db.relationship('User', backref='ownership_accounts')
    association = db.relationship('Association', back_populates='ownership_accounts')

class AssociationMembership(BaseModel):
    __tablename__ = 'association_memberships'
    
    id = db.Column(db.Integer, primary_key=True)
    association_id = db.Column(db.Integer, db.ForeignKey('associations.id'))
    user_type = db.Column(db.String(20))
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'))
    joined_at = db.Column(db.DateTime)
    
    # Relationships
    association = db.relationship('Association', back_populates='memberships')
    owner = db.relationship('User', backref='association_memberships')
    tenant = db.relationship('Tenant', back_populates='association_memberships')
    balances = db.relationship('AssociationBalance', back_populates='membership')
    violations = db.relationship('Violation', back_populates='membership')

class AssociationBalance(BaseModel):
    __tablename__ = 'association_balances'
    
    id = db.Column(db.Integer, primary_key=True)
    membership_id = db.Column(db.Integer, db.ForeignKey('association_memberships.id'))
    amount_due = db.Column(db.Numeric(10, 2))
    due_date = db.Column(db.Date)
    is_resolved = db.Column(db.Boolean, default=False)
    
    # Relationships
    membership = db.relationship('AssociationMembership', back_populates='balances')

class Violation(BaseModel):
    __tablename__ = 'violations'
    
    id = db.Column(db.Integer, primary_key=True)
    membership_id = db.Column(db.Integer, db.ForeignKey('association_memberships.id'))
    violation_type = db.Column(db.String(100))
    description = db.Column(db.Text)
    reported_date = db.Column(db.Date)
    resolved = db.Column(db.Boolean, default=False)
    resolution_notes = db.Column(db.Text)
    
    # Relationships
    membership = db.relationship('AssociationMembership', back_populates='violations')