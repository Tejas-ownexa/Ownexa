import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from '../utils/axios';

const PDFUploader = ({ onUploadSuccess, onUploadError }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [formType, setFormType] = useState('auto');
  const [autoImport, setAutoImport] = useState(true);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes('pdf')) {
      onUploadError?.('Please select a PDF file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      onUploadError?.('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setProcessingStep('Uploading file...');

    try {
      const formData = new FormData();
      formData.append('pdf_file', file);
      formData.append('form_type', formType === 'auto' ? '' : formType);
      formData.append('auto_import', autoImport.toString());

      const response = await axios.post('/pdf/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
          
          if (percentCompleted === 100) {
            setProcessingStep('Processing PDF...');
          }
        },
      });

      if (response.data.success) {
        setProcessingStep('Complete!');
        onUploadSuccess?.(response.data);
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Upload failed';
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setProcessingStep('');
    }
  }, [formType, autoImport, onUploadSuccess, onUploadError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: uploading
  });

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Form Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Form Type
        </label>
        <select
          value={formType}
          onChange={(e) => setFormType(e.target.value)}
          disabled={uploading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="auto">Auto-detect</option>
          <option value="condo_apt">Condo/Apartment Form</option>
          <option value="single_family">Single Family/Duplex Form</option>
          <option value="lease">Lease Agreement</option>
          <option value="application">Rental Application</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Auto Import Option */}
      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={autoImport}
            onChange={(e) => setAutoImport(e.target.checked)}
            disabled={uploading}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">
            Automatically import data if confidence is high (≥80%)
          </span>
        </label>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : uploading 
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }
        `}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            
            {/* Progress Text */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                {processingStep}
              </p>
              <p className="text-xs text-gray-500">
                {uploadProgress < 100 
                  ? `Uploading: ${uploadProgress}%` 
                  : 'Processing your PDF form...'}
              </p>
            </div>
            
            {/* Loading Spinner */}
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Upload Icon */}
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            
            {/* Upload Text */}
            <div>
              <p className="text-lg font-medium text-gray-700">
                {isDragActive ? 'Drop your PDF here' : 'Upload PDF Form'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Drag and drop a PDF file here, or click to select
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Supported: PDF files up to 10MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-6 text-sm text-gray-600">
        <h4 className="font-medium mb-2">Supported Forms:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Rental applications</li>
          <li>Lease agreements</li>
          <li>Property information forms</li>
          <li>Tenant information forms</li>
        </ul>
        <p className="mt-3 text-xs text-gray-500">
          The system will automatically extract information from filled PDF forms and populate your database.
        </p>
      </div>
    </div>
  );
};

export default PDFUploader;
