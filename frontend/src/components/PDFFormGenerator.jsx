import React, { useState } from 'react';
import SignaturePad from './SignaturePad';
import axios from '../utils/axios';

const PDFFormGenerator = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    property_address: '',
    unit_number: '',
    city: '',
    state: '',
    zip_code: '',
    property_type: '',
    rent_amount: '',
    security_deposit: '',
    lease_start: '',
    lease_end: '',
    move_in_date: '',
    emergency_contact: '',
    employment_info: '',
    monthly_income: '',
    pets: '',
    additional_notes: ''
  });

  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [formType, setFormType] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['full_name', 'email', 'property_address'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      setError(`Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Show signature pad
    setShowSignature(true);
    setError('');
  };

  const handleSignatureComplete = async (signatureData) => {
    setLoading(true);
    setError('');
    
    try {
      const payload = {
        ...formData,
        signature: signatureData,
        save_to_database: true
      };

      const response = await axios.post('/pdf-generation/generate', payload);
      
      if (response.data.success) {
        setSuccess(`PDF generated successfully! Form type: ${response.data.form_type}`);
        setDownloadUrl(`http://127.0.0.1:5001${response.data.download_url}`);
        setFormType(response.data.form_type);
        setShowSignature(false);
      } else {
        throw new Error(response.data.error || 'PDF generation failed');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      setError(error.response?.data?.error || error.message || 'Failed to generate PDF');
      setShowSignature(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone_number: '',
      property_address: '',
      unit_number: '',
      city: '',
      state: '',
      zip_code: '',
      property_type: '',
      rent_amount: '',
      security_deposit: '',
      lease_start: '',
      lease_end: '',
      move_in_date: '',
      emergency_contact: '',
      employment_info: '',
      monthly_income: '',
      pets: '',
      additional_notes: ''
    });
    setSignature('');
    setDownloadUrl('');
    setFormType('');
    setError('');
    setSuccess('');
    setShowSignature(false);
  };

  if (showSignature) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <h3 className="text-lg font-bold mb-4">🖊️ Electronic Signature Required</h3>
          <p className="text-gray-600 mb-4">
            Please sign below to complete your rental application. This will automatically be added to your PDF.
          </p>
          <SignaturePad
            onSignatureComplete={handleSignatureComplete}
            onCancel={() => setShowSignature(false)}
            loading={loading}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🏠 Rental Application Form</h2>
        <p className="text-gray-600">Fill out this form to generate your rental application PDF with e-signature</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <strong>Success:</strong> {success}
          {downloadUrl && (
            <div className="mt-2">
              <button
                onClick={handleDownload}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2"
              >
                📄 Download PDF
              </button>
              <button
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                🔄 Start New Application
              </button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">👤 Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your.email@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income</label>
              <input
                type="number"
                name="monthly_income"
                value={formData.monthly_income}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="5000"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Property Information */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">🏡 Property Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="property_address"
                value={formData.property_address}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123 Main Street, Apt 4B or 456 Oak Avenue"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
              <select
                name="property_type"
                value={formData.property_type}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select property type</option>
                <option value="apartment">Apartment</option>
                <option value="condo">Condominium</option>
                <option value="single family">Single Family House</option>
                <option value="duplex">Duplex</option>
                <option value="townhouse">Townhouse</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number</label>
              <input
                type="text"
                name="unit_number"
                value={formData.unit_number}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="4B, 12, etc. (if applicable)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent</label>
              <input
                type="number"
                name="rent_amount"
                value={formData.rent_amount}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1200.00"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit</label>
              <input
                type="number"
                name="security_deposit"
                value={formData.security_deposit}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1200.00"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Lease Information */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">📅 Lease Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lease Start Date</label>
              <input
                type="date"
                name="lease_start"
                value={formData.lease_start}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lease End Date</label>
              <input
                type="date"
                name="lease_end"
                value={formData.lease_end}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Move-in Date</label>
              <input
                type="date"
                name="move_in_date"
                value={formData.move_in_date}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">ℹ️ Additional Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
              <input
                type="text"
                name="emergency_contact"
                value={formData.emergency_contact}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Name and phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employment Information</label>
              <input
                type="text"
                name="employment_info"
                value={formData.employment_info}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Company name and position"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pets</label>
              <input
                type="text"
                name="pets"
                value={formData.pets}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Type and number of pets, or 'None'"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
              <textarea
                name="additional_notes"
                value={formData.additional_notes}
                onChange={handleInputChange}
                rows="3"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any additional information or special requests"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
          >
            {loading ? '⏳ Processing...' : '✍️ Continue to Signature'}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>🔒 Your information is secure and will be processed confidentially</p>
        <p>The system will automatically select the appropriate PDF template based on your property type</p>
      </div>
    </div>
  );
};

export default PDFFormGenerator;