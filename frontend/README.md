# Real Estate Management Frontend

A modern React-based frontend application for real estate property management. This application provides a comprehensive interface for managing properties, tenants, maintenance requests, and financial records.

## Features

- **Property Management**: Add, edit, and view property listings with image uploads
- **Tenant Management**: Manage tenant information and assignments
- **Maintenance Requests**: Create and track maintenance requests with vendor assignments
- **Financial Management**: Track rent payments, expenses, and financial records
- **User Authentication**: Secure login and registration system
- **Responsive Design**: Modern UI built with Tailwind CSS

## Tech Stack

- **React 18** - Frontend framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **React Hook Form** - Form handling
- **React Query** - Data fetching and caching
- **Tailwind CSS** - Styling framework
- **Lucide React** - Icon library
- **React Hot Toast** - Toast notifications

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will open in your browser at `http://localhost:3000`.

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App (one-way operation)

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth, etc.)
├── pages/              # Page components
├── utils/              # Utility functions and configurations
├── App.jsx             # Main application component
└── index.js            # Application entry point
```

## API Configuration

The frontend is configured to proxy API requests to `http://localhost:5000` (the Flask backend). Make sure your backend server is running on this port.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
