import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Upload, 
  Database, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Users,
  Building,
  Wrench,
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../utils/axios';
import CSVImportWidget from '../components/CSVImportWidget';

const DataImport = () => {
  const { user } = useAuth();
  const [importTypes, setImportTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImportTypes();
  }, []);

  const fetchImportTypes = async () => {
    try {
      const response = await axios.get('/api/pipeline/status');
      if (response.data.success) {
        setImportTypes(response.data.import_types);
      }
    } catch (error) {
      console.error('Error fetching import types:', error);
      toast.error('Failed to load import options');
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'properties':
        return Building;
      case 'tenants':
        return Users;
      case 'maintenance':
        return Wrench;
      case 'vendors':
        return UserCheck;
      default:
        return FileText;
    }
  };

  const handleImportSuccess = (type) => (data) => {
    // You can add specific logic here for each import type
    console.log(`${type} import successful:`, data);
    
    // Trigger any necessary refreshes or updates
    if (type === 'properties') {
      // Could dispatch an event or call a callback to refresh properties
    } else if (type === 'tenants') {
      // Could dispatch an event or call a callback to refresh tenants
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <Database className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Import Center</h1>
            <p className="text-gray-600">
              Import your data using CSV files. Download templates and import properties, tenants, and more.
            </p>
          </div>
        </div>
      </div>

      {/* Import Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {importTypes.map((importType) => {
          const Icon = getIconForType(importType.type);
          return (
            <div key={importType.type} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Icon className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">{importType.name}</h3>
                    <p className="text-sm text-gray-500">{importType.description}</p>
                  </div>
                </div>
                {importType.available ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Import Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {importTypes
          .filter(type => type.available)
          .map((importType) => {
            const Icon = getIconForType(importType.type);
            return (
              <div key={importType.type} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Icon className="h-6 w-6 text-blue-600" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Import {importType.name}
                    </h2>
                    <p className="text-sm text-gray-600">{importType.description}</p>
                  </div>
                </div>
                
                <CSVImportWidget
                  dataType={importType.type}
                  onImportSuccess={handleImportSuccess(importType.type)}
                  className="mt-4"
                />
              </div>
            );
          })}
      </div>

      {/* Coming Soon */}
      {importTypes.some(type => !type.available) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Coming Soon</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {importTypes
              .filter(type => !type.available)
              .map((importType) => {
                const Icon = getIconForType(importType.type);
                return (
                  <div key={importType.type} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg opacity-60">
                    <Icon className="h-5 w-5 text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-700">{importType.name}</h4>
                      <p className="text-sm text-gray-500">{importType.description}</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Import Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Import Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Before You Import</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Download and review the CSV template</li>
              <li>• Ensure all required fields are filled</li>
              <li>• Check for duplicate entries</li>
              <li>• Validate email addresses and phone numbers</li>
              <li>• Use proper date formats (YYYY-MM-DD)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Supported Formats</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• CSV files only (.csv extension)</li>
              <li>• UTF-8 encoding recommended</li>
              <li>• Maximum file size: 16MB</li>
              <li>• Column headers must match template</li>
              <li>• Dates: YYYY-MM-DD or MM/DD/YYYY</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataImport;
