#!/usr/bin/env python3
"""
DocuSign bypass for testing - simulates DocuSign functionality without actual API calls
This allows testing the integration flow while the consent issue is being resolved
"""
import os
import uuid
import time
from typing import Tuple

def create_and_send_email_envelope_bypass(
    pdf_path: str,
    signer_email: str,
    signer_name: str,
    email_subject: str = 'Please sign the lease',
) -> str:
    """
    Bypass function that simulates DocuSign envelope creation
    Returns a fake envelope ID for testing
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f'PDF not found at {pdf_path}')
    
    # Generate a fake envelope ID
    envelope_id = f"bypass-{uuid.uuid4().hex[:8]}-{int(time.time())}"
    
    # Log the simulated action
    print(f"🔄 BYPASS MODE: Simulating DocuSign envelope creation")
    print(f"   📄 Document: {os.path.basename(pdf_path)}")
    print(f"   📧 Signer: {signer_name} ({signer_email})")
    print(f"   📝 Subject: {email_subject}")
    print(f"   🆔 Envelope ID: {envelope_id}")
    print(f"   ✅ Simulated email sent to {signer_email}")
    
    return envelope_id

def create_and_send_envelope_with_embedded_recipient_bypass(
    pdf_path: str,
    signer_email: str,
    signer_name: str,
    email_subject: str = 'Please sign the lease',
    client_user_id: str = 'tenant-embedded',
) -> Tuple[str, str]:
    """
    Bypass function that simulates embedded DocuSign envelope creation
    Returns (envelope_id, fake_signing_url) for testing
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f'PDF not found at {pdf_path}')
    
    # Generate fake IDs
    envelope_id = f"bypass-{uuid.uuid4().hex[:8]}-{int(time.time())}"
    signing_url = f"https://demo.docusign.net/bypass/signing/{envelope_id}?token={uuid.uuid4().hex}"
    
    # Log the simulated action
    print(f"🔄 BYPASS MODE: Simulating embedded DocuSign envelope creation")
    print(f"   📄 Document: {os.path.basename(pdf_path)}")
    print(f"   📧 Signer: {signer_name} ({signer_email})")
    print(f"   📝 Subject: {email_subject}")
    print(f"   🆔 Envelope ID: {envelope_id}")
    print(f"   🔗 Signing URL: {signing_url}")
    print(f"   ✅ Embedded signing session created")
    
    return envelope_id, signing_url

def get_envelope_status_bypass(envelope_id: str) -> str:
    """
    Bypass function that simulates envelope status checking
    Returns a fake status for testing
    """
    print(f"🔄 BYPASS MODE: Simulating envelope status check for {envelope_id}")
    
    # Simulate different statuses based on envelope ID patterns
    if "bypass" in envelope_id:
        return "sent"  # Default status for bypass envelopes
    else:
        return "unknown"

def download_signed_document_bypass(envelope_id: str, target_file_path: str) -> str:
    """
    Bypass function that simulates downloading a signed document
    Creates a dummy signed PDF file for testing
    """
    print(f"🔄 BYPASS MODE: Simulating signed document download for {envelope_id}")
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(target_file_path), exist_ok=True)
    
    # Create a dummy signed PDF file
    with open(target_file_path, 'w') as f:
        f.write(f"""Dummy signed PDF content for envelope {envelope_id}
This is a simulated signed document created in bypass mode.
Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}
""")
    
    print(f"   ✅ Dummy signed document saved to: {target_file_path}")
    return target_file_path

def test_bypass():
    """Test the bypass functionality"""
    print("🧪 Testing DocuSign Bypass Mode")
    print("=" * 50)
    
    # Create a test PDF path (doesn't need to exist for this test)
    test_pdf = "test_lease.pdf"
    
    # Create a dummy PDF file for testing
    with open(test_pdf, 'w') as f:
        f.write("Test PDF content")
    
    try:
        # Test email envelope
        envelope_id = create_and_send_email_envelope_bypass(
            pdf_path=test_pdf,
            signer_email="tenant@example.com",
            signer_name="Test Tenant",
            email_subject="Test Lease Agreement"
        )
        
        print(f"\n✅ Email bypass test successful!")
        print(f"   Envelope ID: {envelope_id}")
        
        # Test embedded envelope
        envelope_id2, signing_url = create_and_send_envelope_with_embedded_recipient_bypass(
            pdf_path=test_pdf,
            signer_email="tenant@example.com",
            signer_name="Test Tenant"
        )
        
        print(f"\n✅ Embedded bypass test successful!")
        print(f"   Envelope ID: {envelope_id2}")
        print(f"   Signing URL: {signing_url}")
        
        # Test status check
        status = get_envelope_status_bypass(envelope_id)
        print(f"\n✅ Status check test successful!")
        print(f"   Status: {status}")
        
        # Clean up test file
        os.remove(test_pdf)
        
        return True
        
    except Exception as e:
        print(f"❌ Bypass test failed: {e}")
        # Clean up test file
        if os.path.exists(test_pdf):
            os.remove(test_pdf)
        return False

if __name__ == "__main__":
    test_bypass()
