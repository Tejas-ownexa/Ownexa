import React, { useState, useEffect } from 'react';
import PDFFormGenerator from '../components/PDFFormGenerator';
import axios from '../utils/axios';

const RentalApplication = () => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [formTypes, setFormTypes] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      // Check if the PDF generation system is working
      const [statusResponse, typesResponse] = await Promise.all([
        axios.get('/'),
        axios.get('/pdf-generation/form-types')
      ]);

      setSystemStatus(statusResponse.data);
      setFormTypes(typesResponse.data.form_types);
    } catch (error) {
      console.error('System check failed:', error);
      setSystemStatus({ error: 'System unavailable' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rental application system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🏠 Ownexa Property Management
          </h1>
          <h2 className="text-xl text-gray-600 mb-4">
            Rental Application with E-Signature
          </h2>
          
          {/* System Status */}
          {systemStatus && !systemStatus.error && (
            <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
              <span className="text-sm">System Online - PDF Generation Ready</span>
            </div>
          )}
          
          {systemStatus?.error && (
            <div className="inline-flex items-center space-x-2 bg-red-100 text-red-800 px-4 py-2 rounded-lg">
              <span className="w-2 h-2 bg-red-600 rounded-full"></span>
              <span className="text-sm">System Error: {systemStatus.error}</span>
            </div>
          )}
        </div>

        {/* Available Form Types Info */}
        {formTypes && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">📋 Available Application Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(formTypes).map(([key, info]) => (
                <div key={key} className="bg-white rounded p-3 border">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">
                      {key === 'condo_apt' ? '🏢' : '🏡'}
                    </span>
                    <h4 className="font-medium capitalize">{key.replace('_', ' ')}</h4>
                    {info.template_exists ? (
                      <span className="text-green-600 text-sm">✅ Ready</span>
                    ) : (
                      <span className="text-red-600 text-sm">❌ Template Missing</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{info.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Template: {info.template_file}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 text-sm text-blue-700">
              <p>💡 <strong>Smart Detection:</strong> The system automatically selects the correct form based on your property information.</p>
            </div>
          </div>
        )}

        {/* Features Overview */}
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">✨ How it Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">📝</span>
              </div>
              <h4 className="font-medium text-gray-800">1. Fill Form</h4>
              <p className="text-sm text-gray-600">Complete your rental application details</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">🤖</span>
              </div>
              <h4 className="font-medium text-gray-800">2. Auto-Select</h4>
              <p className="text-sm text-gray-600">System picks the right PDF template</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">✍️</span>
              </div>
              <h4 className="font-medium text-gray-800">3. E-Sign</h4>
              <p className="text-sm text-gray-600">Add your electronic signature</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">📄</span>
              </div>
              <h4 className="font-medium text-gray-800">4. Download</h4>
              <p className="text-sm text-gray-600">Get your completed PDF instantly</p>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <PDFFormGenerator />

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>© 2024 Ownexa Property Management - Secure PDF Generation with E-Signature</p>
          <p className="mt-1">🔒 All data is processed securely and confidentially</p>
        </div>
      </div>
    </div>
  );
};

export default RentalApplication;