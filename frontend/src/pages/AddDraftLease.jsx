import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Info, X, Brain, FileText, Download, Save } from 'lucide-react';

const AddDraftLease = () => {
  const navigate = useNavigate();
  
  // AI Lease Generator Form State
  const [formData, setFormData] = useState({
    // Core Lease Information
    leaseTerm: '',
    leaseStartDate: '',
    leaseEndDate: '',
    
    // Landlord Information
    landlordFullName: '',
    landlordEmail: '',
    landlordPhone: '',
    
    // Tenant Information
    tenantFullName: '',
    tenantEmail: '',
    tenantPhone: '',
    
    // Agent Information (Optional)
    agentName: '',
    agentAddress: '',
    
    // Property Details
    streetAddress: '',
    city: '',
    zipCode: '',
    unitNumber: '',
    includedFurniture: '',
    
    // Financials
    monthlyRent: '',
    rentDueDay: 1,
    securityDeposit: '',
    lateFee: '',
    lateFeeGracePeriod: 3,
    
    // Rules & Responsibilities
    utilitiesLandlord: {
      water: false,
      gas: false,
      electricity: false,
      garbageRemoval: false
    },
    petsPolicy: 'not-allowed',
    smokingPolicy: 'not-permitted',
    
    // Addenda
    earlyTerminationFee: 'does-not-agree',
    earlyTerminationAmount: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLease, setGeneratedLease] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle nested utilities object
    if (name.startsWith('utilities.')) {
      const utilityName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        utilitiesLandlord: {
          ...prev.utilitiesLandlord,
          [utilityName]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleUtilityChange = (utilityName, checked) => {
    setFormData(prev => ({
      ...prev,
      utilitiesLandlord: {
        ...prev.utilitiesLandlord,
        [utilityName]: checked
      }
    }));
  };

  const generateAILease = async () => {
    setIsGenerating(true);
    try {
      // Simulate AI generation (replace with actual AI API call)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const leaseContent = `
RESIDENTIAL LEASE AGREEMENT

This lease agreement is entered into on ${new Date().toLocaleDateString()} between:

LANDLORD: ${formData.landlordFullName}
Email: ${formData.landlordEmail}
Phone: ${formData.landlordPhone}

TENANT: ${formData.tenantFullName}
Email: ${formData.tenantEmail}
Phone: ${formData.tenantPhone}

PROPERTY ADDRESS: ${formData.streetAddress}${formData.unitNumber ? `, Unit ${formData.unitNumber}` : ''}, ${formData.city}, ${formData.zipCode}

LEASE TERMS:
- Lease Term: ${formData.leaseTerm} months
- Start Date: ${formData.leaseStartDate}
- End Date: ${formData.leaseEndDate}
- Monthly Rent: $${formData.monthlyRent}
- Rent Due: ${formData.rentDueDay}${getOrdinalSuffix(formData.rentDueDay)} of each month
- Security Deposit: $${formData.securityDeposit}
- Late Fee: $${formData.lateFee} after ${formData.lateFeeGracePeriod} days grace period

UTILITIES:
${Object.entries(formData.utilitiesLandlord)
  .filter(([_, included]) => included)
  .map(([utility, _]) => `- ${utility.charAt(0).toUpperCase() + utility.slice(1).replace(/([A-Z])/g, ' $1')}: Paid by Landlord`)
  .join('\n')}

POLICIES:
- Pets: ${formData.petsPolicy === 'allowed' ? 'Allowed' : 'Not Allowed'}
- Smoking: ${formData.smokingPolicy === 'permitted' ? 'Permitted' : 'Not Permitted'}

${formData.includedFurniture ? `INCLUDED ITEMS: ${formData.includedFurniture}` : ''}

${formData.earlyTerminationFee === 'agrees' ? `EARLY TERMINATION: Fee of $${formData.earlyTerminationAmount} applies` : ''}

[Additional standard lease clauses would be generated here by AI...]
      `;
      
      setGeneratedLease(leaseContent);
    } catch (error) {
      console.error('Error generating lease:', error);
      alert('Error generating lease. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const downloadLease = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedLease], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `lease_${formData.tenantFullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate required fields
    const requiredFields = [
      'leaseTerm', 'leaseStartDate', 'leaseEndDate',
      'landlordFullName', 'tenantFullName',
      'streetAddress', 'city', 'zipCode',
      'monthlyRent', 'securityDeposit'
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    generateAILease();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl shadow-xl p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center">
              <Brain className="h-8 w-8 mr-3" />
              AI Lease Generator
            </h1>
            <p className="text-blue-100 text-sm sm:text-base">
              Create professional lease agreements with AI assistance
            </p>
          </div>
          <button
            onClick={() => navigate('/leasing?tab=draft-lease')}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <X className="h-4 w-4" />
            <span>Back to Draft Leases</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Core Lease Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Core Lease Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lease Term (in months) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="leaseTerm"
                    value={formData.leaseTerm}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="12"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lease Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="leaseStartDate"
                    value={formData.leaseStartDate}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lease End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="leaseEndDate"
                    value={formData.leaseEndDate}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 2. Parties */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Parties</h2>
              
              {/* Landlord Information */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Landlord Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Landlord Full Name(s) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="landlordFullName"
                      value={formData.landlordFullName}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Landlord Email
                    </label>
                    <input
                      type="email"
                      name="landlordEmail"
                      value={formData.landlordEmail}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Landlord Phone
                    </label>
                    <input
                      type="tel"
                      name="landlordPhone"
                      value={formData.landlordPhone}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Tenant Information */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Tenant Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tenant Full Name(s) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="tenantFullName"
                      value={formData.tenantFullName}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tenant Email
                    </label>
                    <input
                      type="email"
                      name="tenantEmail"
                      value={formData.tenantEmail}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tenant Phone
                    </label>
                    <input
                      type="tel"
                      name="tenantPhone"
                      value={formData.tenantPhone}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Agent Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">Landlord's Agent (Optional)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Agent Name
                    </label>
                    <input
                      type="text"
                      name="agentName"
                      value={formData.agentName}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Agent Address
                    </label>
                    <input
                      type="text"
                      name="agentAddress"
                      value={formData.agentAddress}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Property Details */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Property Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="streetAddress"
                    value={formData.streetAddress}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zip Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apt/Unit #
                  </label>
                  <input
                    type="text"
                    name="unitNumber"
                    value={formData.unitNumber}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Included Furniture & Appliances
                  </label>
                  <textarea
                    name="includedFurniture"
                    value={formData.includedFurniture}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="List any included furniture, appliances, or fixtures..."
                  />
                </div>
              </div>
            </div>

            {/* 4. Financials */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Financials</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Rent ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="monthlyRent"
                    value={formData.monthlyRent}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rent Due Day of Month
                  </label>
                  <input
                    type="number"
                    name="rentDueDay"
                    value={formData.rentDueDay}
                    onChange={handleInputChange}
                    min="1"
                    max="31"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Security Deposit ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="securityDeposit"
                    value={formData.securityDeposit}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Late Fee ($)
                  </label>
                  <input
                    type="number"
                    name="lateFee"
                    value={formData.lateFee}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Late Fee Grace Period (Days)
                  </label>
                  <input
                    type="number"
                    name="lateFeeGracePeriod"
                    value={formData.lateFeeGracePeriod}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* 5. Rules & Responsibilities */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Rules & Responsibilities</h2>
              
              {/* Utilities */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Utilities Paid by Landlord
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(formData.utilitiesLandlord).map(([utility, checked]) => (
                    <label key={utility} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => handleUtilityChange(utility, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {utility.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Pets Policy */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Pets Policy
                </label>
                <div className="flex space-x-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="petsPolicy"
                      value="allowed"
                      checked={formData.petsPolicy === 'allowed'}
                      onChange={handleInputChange}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Allowed</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="petsPolicy"
                      value="not-allowed"
                      checked={formData.petsPolicy === 'not-allowed'}
                      onChange={handleInputChange}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Not Allowed</span>
                  </label>
                </div>
              </div>

              {/* Smoking Policy */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Smoking Policy
                </label>
                <div className="flex space-x-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="smokingPolicy"
                      value="permitted"
                      checked={formData.smokingPolicy === 'permitted'}
                      onChange={handleInputChange}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Permitted</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="smokingPolicy"
                      value="not-permitted"
                      checked={formData.smokingPolicy === 'not-permitted'}
                      onChange={handleInputChange}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Not Permitted</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 6. Addenda */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Addenda</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Early Termination Addendum
                </label>
                <div className="space-y-3">
                  <div className="flex space-x-6">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="earlyTerminationFee"
                        value="agrees"
                        checked={formData.earlyTerminationFee === 'agrees'}
                        onChange={handleInputChange}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Tenant Agrees to Fee</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="earlyTerminationFee"
                        value="does-not-agree"
                        checked={formData.earlyTerminationFee === 'does-not-agree'}
                        onChange={handleInputChange}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Tenant Does Not Agree</span>
                    </label>
                  </div>
                  
                  {formData.earlyTerminationFee === 'agrees' && (
                    <div className="ml-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Early Termination Fee Amount ($)
                      </label>
                      <input
                        type="number"
                        name="earlyTerminationAmount"
                        value={formData.earlyTerminationAmount}
                        onChange={handleInputChange}
                        className="w-full sm:w-48 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="1000"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Generating AI Lease...</span>
                  </>
                ) : (
                  <>
                    <Brain className="h-5 w-5" />
                    <span>Generate AI Lease</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Generated Lease Preview */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FileText className="h-6 w-6 mr-2" />
              Generated Lease Preview
            </h2>
            {generatedLease && (
              <button
                onClick={downloadLease}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
            )}
          </div>
          
          {generatedLease ? (
            <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                {generatedLease}
              </pre>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 h-96 flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Lease Generated Yet
                </h3>
                <p className="text-gray-600">
                  Fill out the form and click "Generate AI Lease" to create your lease agreement.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddDraftLease;