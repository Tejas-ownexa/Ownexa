import React, { useState, useRef } from 'react';
import axios from '../utils/axios';

const ExcelImportWidget = ({ onImportComplete }) => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [importStats, setImportStats] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    const excelFiles = selectedFiles.filter(file => 
      file.name.toLowerCase().endsWith('.xlsx') || 
      file.name.toLowerCase().endsWith('.xls')
    );
    
    if (excelFiles.length !== selectedFiles.length) {
      setError('Only Excel files (.xlsx, .xls) are allowed');
      return;
    }
    
    setFiles(excelFiles);
    setError(null);
    setResults(null);
    setImportStats(null);
  };

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const validateFileSize = (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`);
    }
  };

  const checkBackendConnection = async () => {
    try {
      await axios.get('/api/pipeline/status');
      return true;
    } catch (error) {
      console.error('Backend connection check failed:', error);
      return false;
    }
  };

  const uploadWithRetry = async (formData, isValidation = false, retryCount = 0) => {
    try {
      const endpoint = '/api/pipeline/import-excel-properties' + (isValidation ? '?dry_run=true' : '');
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const baseProgress = isValidation ? 0 : 50;
          const progress = baseProgress + Math.round((progressEvent.loaded * 50) / progressEvent.total);
          setUploadProgress(progress);
        },
        timeout: 60000, // 60 second timeout
      });
      return response;
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        console.log(`Attempt ${retryCount + 1} failed, retrying...`);
        await sleep(RETRY_DELAY);
        return uploadWithRetry(formData, isValidation, retryCount + 1);
      }
      throw error;
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one Excel file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setResults(null);
    setImportStats(null);

    try {
      // Check backend connection first
      const isConnected = await checkBackendConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to server. Please check your internet connection and try again.');
      }

      // Validate file sizes
      for (const file of files) {
        validateFileSize(file);
      }

      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      // First do a dry run to validate the data
      const dryRunResponse = await uploadWithRetry(formData, true);

      // Check dry run results
      if (dryRunResponse.data.errors && dryRunResponse.data.errors.length > 0) {
        setError('Validation failed. Please fix the following issues:');
        setResults({
          type: 'error',
          errors: dryRunResponse.data.errors,
          warnings: dryRunResponse.data.warnings || []
        });
        setIsUploading(false);
        return;
      }

      // If dry run successful, proceed with actual import
      const response = await axios.post('/api/pipeline/import-excel-properties', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = 50 + Math.round((progressEvent.loaded * 50) / progressEvent.total); // Start from 50%
          setUploadProgress(progress);
        },
      });

      // Process import results
      if (response.data.success) {
        const stats = {
          total: response.data.total_processed || 0,
          saved: response.data.saved || 0,
          skipped: response.data.skipped || 0,
          failed: response.data.failed || 0
        };
        
        setImportStats(stats);
        setResults({
          type: 'success',
          errors: response.data.errors || [],
          warnings: response.data.warnings || [],
          fileResults: response.data.file_results || []
        });
        
        if (onImportComplete) {
          onImportComplete(stats);
        }
      } else {
        setError('Import failed');
        setResults({
          type: 'error',
          errors: response.data.errors || ['Unknown error occurred'],
          warnings: response.data.warnings || []
        });
      }
    } catch (err) {
      console.error('Import error:', err);
      let errorMessage = 'Import failed: ';
      
      if (err.message === 'Network Error') {
        errorMessage += 'Cannot connect to server. Please check your internet connection and try again.';
      } else if (err.response?.status === 413) {
        errorMessage += 'Files are too large. Please try uploading smaller files or fewer files at once.';
      } else if (err.code === 'ECONNABORTED') {
        errorMessage += 'Request timed out. Please try again with a smaller file or check your connection.';
      } else if (err.response?.data?.error) {
        errorMessage += err.response.data.error;
      } else {
        errorMessage += err.message;
      }
      
      setError(errorMessage);
      setResults({
        type: 'error',
        errors: [errorMessage],
        warnings: []
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const clearFiles = () => {
    setFiles([]);
    setResults(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileName) => {
    if (fileName.toLowerCase().includes('atk')) return '🏠';
    if (fileName.toLowerCase().includes('kt')) return '🏢';
    if (fileName.toLowerCase().includes('ras')) return '🏘️';
    if (fileName.toLowerCase().includes('compra') || fileName.toLowerCase().includes('fechas')) return '📅';
    return '📄';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Excel Property Import</h2>
        <p className="text-gray-600">
          Upload Excel files containing property data. The system will automatically detect and process ATK, KT, RAS, and commercial properties.
        </p>
      </div>

      {/* File Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Excel Files
        </label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <p className="text-xs text-gray-500 mt-1">
          Supported formats: .xlsx, .xls
        </p>
      </div>

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h3>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl mr-3">{getFileIcon(file.name)}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {uploadProgress < 100 ? 'Processing...' : 'Importing...'}
            </span>
            <span className="text-sm text-gray-500">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Import Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{results.total_properties_processed}</div>
              <div className="text-sm text-blue-800">Total Properties</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{results.successful_properties}</div>
              <div className="text-sm text-green-800">Successful</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{results.failed_properties}</div>
              <div className="text-sm text-red-800">Failed</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{results.saved || 0}</div>
              <div className="text-sm text-purple-800">Saved to DB</div>
            </div>
          </div>

          {results.errors && results.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Errors:</h4>
              <div className="max-h-32 overflow-y-auto">
                {results.errors.slice(0, 10).map((error, index) => (
                  <p key={index} className="text-xs text-red-600 mb-1">• {error}</p>
                ))}
                {results.errors.length > 10 && (
                  <p className="text-xs text-gray-500">... and {results.errors.length - 10} more errors</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={handleUpload}
          disabled={isUploading || files.length === 0}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? 'Processing...' : 'Import Properties'}
        </button>
        <button
          onClick={clearFiles}
          disabled={isUploading}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Supported File Types:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• <strong>ATK Properties:</strong> ATK Associates LLC property listings</li>
          <li>• <strong>KT Properties:</strong> KT property portfolio data</li>
          <li>• <strong>RAS Properties:</strong> RAS property management data</li>
          <li>• <strong>Commercial Properties:</strong> Purchase date and commercial property data</li>
        </ul>
      </div>
    </div>
  );
};

export default ExcelImportWidget;