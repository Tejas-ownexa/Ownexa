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
        envelope_id = create_and_send_email_envelope_bypass(
            pdf_path=test_pdf,
            signer_email="tenant@example.com",
            signer_name="Test Tenant",
            email_subject="Test Lease Agreement"
        )
        
        print(f"\n✅ Bypass test successful!")
        print(f"   Envelope ID: {envelope_id}")
        
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
