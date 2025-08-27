import requests
r = requests.post('http://127.0.0.1:5001/api/pdf-generation/generate', json={'full_name': 'Jane Smith', 'property_address': '456 Oak Ave', 'property_type': 'single family', 'rent_amount': '1500'})
print('Status:', r.status_code)
if r.status_code == 200:
    result = r.json()
    print('Form type:', result['form_type'])
    print('Download URL:', result['download_url'])
else:
    print('Error:', r.text)
