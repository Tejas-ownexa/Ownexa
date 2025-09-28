# Lease Generator

A full-stack web application for generating lease documents with customizable templates and PDF output.

## Features

- 📝 Dynamic lease document generation
- 🎨 Customizable lease templates
- 📄 PDF export functionality
- 💾 SQLite database for data persistence
- 🌐 Modern React frontend with Tailwind CSS
- ⚡ Flask backend API
- ✍️ DocuSign integration (embedded or email signing)

## Tech Stack

### Backend
- **Flask** - Python web framework
- **SQLAlchemy** - Database ORM
- **ReportLab** - PDF generation
- **PyPDF** - PDF manipulation
- **SQLite** - Database
- **DocuSign eSignature SDK** - Envelope creation and signing links

### Frontend
- **React** - Frontend framework
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

## Project Structure

```
Lease Generator/
├── backend/                 # Flask backend
│   ├── app.py              # Main Flask application
│   ├── models.py           # Database models
│   ├── routes.py           # API routes
│   ├── utils.py            # Utility functions
│   ├── requirements.txt    # Python dependencies
│   ├── uploads/            # File uploads
│   │   ├── generated/      # Generated PDFs
│   │   └── templates/      # Lease templates
│   └── venv/              # Virtual environment
├── frontend/               # React frontend
│   ├── src/
│   │   ├── App.js
│   │   ├── LeaseGenerator.js
│   │   └── index.js
│   ├── public/
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 16+
- npm

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd "Lease Generator/backend"
   ```

2. Activate the virtual environment:
   ```bash
   # Windows
   .\venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies (if needed):
   ```bash
   pip install -r requirements.txt
   ```

4. Start the Flask server:
   ```bash
   python app.py
   ```

The backend will run on `http://localhost:5001`

#### DocuSign Configuration

Set the following environment variables (create a `.env` file in `Lease Generator/backend`):

```
DOCUSIGN_INTEGRATION_KEY=YOUR_INTEGRATOR_KEY
DOCUSIGN_USER_ID=YOUR_IMPERSONATED_USER_GUID
DOCUSIGN_ACCOUNT_ID=YOUR_ACCOUNT_ID
DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi
DOCUSIGN_OAUTH_BASE_PATH=account-d.docusign.com
# Provide either a file path to the RSA private key or a base64-encoded key
DOCUSIGN_PRIVATE_KEY_PATH=C:\\path\\to\\private.key
# DOCUSIGN_PRIVATE_KEY_B64=base64-encoded-private-key
DOCUSIGN_RETURN_URL=http://localhost:3000/docusign/complete
```

Notes:
- The integration uses JWT grant with scopes `signature` and `impersonation`.
- Ensure the user is consented. You can obtain consent by visiting (replace values):
  `https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=YOUR_INTEGRATOR_KEY&redirect_uri=http://localhost`
  and approving once (one-time user consent).
- Use the Demo environment keys for testing.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd "Lease Generator/frontend"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The frontend will run on `http://localhost:3000`

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /api/generate-filled` - Generate filled lease document
- `GET /api/download/:filename` - Download generated PDF
- `POST /api/docusign/send` - Body: `{ filename, tenantEmail, tenantFullName, mode: 'embedded'|'email' }`
  - Returns embedded signing URL when `mode=embedded`, or `envelopeId` for email mode

## Usage

1. Start both backend and frontend servers
2. Open `http://localhost:3000` in your browser
3. Fill in the lease details in the form
4. Click generate to create your lease PDF
5. Download the generated document

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Author

**paritownexa** - [GitHub Profile](https://github.com/paritownexa)
