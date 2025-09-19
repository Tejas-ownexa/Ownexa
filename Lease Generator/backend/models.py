from flask_sqlalchemy import SQLAlchemy
import datetime

db = SQLAlchemy()

class PDFTemplate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    filepath = db.Column(db.String(255), nullable=False, unique=True)
    uploaded_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    form_fields_count = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'uploaded_at': self.uploaded_at.isoformat(),
            'form_fields_count': self.form_fields_count
        }
