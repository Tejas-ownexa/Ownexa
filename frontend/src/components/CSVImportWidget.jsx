import React, { useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../utils/axios';

const CSVImportWidget = ({ 
  dataType, 
  onImportSuccess, 
  className = '',
  showTemplate = true,
  endpoint = null 
}) => {
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

  // Use pipeline API if no specific endpoint provided
  const getImportEndpoint = () => {
    if (endpoint) return endpoint;
    return `/api/pipeline/import/${dataType}`;
  };

  const getTemplateEndpoint = () => {
    return `/api/pipeline/template/${dataType}`;
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get(getTemplateEndpoint());
      
      if (response.data.success) {
        const { headers, sample_row, filename } = response.data;
        
        // Create CSV content with headers and sample row
        const csvContent = [
          headers.join(','),
          sample_row.join(',')
        ].join('\n');
        
        // Create and download the file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('CSV template downloaded!');
      } else {
        toast.error('Failed to get template');
      }
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('Failed to download template');
    }
  };

  const handleFileImport = async (file) => {
    setImporting(true);
    setImportResults(null);
    
    try {
      const formData = new FormData();
      formData.append('csv_file', file);
      
      const response = await axios.post(getImportEndpoint(), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        const { imported_count, errors } = response.data;
        
        setImportResults({
          success: true,
          imported_count,
          errors: errors || []
        });
        
        if (imported_count > 0) {
          toast.success(`Successfully imported ${imported_count} ${dataType}!`);
          if (onImportSuccess) {
            onImportSuccess(response.data);
          }
        }
        
        if (errors && errors.length > 0) {
          console.warn('Import warnings:', errors);
        }
      } else {
        setImportResults({
          success: false,
          errors: [response.data.error || 'Import failed']
        });
        toast.error('Import failed: ' + response.data.error);
      }
    } catch (error) {
      console.error('Import error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to import file. Please check your CSV format.';
      setImportResults({
        success: false,
        errors: [errorMessage]
      });
      toast.error(errorMessage);
    } finally {
      setImporting(false);
    }
  };

  const triggerFileInput = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    fileInput.style.display = 'none';
    
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      await handleFileImport(file);
      
      // Clean up
      document.body.removeChild(fileInput);
    };
    
    document.body.appendChild(fileInput);
    fileInput.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Import Buttons */}
      <div className="flex flex-wrap gap-2">
        {showTemplate && (
          <button 
            onClick={handleDownloadTemplate}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Template</span>
          </button>
        )}
        
        <button 
          onClick={triggerFileInput}
          disabled={importing}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="h-4 w-4" />
          <span>{importing ? 'Importing...' : 'Import CSV'}</span>
        </button>
      </div>

      {/* Import Results */}
      {importResults && (
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-start space-x-3">
            {importResults.success ? (
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            )}
            
            <div className="flex-1">
              <h4 className={`font-medium ${importResults.success ? 'text-green-800' : 'text-red-800'}`}>
                Import {importResults.success ? 'Successful' : 'Failed'}
              </h4>
              
              {importResults.success && importResults.imported_count > 0 && (
                <p className="text-sm text-green-600 mt-1">
                  Successfully imported {importResults.imported_count} {dataType}
                </p>
              )}
              
              {importResults.errors && importResults.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-red-600 mb-1">
                    Issues found:
                  </p>
                  <ul className="text-sm text-red-600 space-y-1 max-h-32 overflow-y-auto">
                    {importResults.errors.slice(0, 10).map((error, index) => (
                      <li key={index} className="flex items-start space-x-1">
                        <span className="text-red-400 mt-1">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                    {importResults.errors.length > 10 && (
                      <li className="text-red-500 italic">
                        ... and {importResults.errors.length - 10} more issues
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <FileText className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">CSV Import Tips:</p>
            <ul className="mt-1 space-y-1 text-blue-600">
              <li>• Download the template to see the required format</li>
              <li>• Ensure all required fields are filled</li>
              <li>• Use proper date formats (YYYY-MM-DD or MM/DD/YYYY)</li>
              <li>• Check for duplicate entries</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVImportWidget;
