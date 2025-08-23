from . import BaseModel, db

class Listing(BaseModel):
    __tablename__ = 'listings'
    
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'))
    listing_date = db.Column(db.Date)
    listed_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    status = db.Column(db.String(50))
    rent_price = db.Column(db.Numeric(10, 2))
    notes = db.Column(db.Text)
    
    # Relationships
    property = db.relationship('Property', back_populates='listings')
    listed_by_user = db.relationship('User', backref='listings')
    applicants = db.relationship('Applicant', back_populates='listing')

class Applicant(BaseModel):
    __tablename__ = 'applicants'
    
    id = db.Column(db.Integer, primary_key=True)
    listing_id = db.Column(db.Integer, db.ForeignKey('listings.id'))
    full_name = db.Column(db.String(100))
    email = db.Column(db.String(100))
    phone_number = db.Column(db.String(20))
    status = db.Column(db.String(50))
    application_date = db.Column(db.Date)
    
    # Relationships
    listing = db.relationship('Listing', back_populates='applicants')