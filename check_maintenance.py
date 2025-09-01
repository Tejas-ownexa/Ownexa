from config import app, db
from models import MaintenanceRequest, Property, Tenant

with app.app_context():
    maintenance_requests = MaintenanceRequest.query.all()
    print(f"\nTotal maintenance requests: {len(maintenance_requests)}")
    
    for request in maintenance_requests:
        print(f"\nMaintenance Request {request.id}:")
        print(f"Description: {request.request_description}")
        print(f"Status: {request.status}")
        print(f"Request Date: {request.request_date}")
        print(f"Property ID: {request.property_id}")
        print(f"Tenant ID: {request.tenant_id}")
        
        # Get property details
        property = Property.query.get(request.property_id)
        if property:
            print(f"Property: {property.title}")
            print(f"Owner ID: {property.owner_id}")
        else:
            print("Property not found")
            
            
        # Get tenant details
        tenant = Tenant.query.get(request.tenant_id)
        if tenant:
            print(f"Tenant: {tenant.full_name}")
        else:
            print("Tenant not found")
