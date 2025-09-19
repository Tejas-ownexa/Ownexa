from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from models import db
from routes import api
import os

load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app)

    # --- Database Configuration ---
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///leasing.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)

    # --- Create Folders ---
    for folder in ['uploads/generated', 'uploads/templates']:
        if not os.path.exists(folder):
            os.makedirs(folder)

    # --- Register Routes ---
    app.register_blueprint(api, url_prefix='/api')

    # --- Add basic health check ---
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'message': 'Backend is running'}

    return app

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    
    print("Starting Lease Generator backend on http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)
