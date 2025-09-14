import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { ChevronDown, Phone, Mail, Home } from 'lucide-react';
import api from '../utils/axios';

const AddVendor = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    rentalOwnerId: '',
    category: '', // Will store category ID
    primaryEmail: '',
    phone1: '',
    streetAddress: '',
    city: '',
    state: '',
    zip: '',
    comments: ''
  });

  // Fetch rental owners for company selection
  const { data: rentalOwnersData, isLoading: loadingRentalOwners, error: rentalOwnersError } = useQuery(
    'rental-owners',
    async () => {
      console.log('🚀 Starting rental owners API call...');
      console.log('🔑 Token in localStorage:', localStorage.getItem('token'));
      
      try {
        const response = await api.get('/api/rental-owners');
        console.log('✅ Rental owners API response:', response.data);
        console.log('📊 Response status:', response.status);
        return response.data;
      } catch (error) {
        console.error('💥 Error fetching rental owners:', error);
        console.error('📄 Error response:', error.response?.data);
        console.error('🔢 Error status:', error.response?.status);
        console.error('📝 Error message:', error.message);
        throw error;
      }
    },
    { 
      retry: 1,
      onError: (error) => {
        console.error('🚨 useQuery onError:', error);
        console.error('📄 Error details:', error.response?.data);
      }
    }
  );

  const rentalOwners = Array.isArray(rentalOwnersData?.rental_owners) 
    ? rentalOwnersData.rental_owners 
    : Array.isArray(rentalOwnersData) 
      ? rentalOwnersData 
      : [];

  // Debug logging
  console.log('rentalOwnersData:', rentalOwnersData);
  console.log('rentalOwners (processed):', rentalOwners);
  console.log('rentalOwners type:', typeof rentalOwners);
  console.log('rentalOwners isArray:', Array.isArray(rentalOwners));
  console.log('loadingRentalOwners:', loadingRentalOwners);
  console.log('rentalOwnersError:', rentalOwnersError);

  // Fetch vendor categories
  const { data: vendorCategoriesData, isLoading: loadingCategories, error: categoriesError } = useQuery(
    'vendor-categories',
    async () => {
      try {
        const response = await api.get('/api/vendors/categories');
        return response.data;
      } catch (error) {
        console.error('Error fetching vendor categories:', error);
        throw error;
      }
    },
    { 
      retry: 1
    }
  );

  const vendorCategories = Array.isArray(vendorCategoriesData) 
    ? vendorCategoriesData 
    : [];

  // Create vendor mutation
  const createVendorMutation = useMutation(
    async (vendorData) => {
      const response = await api.post('/api/vendors', vendorData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        console.log('Vendor created successfully:', data);
        queryClient.invalidateQueries('vendors');
        // Navigate back to vendors list
        navigate('/maintenance/vendors');
      },
      onError: (error) => {
        console.error('Error creating vendor:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        console.error('Error message:', error.message);
        
        // Show more specific error message
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
        alert(`Failed to create vendor: ${errorMessage}`);
      }
    }
  );

  const handleInputChange = (field, value) => {
    // If rental owner is selected, automatically populate company name
    if (field === 'rentalOwnerId' && value) {
      const selectedOwner = rentalOwners.find(owner => owner.id.toString() === value);
      setFormData(prev => ({
        ...prev,
        [field]: value,
        companyName: selectedOwner ? selectedOwner.company_name : '',
        isCompany: true
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prepare vendor data for API
    const vendorData = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      company_name: formData.companyName,
      is_company: true, // Since we're selecting a rental owner company
      category_id: formData.category || null, // Send category ID or null
      primary_email: formData.primaryEmail,
      phone_1: formData.phone1,
      street_address: formData.streetAddress,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zip,
      comments: formData.comments,
      rental_owner_id: formData.rentalOwnerId
    };

    console.log('Submitting vendor data:', vendorData);
    createVendorMutation.mutate(vendorData);
  };

  const handleCancel = () => {
    navigate('/maintenance/vendors');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add vendor</h1>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Name Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NAME (REQUIRED)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="First"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Last"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Rental Owner Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RENTAL OWNER COMPANY
                </label>
                {loadingRentalOwners ? (
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
                    Loading rental owners...
                  </div>
                ) : rentalOwnersError ? (
                  <div className="px-3 py-2 border border-red-300 rounded-md bg-red-50 text-red-600">
                    Failed to load rental owners
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={formData.rentalOwnerId}
                      onChange={(e) => handleInputChange('rentalOwnerId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                      required
                    >
                      <option value="">Select Rental Owner Company...</option>
                      {rentalOwners.map((owner) => (
                        <option key={owner.id} value={owner.id}>
                          {owner.company_name} ({owner.property_count || owner.properties?.length || 0} properties)
                        </option>
                      ))}
                    </select>
                    
                    {/* Show selected company name */}
                    {formData.companyName && (
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                        <span className="text-sm text-blue-700">
                          Selected: <strong>{formData.companyName}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CATEGORY
                </label>
                {loadingCategories ? (
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
                    Loading categories...
                  </div>
                ) : categoriesError ? (
                  <div className="px-3 py-2 border border-red-300 rounded-md bg-red-50 text-red-600">
                    Failed to load categories
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    >
                      <option value="">Select Category...</option>
                      {vendorCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Primary Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PRIMARY EMAIL
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.primaryEmail}
                    onChange={(e) => handleInputChange('primaryEmail', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PHONE NUMBER
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone1}
                    onChange={(e) => handleInputChange('phone1', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Address Information</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Address */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    STREET ADDRESS
                  </label>
                  <div className="relative">
                    <Home className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <textarea
                      value={formData.streetAddress}
                      onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                      rows={2}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>

                {/* City, State, ZIP */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CITY
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      STATE
                    </label>
                    <div className="relative">
                      <select
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                      >
                        <option value="">Select...</option>
                        <option value="CA">California</option>
                        <option value="NY">New York</option>
                        <option value="TX">Texas</option>
                        <option value="FL">Florida</option>
                        <option value="IL">Illinois</option>
                        <option value="PA">Pennsylvania</option>
                        <option value="OH">Ohio</option>
                        <option value="GA">Georgia</option>
                        <option value="NC">North Carolina</option>
                        <option value="MI">Michigan</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP
                    </label>
                    <input
                      type="text"
                      value={formData.zip}
                      onChange={(e) => handleInputChange('zip', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Comments */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    COMMENTS
                  </label>
                  <textarea
                    value={formData.comments}
                    onChange={(e) => handleInputChange('comments', e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Additional notes about this vendor..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
            <button
              type="submit"
              disabled={createVendorMutation.isLoading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createVendorMutation.isLoading ? 'Creating...' : 'Create vendor'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={createVendorMutation.isLoading}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVendor;
