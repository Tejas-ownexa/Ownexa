import React, { useState } from 'react';
import axios from 'axios';

// Set a base URL for your API
const API_URL = 'http://127.0.0.1:5001/api';

const LeaseGenerator = () => {
  const [formData, setFormData] = useState({
    leaseTerm: '',
    leaseStartDate: '',
    leaseEndDate: '',
    landlordFullName: '',
    tenantFullName: '',
    landlordEmail: '',
    landlordPhone: '',
    tenantEmail: '',
    tenantPhone: '',
    streetAddress: '',
    unitNumber: '',
    city: '',
    zipCode: '',
    includedFurniture: '',
    monthlyRent: '',
    rentDueDay: '',
    securityDeposit: '',
    lateFee: '',
    lateFeeGracePeriod: '',
    petsPolicy: 'not_allowed',
    smokingPolicy: 'not_permitted',
    earlyTerminationFee: 'disagrees',
    earlyTerminationAmount: '',
    agentName: '',
    agentAddress: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/generate-filled`, formData);
      
      // Trigger download
      const downloadResponse = await axios.get(`${API_URL}/download/${response.data.filename}`, {
        responseType: 'blob',
      });

      const blob = new Blob([downloadResponse.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = response.data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);

    } catch (err) {
      setError('Failed to generate lease. Please check the backend server.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8 bg-gray-50">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">AI Lease Generator</h1>
      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-lg shadow-md">
        
        {/* Basic Information Section */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Landlord Name *</label>
              <input type="text" name="landlordFullName" value={formData.landlordFullName} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tenant Name *</label>
              <input type="text" name="tenantFullName" value={formData.tenantFullName} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Landlord Email</label>
              <input type="email" name="landlordEmail" value={formData.landlordEmail} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Landlord Phone</label>
              <input type="tel" name="landlordPhone" value={formData.landlordPhone} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tenant Email</label>
              <input type="email" name="tenantEmail" value={formData.tenantEmail} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tenant Phone</label>
              <input type="tel" name="tenantPhone" value={formData.tenantPhone} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"/>
            </div>
          </div>
        </div>

        {/* Property Information Section */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Property Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Street Address *</label>
              <input type="text" name="streetAddress" value={formData.streetAddress} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit Number</label>
              <input type="text" name="unitNumber" value={formData.unitNumber} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">City *</label>
              <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ZIP Code *</label>
              <input type="text" name="zipCode" value={formData.zipCode} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required/>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Included Furniture</label>
              <input type="text" name="includedFurniture" value={formData.includedFurniture} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="e.g., None, Basic furniture, Fully furnished"/>
            </div>
          </div>
        </div>

        {/* Lease Terms Section */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Lease Terms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Lease Term (months) *</label>
              <input type="number" name="leaseTerm" value={formData.leaseTerm} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Monthly Rent ($) *</label>
              <input type="number" name="monthlyRent" value={formData.monthlyRent} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Lease Start Date *</label>
              <input type="date" name="leaseStartDate" value={formData.leaseStartDate} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Lease End Date *</label>
              <input type="date" name="leaseEndDate" value={formData.leaseEndDate} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rent Due Day *</label>
              <input type="number" name="rentDueDay" value={formData.rentDueDay} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" min="1" max="31" required/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Security Deposit ($)</label>
              <input type="number" name="securityDeposit" value={formData.securityDeposit} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"/>
            </div>
          </div>
        </div>

        {/* Fees and Policies Section */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Fees and Policies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Late Fee ($)</label>
              <input type="number" name="lateFee" value={formData.lateFee} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Late Fee Grace Period (days)</label>
              <input type="number" name="lateFeeGracePeriod" value={formData.lateFeeGracePeriod} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Pets Policy</label>
              <select name="petsPolicy" value={formData.petsPolicy} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <option value="not_allowed">Not Allowed</option>
                <option value="allowed">Allowed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Smoking Policy</label>
              <select name="smokingPolicy" value={formData.smokingPolicy} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <option value="not_permitted">Not Permitted</option>
                <option value="permitted">Permitted</option>
              </select>
            </div>
          </div>
        </div>

        {/* Early Termination Section */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Early Termination</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Early Termination Agreement</label>
              <select name="earlyTerminationFee" value={formData.earlyTerminationFee} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <option value="disagrees">Does Not Agree</option>
                <option value="agrees">Agrees</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Early Termination Amount ($)</label>
              <input type="number" name="earlyTerminationAmount" value={formData.earlyTerminationAmount} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"/>
            </div>
          </div>
        </div>

        {/* Agent Information Section */}
        <div className="pb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Agent Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Agent Name</label>
              <input type="text" name="agentName" value={formData.agentName} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Agent Address/Email</label>
              <input type="text" name="agentAddress" value={formData.agentAddress} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"/>
            </div>
          </div>
        </div>
        
        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        <div className="text-center">
          <button type="submit" disabled={isGenerating} className="inline-flex justify-center py-3 px-8 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
            {isGenerating ? 'Generating...' : 'Generate & Download Lease'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaseGenerator;
