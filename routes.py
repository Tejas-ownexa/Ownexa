from flask import jsonify
from app import app

# Sample route to test API
@app.route('/api/test', methods=['GET'])
def test_api():
    return jsonify({"message": "API is working!"})
