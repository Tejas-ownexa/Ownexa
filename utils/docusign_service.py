import os
import base64
from typing import Optional, Tuple

try:
    from docusign_esign import (
        ApiClient,
        EnvelopesApi,
        EnvelopeDefinition,
        Document,
        SignHere,
        Tabs,
        Signer,
        Recipients,
        RecipientViewRequest,
        DateSigned,
        FullName,
        InitialHere
    )
    DOCUSIGN_AVAILABLE = True
except ImportError:
    DOCUSIGN_AVAILABLE = False
    print("Warning: DocuSign SDK not installed. Install with: pip install docusign-esign")


def _load_private_key_bytes() -> bytes:
    """Load DocuSign private key from environment variables"""
    if not DOCUSIGN_AVAILABLE:
        raise RuntimeError('DocuSign SDK not available. Install with: pip install docusign-esign')
        
    private_key_path = os.getenv('DOCUSIGN_PRIVATE_KEY_PATH')
    private_key_b64 = os.getenv('DOCUSIGN_PRIVATE_KEY_B64')

    if private_key_b64:
        return base64.b64decode(private_key_b64)
    if private_key_path and os.path.exists(private_key_path):
        with open(private_key_path, 'rb') as f:
            return f.read()
    raise RuntimeError('DocuSign private key not configured. Set DOCUSIGN_PRIVATE_KEY_PATH or DOCUSIGN_PRIVATE_KEY_B64')


def _get_api_client() -> Tuple[ApiClient, str]:
    """
    Returns an authenticated ApiClient and the base account_id.
    Uses JWT user token flow.
    """
    if not DOCUSIGN_AVAILABLE:
        raise RuntimeError('DocuSign SDK not available. Install with: pip install docusign-esign')
        
    integrator_key = os.getenv('DOCUSIGN_INTEGRATION_KEY')
    user_id = os.getenv('DOCUSIGN_USER_ID')
    account_id = os.getenv('DOCUSIGN_ACCOUNT_ID')
    base_path = os.getenv('DOCUSIGN_BASE_PATH', 'https://demo.docusign.net/restapi')
    oauth_host = os.getenv('DOCUSIGN_OAUTH_BASE_PATH', 'account-d.docusign.com')

    if not integrator_key or not user_id or not account_id:
        raise RuntimeError('Missing DocuSign env vars: DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_USER_ID, DOCUSIGN_ACCOUNT_ID')

    private_key_bytes = _load_private_key_bytes()

    api_client = ApiClient()
    api_client.host = base_path

    scopes = ['signature', 'impersonation']
    
    try:
        token = api_client.request_jwt_user_token(
            client_id=integrator_key,
            user_id=user_id,
            oauth_host_name=oauth_host,
            private_key_bytes=private_key_bytes,
            expires_in=3600,
            scopes=scopes,
        )
        api_client.set_default_header('Authorization', f'Bearer {token.access_token}')
        return api_client, account_id
    except Exception as e:
        if "consent_required" in str(e):
            # Try different redirect URIs to find one that works
            redirect_uris = [
                "https://www.docusign.com",
                "https://demo.docusign.net", 
                "https://account-d.docusign.com",
                "http://localhost:3000",
                "http://localhost"
            ]
            
            consent_urls = []
            for redirect_uri in redirect_uris:
                consent_url = f"https://{oauth_host}/oauth/auth?response_type=code&scope=signature%20impersonation&client_id={integrator_key}&redirect_uri={redirect_uri}"
                consent_urls.append(f"Try: {consent_url}")
            
            error_msg = f"User consent required. Try these URLs in order:\n" + "\n".join(consent_urls)
            raise RuntimeError(error_msg)
        else:
            raise e


def create_and_send_envelope_with_embedded_recipient(
    pdf_path: str,
    signer_email: str,
    signer_name: str,
    email_subject: str = 'Please sign the lease',
    client_user_id: str = 'tenant-embedded',
) -> Tuple[str, str]:
    """
    Creates an envelope with the provided PDF and returns (envelope_id, recipient_view_url).
    The recipient_view_url is a secure link for embedded signing (short-lived).
    """
    if not DOCUSIGN_AVAILABLE:
        raise RuntimeError('DocuSign SDK not available. Install with: pip install docusign-esign')
        
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f'PDF not found at {pdf_path}')

    with open(pdf_path, 'rb') as f:
        document_bytes = f.read()

    document = Document(
        document_base64=base64.b64encode(document_bytes).decode('ascii'),
        name=os.path.basename(pdf_path),
        file_extension='pdf',
        document_id='1',
    )

    # Place a SignHere tab on the first page at approximate position (in pixels from top-left)
    # Prefer anchor-based placement so fields land on placeholders in the PDF
    sign_here = SignHere(
        recipient_id='1',
        document_id='1',
        anchor_string='*signHereTenant*',
        anchor_units='pixels',
        anchor_x_offset='0',
        anchor_y_offset='0',
    )
    
    # Try to add additional signature fields if available
    date_signed = DateSigned(
        recipient_id='1',
        document_id='1',
        anchor_string='*dateSignedTenant*',
        anchor_units='pixels',
        anchor_x_offset='0',
        anchor_y_offset='0',
    )
    full_name = FullName(
        recipient_id='1',
        document_id='1',
        anchor_string='*fullNameTenant*',
        anchor_units='pixels',
        anchor_x_offset='0',
        anchor_y_offset='0',
    )
    initials_here = InitialHere(
        recipient_id='1',
        document_id='1',
        anchor_string='*initialsTenant*',
        anchor_units='pixels',
        anchor_x_offset='0',
        anchor_y_offset='0',
    )

    tabs = Tabs(
        sign_here_tabs=[sign_here],
        date_signed_tabs=[date_signed],
        full_name_tabs=[full_name],
        initial_here_tabs=[initials_here],
    )

    signer = Signer(email=signer_email, name=signer_name, recipient_id='1', client_user_id=client_user_id, tabs=tabs)
    recipients = Recipients(signers=[signer])

    envelope_definition = EnvelopeDefinition(
        email_subject=email_subject,
        documents=[document],
        recipients=recipients,
        status='sent',
    )

    api_client, account_id = _get_api_client()
    envelopes_api = EnvelopesApi(api_client)
    results = envelopes_api.create_envelope(account_id=account_id, envelope_definition=envelope_definition)
    envelope_id = results.envelope_id

    # Create the recipient view (embedded signing URL)
    return_url = os.getenv('DOCUSIGN_RETURN_URL', 'http://localhost:3000/docusign/complete')
    view_request = RecipientViewRequest(
        return_url=return_url,
        authentication_method='none',
        email=signer_email,
        user_name=signer_name,
        client_user_id=client_user_id,
    )
    view_result = envelopes_api.create_recipient_view(account_id=account_id, envelope_id=envelope_id, recipient_view_request=view_request)
    return envelope_id, view_result.url


def create_and_send_email_envelope(
    pdf_path: str,
    signer_email: str,
    signer_name: str,
    email_subject: str = 'Please sign the lease',
) -> str:
    """
    Creates and sends an email-based envelope (no embedded signing). Returns envelope_id.
    """
    if not DOCUSIGN_AVAILABLE:
        raise RuntimeError('DocuSign SDK not available. Install with: pip install docusign-esign')
        
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f'PDF not found at {pdf_path}')

    with open(pdf_path, 'rb') as f:
        document_bytes = f.read()

    document = Document(
        document_base64=base64.b64encode(document_bytes).decode('ascii'),
        name=os.path.basename(pdf_path),
        file_extension='pdf',
        document_id='1',
    )

    sign_here = SignHere(
        recipient_id='1',
        document_id='1',
        anchor_string='*signHereTenant*',
        anchor_units='pixels',
        anchor_x_offset='0',
        anchor_y_offset='0',
    )
    
    # Try to add additional signature fields
    date_signed = DateSigned(
        recipient_id='1',
        document_id='1',
        anchor_string='*dateSignedTenant*',
        anchor_units='pixels',
        anchor_x_offset='0',
        anchor_y_offset='0',
    )
    full_name = FullName(
        recipient_id='1',
        document_id='1',
        anchor_string='*fullNameTenant*',
        anchor_units='pixels',
        anchor_x_offset='0',
        anchor_y_offset='0',
    )
    initials_here = InitialHere(
        recipient_id='1',
        document_id='1',
        anchor_string='*initialsTenant*',
        anchor_units='pixels',
        anchor_x_offset='0',
        anchor_y_offset='0',
    )

    tabs = Tabs(
        sign_here_tabs=[sign_here],
        date_signed_tabs=[date_signed],
        full_name_tabs=[full_name],
        initial_here_tabs=[initials_here],
    )

    signer = Signer(email=signer_email, name=signer_name, recipient_id='1', tabs=tabs)
    recipients = Recipients(signers=[signer])

    envelope_definition = EnvelopeDefinition(
        email_subject=email_subject,
        documents=[document],
        recipients=recipients,
        status='sent',
    )

    api_client, account_id = _get_api_client()
    envelopes_api = EnvelopesApi(api_client)
    results = envelopes_api.create_envelope(account_id=account_id, envelope_definition=envelope_definition)
    return results.envelope_id


def get_envelope_status(envelope_id: str) -> str:
    """
    Returns the envelope status string (e.g., 'created', 'sent', 'completed', 'voided').
    """
    if not DOCUSIGN_AVAILABLE:
        raise RuntimeError('DocuSign SDK not available. Install with: pip install docusign-esign')
        
    api_client, account_id = _get_api_client()
    envelopes_api = EnvelopesApi(api_client)
    env = envelopes_api.get_envelope(account_id=account_id, envelope_id=envelope_id)
    return getattr(env, 'status', 'unknown')


def download_signed_document(envelope_id: str, target_file_path: str) -> str:
    """
    Downloads the combined (fully signed) PDF for the envelope and saves it to target_file_path.
    Returns the saved path.
    """
    if not DOCUSIGN_AVAILABLE:
        raise RuntimeError('DocuSign SDK not available. Install with: pip install docusign-esign')
        
    api_client, account_id = _get_api_client()
    envelopes_api = EnvelopesApi(api_client)
    # 'combined' document id gives the full signed PDF
    byte_stream = envelopes_api.get_document(account_id=account_id, envelope_id=envelope_id, document_id='combined')
    os.makedirs(os.path.dirname(target_file_path), exist_ok=True)
    with open(target_file_path, 'wb') as f:
        f.write(byte_stream)
        f.flush()
        os.fsync(f.fileno())
    return target_file_path
