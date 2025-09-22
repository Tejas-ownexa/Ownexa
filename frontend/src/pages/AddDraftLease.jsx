import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Info, X, Brain, FileText, Download, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/axios';

const AddDraftLease = () => {
  const navigate = useNavigate();
  
  // AI Lease Generator Form State - matching original LeaseGenerator.js
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
  const [generatedLease, setGeneratedLease] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Load templates on component mount
  React.useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await api.get('/api/ai-lease/templates');
      if (response.data.success) {
        setTemplates(response.data.templates);
        // Set default template if available
        if (response.data.templates.length > 0 && !selectedTemplate) {
          setSelectedTemplate(response.data.templates[0].filename);
        }
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleTemplateUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf')) {
      alert('Please upload a PDF file');
      return;
    }

    setIsUploadingTemplate(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/ai-lease/templates', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success('Template uploaded successfully!');
        loadTemplates(); // Reload templates
        setSelectedTemplate(response.data.filename);
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading template:', error);
      toast.error(error.response?.data?.error || 'Failed to upload template');
    } finally {
      setIsUploadingTemplate(false);
      e.target.value = ''; // Reset file input
    }
  };

  const generateAILease = async () => {
    setIsGenerating(true);
    try {
      // Prepare data for AI lease generation
      const leaseData = {
        // Core lease information
        leaseTerm: formData.leaseTerm,
        leaseStartDate: formData.leaseStartDate,
        leaseEndDate: formData.leaseEndDate,
        
        // Landlord information
        landlordFullName: formData.landlordFullName,
        landlordEmail: formData.landlordEmail,
        landlordPhone: formData.landlordPhone,
        
        // Tenant information
        tenantFullName: formData.tenantFullName,
        tenantEmail: formData.tenantEmail,
        tenantPhone: formData.tenantPhone,
        
        // Agent information
        agentName: formData.agentName,
        agentAddress: formData.agentAddress,
        
        // Property details
        streetAddress: formData.streetAddress,
        city: formData.city,
        zipCode: formData.zipCode,
        unitNumber: formData.unitNumber,
        includedFurniture: formData.includedFurniture,
        
        // Financials
        monthlyRent: formData.monthlyRent,
        rentDueDay: formData.rentDueDay,
        securityDeposit: formData.securityDeposit,
        lateFee: formData.lateFee,
        lateFeeGracePeriod: formData.lateFeeGracePeriod,
        
        // Policies
        petsPolicy: formData.petsPolicy,
        smokingPolicy: formData.smokingPolicy,
        earlyTerminationFee: formData.earlyTerminationFee,
        earlyTerminationAmount: formData.earlyTerminationAmount
      };

      console.log('🚀 Starting lease generation with data:', leaseData);
      console.log('🔗 API Base URL:', api.defaults.baseURL);
      console.log('🔑 Token present:', localStorage.getItem('token') ? 'Yes' : 'No');
      
      // Check if we have a valid token, if not, try without auth headers
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('⚠️ No token found, trying without authentication');
      }

      // Call the AI lease generation API using configured axios
      const response = await api.post('/api/ai-lease/generate-lease', leaseData);
      console.log('✅ API Response:', response.data);
      const result = response.data;

      if (result.success) {
        // Trigger download directly like the original
        const downloadResponse = await api.get(`/api/ai-lease/download/${result.filename}`, {
          responseType: 'blob'
        });

        // Create download link
        const blob = new Blob([downloadResponse.data], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);
        
        setGeneratedLease(`Lease PDF generated and downloaded successfully: ${result.filename}`);
      } else {
        throw new Error(result.error || 'Failed to generate lease');
      }
    } catch (error) {
      console.error('❌ Error generating lease:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      
      let errorMessage = 'Unknown error occurred';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Error generating lease: ${errorMessage}`);
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



  const handleSubmit = (e) => {
    e.preventDefault();
    generateAILease();
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6">
      {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          <div className="relative p-6 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Brain className="h-8 w-8 text-white" />
                  </div>
          <div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              AI Lease Generator
            </h1>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-blue-100 text-sm font-medium">Ready to generate</span>
                    </div>
                  </div>
                </div>
                <p className="text-blue-100 text-base sm:text-lg max-w-2xl">
                  Create professional, legally-compliant lease documents in seconds with our AI-powered generator
            </p>
          </div>
          <button
            onClick={() => navigate('/leasing?tab=draft-lease')}
                className="group bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2 border border-white/20 hover:border-white/30"
          >
                <X className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                <span className="font-medium">Back to Draft Leases</span>
          </button>
            </div>
        </div>
      </div>

        {/* Template Management Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-500 rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Template Management</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Template Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Select Template</label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-6 py-4 text-lg rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300"
              >
                <option value="">Select a template...</option>
                {templates.map((template) => (
                  <option key={template.filename} value={template.filename}>
                    {template.filename} ({new Date(template.uploaded_at).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
            
            {/* Template Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Upload New Template</label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleTemplateUpload}
                  disabled={isUploadingTemplate}
                  className="w-full px-6 py-4 text-lg rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-base file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                {isUploadingTemplate && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">Upload a PDF template with fillable form fields</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Lease Information</h2>
              <p className="text-gray-600">Fill in the details below to generate your lease document</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Basic Information Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Info className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Basic Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Landlord Name *</label>
                  <input
                    type="text" 
                    name="landlordFullName" 
                    value={formData.landlordFullName} 
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 text-lg rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 placeholder-gray-400" 
                    placeholder="Enter landlord's full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Tenant Name *</label>
                  <input
                    type="text" 
                    name="tenantFullName" 
                    value={formData.tenantFullName} 
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 text-lg rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 placeholder-gray-400" 
                    placeholder="Enter tenant's full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Landlord Email</label>
                    <input
                      type="email"
                      name="landlordEmail"
                      value={formData.landlordEmail}
                      onChange={handleInputChange}
                    className="w-full px-6 py-4 text-lg rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 placeholder-gray-400" 
                    placeholder="landlord@example.com"
                    />
                  </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Landlord Phone</label>
                    <input
                      type="tel"
                      name="landlordPhone"
                      value={formData.landlordPhone}
                      onChange={handleInputChange}
                    className="w-full px-6 py-4 text-lg rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 placeholder-gray-400" 
                    placeholder="(555) 123-4567"
                    />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Tenant Email</label>
                    <input
                      type="email"
                      name="tenantEmail"
                      value={formData.tenantEmail}
                      onChange={handleInputChange}
                    className="w-full px-6 py-4 text-lg rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 placeholder-gray-400" 
                    placeholder="tenant@example.com"
                    />
                  </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Tenant Phone</label>
                    <input
                      type="tel"
                      name="tenantPhone"
                      value={formData.tenantPhone}
                      onChange={handleInputChange}
                    className="w-full px-6 py-4 text-lg rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 placeholder-gray-400" 
                    placeholder="(555) 123-4567"
                    />
                </div>
              </div>
                  </div>

            {/* Property Information Section */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Property Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Street Address *</label>
                  <input
                    type="text"
                    name="streetAddress"
                    value={formData.streetAddress}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 placeholder-gray-400" 
                    placeholder="123 Main Street"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Unit Number</label>
                  <input 
                    type="text" 
                    name="unitNumber" 
                    value={formData.unitNumber} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 placeholder-gray-400" 
                    placeholder="Apt 2B"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 placeholder-gray-400" 
                    placeholder="New York"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">ZIP Code *</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 placeholder-gray-400" 
                    placeholder="10001"
                    required
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Included Furniture</label>
                  <input
                    type="text"
                    name="includedFurniture"
                    value={formData.includedFurniture}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 placeholder-gray-400" 
                    placeholder="e.g., None, Basic furniture, Fully furnished"
                  />
                </div>
              </div>
            </div>

            {/* Lease Terms Section */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Lease Terms</h3>
              </div>
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
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Save className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Fees and Policies</h3>
              </div>
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
                  <select name="petsPolicy" value={formData.petsPolicy} onChange={handleInputChange} className="w-full px-6 py-4 text-lg rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300">
                    <option value="not_allowed">Not Allowed</option>
                    <option value="allowed">Allowed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Smoking Policy</label>
                  <select name="smokingPolicy" value={formData.smokingPolicy} onChange={handleInputChange} className="w-full px-6 py-4 text-lg rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300">
                    <option value="not_permitted">Not Permitted</option>
                    <option value="permitted">Permitted</option>
                  </select>
                </div>
                </div>
              </div>

            {/* Early Termination Section */}
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-yellow-500 rounded-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Early Termination</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Early Termination Agreement</label>
                  <select name="earlyTerminationFee" value={formData.earlyTerminationFee} onChange={handleInputChange} className="w-full px-6 py-4 text-lg rounded-xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300">
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
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-teal-500 rounded-lg">
                  <Info className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Agent Information</h3>
              </div>
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

            <div className="text-center pt-6">
              <button
                type="submit"
                disabled={isGenerating}
                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center space-x-3">
                {isGenerating ? (
                  <>
                      <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
                      <span>Generating Lease...</span>
                  </>
                ) : (
                  <>
                      <Brain className="h-6 w-6 group-hover:animate-pulse" />
                      <span>Generate & Download Lease</span>
                      <Download className="h-5 w-5 group-hover:animate-bounce" />
                  </>
                )}
                </div>
              </button>
            </div>
          </form>
        </div>

          {/* Status Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Generation Status</h2>
          </div>
          
          {generatedLease ? (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 text-center border border-green-200">
                <div className="space-y-4">
                  <div className="relative">
                    <div className="w-20 h-20 bg-green-500 rounded-full mx-auto flex items-center justify-center animate-pulse">
                      <FileText className="h-10 w-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-green-800 mb-2">
                    Lease Generated Successfully!
                  </h3>
                  <p className="text-green-700 text-lg">
                {generatedLease}
                  </p>
                  <div className="mt-6">
                    <div className="inline-flex items-center px-4 py-2 bg-green-100 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                      <span className="text-green-800 font-medium">Ready for download</span>
                    </div>
                  </div>
                </div>
            </div>
          ) : (
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-8 text-center border border-gray-200">
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full mx-auto flex items-center justify-center">
                    <FileText className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Ready to Generate
                </h3>
                  <p className="text-gray-600 text-lg max-w-md mx-auto">
                    Fill out the form and click "Generate & Download Lease" to create your professional lease document.
                  </p>
                  <div className="mt-6">
                    <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
                      <span className="text-blue-800 font-medium">Waiting for input</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AddDraftLease;