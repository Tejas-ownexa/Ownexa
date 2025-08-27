import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PDFUploader from '../components/PDFUploader';
import axios from '../utils/axios';

const PDFProcessing = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/pdf/submissions');
      setSubmissions(response.data.submissions || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setError('Failed to load PDF submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (result) => {
    setSuccess(`PDF processed successfully! Confidence: ${(result.confidence_score * 100).toFixed(1)}%`);
    setShowUploader(false);
    fetchSubmissions(); // Refresh the list
    
    // Clear success message after 5 seconds
    setTimeout(() => setSuccess(''), 5000);
  };

  const handleUploadError = (errorMessage) => {
    setError(errorMessage);
    // Clear error message after 5 seconds
    setTimeout(() => setError(''), 5000);
  };

  const handleImportData = async (submissionId) => {
    try {
      const response = await axios.post(`/pdf/submissions/${submissionId}/import`);
      if (response.data.success) {
        setSuccess('Data imported successfully!');
        fetchSubmissions();
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to import data';
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'uploaded': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'processed': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'imported': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">PDF Form Processing</h1>
          <p className="text-gray-600 mt-2">
            Upload and process PDF forms to automatically extract tenant and property information
          </p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Upload New PDF</h2>
              <button
                onClick={() => setShowUploader(!showUploader)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showUploader ? 'Hide Uploader' : 'Upload PDF'}
              </button>
            </div>
          </div>
          
          {showUploader && (
            <div className="p-6">
              <PDFUploader
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
              />
            </div>
          )}
        </div>

        {/* Submissions List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Submissions</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-600 mt-4">No PDF submissions yet</p>
              <p className="text-gray-400 text-sm">Upload your first PDF form to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Form Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confidence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Upload Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <svg
                            className="h-8 w-8 text-red-600 mr-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {submission.original_filename}
                            </div>
                            <div className="text-sm text-gray-500">
                              {(submission.file_size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 capitalize">
                          {submission.form_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(submission.status)}`}>
                          {submission.status}
                        </span>
                        {submission.manual_review_required && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            Review Required
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {submission.confidence_score !== null 
                          ? `${(submission.confidence_score * 100).toFixed(1)}%`
                          : 'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(submission.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => setSelectedSubmission(submission)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                        {submission.status === 'processed' && (
                          <button
                            onClick={() => handleImportData(submission.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Import Data
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Submission Details Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Submission Details: {selectedSubmission.original_filename}
                  </h3>
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Metadata */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Metadata</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p><span className="font-medium">Status:</span> {selectedSubmission.status}</p>
                      <p><span className="font-medium">Form Type:</span> {selectedSubmission.form_type}</p>
                      <p><span className="font-medium">Confidence:</span> {selectedSubmission.confidence_score ? `${(selectedSubmission.confidence_score * 100).toFixed(1)}%` : 'N/A'}</p>
                      <p><span className="font-medium">File Size:</span> {(selectedSubmission.file_size / 1024).toFixed(1)} KB</p>
                      <p><span className="font-medium">Upload Date:</span> {formatDate(selectedSubmission.created_at)}</p>
                    </div>
                  </div>
                  
                  {/* Extracted Data */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Extracted Data</h4>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(selectedSubmission.validated_data || {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  {selectedSubmission.status === 'processed' && (
                    <button
                      onClick={() => {
                        handleImportData(selectedSubmission.id);
                        setSelectedSubmission(null);
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      Import Data
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFProcessing;
