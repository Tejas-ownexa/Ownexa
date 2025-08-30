def handler(event, context):
    """Vercel serverless function handler"""
    # Simple response for now
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        'body': {
            'message': 'Ownexa Real Estate Management API',
            'version': '1.0',
            'status': 'running'
        }
    }
