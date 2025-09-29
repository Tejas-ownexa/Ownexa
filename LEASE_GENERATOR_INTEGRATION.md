# Lease Generator Integration

This document describes the integration of the standalone Lease Generator application into the main Ownexa property management system.

## Overview

The Lease Generator has been successfully integrated into the main Ownexa application, providing enhanced lease document generation capabilities with PDF form filling and DocuSign e-signature integration.

## Features Integrated

### 1. Enhanced AI Lease Generation
- **Location**: `/api/ai-lease/generate-lease`
- **Frontend**: `frontend/src/pages/AddDraftLease.jsx`
- **Features**:
  - PDF template selection
  - Form field mapping and filling
  - Automatic PDF generation with tenant-specific naming
  - Download functionality

### 2. Template Management
- **Upload Endpoint**: `/api/ai-lease/templates` (POST)
- **List Endpoint**: `/api/ai-lease/templates` (GET)
- **Frontend Component**: `frontend/src/components/LeaseTemplateManager.jsx`
- **Features**:
  - PDF template upload via drag-and-drop or file selection
  - Template validation (PDF format, form fields)
  - Template listing with metadata

### 3. DocuSign Integration
- **Send Endpoint**: `/api/ai-lease/docusign/send`
- **Status Endpoint**: `/api/ai-lease/docusign/status/<envelope_id>`
- **Download Endpoint**: `/api/ai-lease/docusign/download-signed/<envelope_id>`
- **Features**:
  - Email-based signing
  - Embedded signing (opens in new window)
  - Envelope status tracking
  - Signed document download

### 4. Backend Services
- **DocuSign Service**: `utils/docusign_service.py`
- **DocuSign Bypass**: `utils/docusign_bypass.py` (for testing without API keys)
- **PDF Generator**: `utils/ai_lease_generator.py` (enhanced with template selection)

## File Structure

```
Ownexa/
├── routes/
│   └── ai_lease_routes.py          # Enhanced lease generation API routes
├── utils/
│   ├── ai_lease_generator.py       # Enhanced PDF generation with template support
│   ├── docusign_service.py         # DocuSign API integration
│   └── docusign_bypass.py          # Testing bypass for DocuSign
├── uploads/
│   ├── templates/                  # PDF lease templates
│   ├── generated/                  # Generated lease PDFs
│   └── signed/                     # Signed documents from DocuSign
├── frontend/src/
│   ├── pages/
│   │   └── AddDraftLease.jsx       # Enhanced lease generation UI
│   └── components/
│       └── LeaseTemplateManager.jsx # Template upload/management UI
└── requirements.txt                # Updated with docusign-esign
```

## Configuration

### DocuSign Setup (Optional)
To enable DocuSign integration, set these environment variables:

```bash
# DocuSign Configuration
DOCUSIGN_INTEGRATION_KEY=your_integration_key
DOCUSIGN_USER_ID=your_user_guid
DOCUSIGN_ACCOUNT_ID=your_account_id
DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi
DOCUSIGN_OAUTH_BASE_PATH=account-d.docusign.com
DOCUSIGN_PRIVATE_KEY_PATH=/path/to/private.key
# OR
DOCUSIGN_PRIVATE_KEY_B64=base64_encoded_private_key
DOCUSIGN_RETURN_URL=http://localhost:3000/docusign/complete
```

### User Consent
For DocuSign to work, user consent is required. Visit this URL once (replace with your values):
```
https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=YOUR_INTEGRATOR_KEY&redirect_uri=http://localhost:3000
```

## Usage

### 1. Access the Lease Generator
- Navigate to the Leasing section in Ownexa
- Click "Add Draft Lease" or go directly to `/add-draft-lease`

### 2. Upload Templates
- Click "Upload Template" in the Template & Options section
- Drag and drop or select a PDF file with fillable form fields
- Ensure form field names match the expected mapping (see below)

### 3. Generate Leases
- Fill in the lease information form
- Select a template from the dropdown
- Optionally enable DocuSign integration
- Click "Generate & Download Lease"

### 4. DocuSign Integration
- Check "Send for DocuSign e-signature after generation"
- Choose between Email Signing or Embedded Signing
- Ensure tenant email and name are provided
- The lease will be automatically sent for signing after generation

## PDF Template Requirements

### Form Field Names
Your PDF template should include fillable form fields with these names:
- `landlordFullName`
- `tenantFullName`
- `landlordEmail`
- `landlordPhone`
- `tenantEmail`
- `tenantPhone`
- `streetAddress`
- `unitNumber`
- `city`
- `zipCode`
- `includedFurniture`
- `leaseTerm`
- `leaseStartDate`
- `leaseEndDate`
- `monthlyRent`
- `rentDueDay`
- `securityDeposit`
- `lateFee`
- `lateFeeGracePeriod`
- `petsPolicy`
- `smokingPolicy`
- `earlyTerminationFee`
- `earlyTerminationAmount`
- `agentName`
- `agentAddress`

### DocuSign Anchor Strings (Optional)
For DocuSign integration, add these anchor strings in your PDF:
- `*signHereTenant*` - Where tenant should sign
- `*dateSignedTenant*` - Where date should be filled
- `*fullNameTenant*` - Where full name should be filled
- `*initialsTenant*` - Where initials should be placed

## API Endpoints

### Lease Generation
```http
POST /api/ai-lease/generate-lease
Content-Type: application/json

{
  "landlordFullName": "John Doe",
  "tenantFullName": "Jane Smith",
  "monthlyRent": "1500",
  "selectedTemplate": "condo or apt.pdf",
  // ... other lease data
}
```

### Template Management
```http
# Upload template
POST /api/ai-lease/templates
Content-Type: multipart/form-data
Body: file=template.pdf

# List templates
GET /api/ai-lease/templates
```

### DocuSign Integration
```http
# Send for signing
POST /api/ai-lease/docusign/send
Content-Type: application/json

{
  "filename": "Lease_JANE_SMITH_20241201_120000.pdf",
  "tenantEmail": "jane@example.com",
  "tenantFullName": "Jane Smith",
  "mode": "email"  // or "embedded"
}

# Check status
GET /api/ai-lease/docusign/status/{envelope_id}

# Download signed document
GET /api/ai-lease/docusign/download-signed/{envelope_id}
```

## Testing

### Without DocuSign
The system works fully without DocuSign configuration. PDF generation and download work independently.

### With DocuSign Bypass
If DocuSign is not configured, the system will use bypass mode for testing, which simulates the DocuSign workflow without actually sending documents.

### With Full DocuSign
Once properly configured with API keys and user consent, the system provides full DocuSign integration.

## Dependencies

The integration adds one new dependency:
```
docusign-esign==3.24.0
```

## Error Handling

The system includes comprehensive error handling for:
- Missing templates
- Invalid PDF files
- DocuSign API errors
- Network connectivity issues
- Form validation errors

## Security Considerations

- All file uploads are validated for PDF format
- DocuSign credentials are stored as environment variables
- Generated files are stored in secure upload directories
- API endpoints are protected with authentication tokens

## Future Enhancements

Potential improvements for future versions:
1. Template versioning and management
2. Bulk lease generation
3. Custom field mapping configuration
4. Integration with property and tenant data
5. Automated lease renewal workflows
6. Digital signature tracking and reporting
