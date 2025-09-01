import React, { useState } from 'react';
import ExcelImportWidget from '../components/ExcelImportWidget';
import { useNavigate } from 'react-router-dom';

const ExcelImportPage = () => {
  const [importComplete, setImportComplete] = useState(false);
  const navigate = useNavigate();

  const handleImportComplete = (results) => {
    setImportComplete(true);
    console.log('Import completed:', results);
  };

  const handleViewProperties = () => {
    navigate('/properties');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Excel Property Import</h1>
              <p className="mt-2 text-gray-600">
                Import property data from Excel files into your database
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Success Message */}
        {importComplete && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Import completed successfully!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    Your properties have been imported. You can now view them in the properties section.
                  </p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleViewProperties}
                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    View Properties
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Import Widget */}
          <div className="lg:col-span-2">
            <ExcelImportWidget onImportComplete={handleImportComplete} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Import Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Imports</span>
                  <span className="text-sm font-medium text-gray-900">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Properties Imported</span>
                  <span className="text-sm font-medium text-gray-900">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <span className="text-sm font-medium text-green-600">0%</span>
                </div>
              </div>
            </div>

            {/* File Requirements */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">File Requirements</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3"></div>
                  <span>Excel files (.xlsx, .xls) only</span>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3"></div>
                  <span>Maximum file size: 10MB per file</span>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3"></div>
                  <span>Data should start from row 6</span>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3"></div>
                  <span>Required columns: Property ID, Address, Description</span>
                </div>
              </div>
            </div>

            {/* Supported Formats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Supported Formats</h3>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl mr-3">🏠</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">ATK Properties</p>
                    <p className="text-xs text-gray-500">ATK Associates LLC</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl mr-3">🏢</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">KT Properties</p>
                    <p className="text-xs text-gray-500">KT Portfolio</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl mr-3">🏘️</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">RAS Properties</p>
                    <p className="text-xs text-gray-500">RAS Management</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl mr-3">📅</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Commercial</p>
                    <p className="text-xs text-gray-500">Purchase Dates</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Help */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Need Help?</h3>
              <p className="text-sm text-blue-700 mb-4">
                If you're having trouble with the import process, check our documentation or contact support.
              </p>
              <div className="space-y-2">
                <button className="w-full text-left text-sm text-blue-600 hover:text-blue-800">
                  📖 View Documentation
                </button>
                <button className="w-full text-left text-sm text-blue-600 hover:text-blue-800">
                  💬 Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelImportPage;
