from datetime import date

def get_tenant_lease_status(tenant):
    """Determine if tenant's lease is active based on lease dates"""
    if not tenant.lease_start or not tenant.lease_end:
        return 'unknown'
    
    today = date.today()
    if tenant.lease_start <= today <= tenant.lease_end:
        return 'active'
    elif today > tenant.lease_end:
        return 'expired'
    elif today < tenant.lease_start:
        return 'future'
    else:
        return 'inactive'

def get_comprehensive_tenant_info(tenant):
    """Get comprehensive tenant information including lease status and location"""
    if not tenant:
        return None
    
    lease_status = get_tenant_lease_status(tenant)
    
    # Calculate days until lease expiry for active leases
    days_until_expiry = None
    if lease_status == 'active' and tenant.lease_end:
        days_until_expiry = (tenant.lease_end - date.today()).days
    
    tenant_info = {
        'id': tenant.id,
        'full_name': tenant.full_name,
        'email': tenant.email,
        'phone_number': tenant.phone_number,
        'lease_status': lease_status,
        'lease_start': tenant.lease_start.isoformat() if tenant.lease_start else None,
        'lease_end': tenant.lease_end.isoformat() if tenant.lease_end else None,
        'days_until_lease_expiry': days_until_expiry,
        'rent_amount': float(tenant.rent_amount) if tenant.rent_amount else None,
        'payment_status': tenant.payment_status,
    }
    
    # Add property location information
    if tenant.property:
        tenant_info['property_location'] = {
            'property_title': tenant.property.title,
            'street_address_1': tenant.property.street_address_1,
            'street_address_2': tenant.property.street_address_2,
            'apt_number': tenant.property.apt_number,
            'city': tenant.property.city,
            'state': tenant.property.state,
            'zip_code': tenant.property.zip_code,
            'full_address': f"{tenant.property.street_address_1}"
                           f"{', ' + tenant.property.street_address_2 if tenant.property.street_address_2 else ''}"
                           f"{', Apt ' + tenant.property.apt_number if tenant.property.apt_number else ''}"
                           f", {tenant.property.city}, {tenant.property.state} {tenant.property.zip_code}"
        }
    
    return tenant_info
