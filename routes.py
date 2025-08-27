from flask import jsonify

# Sample route to test API
def test_api():
    return jsonify({"message": "API is working!"})

def init_routes(app):
    app.add_url_rule('/api/test', 'test_api', test_api, methods=['GET'])