import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../utils/axios';

const AddVendorModal = ({ isOpen, onClose, onVendorAdded }) => {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    is_company: false,
    category_id: '',
    expense_account: '',
    account_number: '',
    primary_email: '',
    alternate_email: '',
    phone_1: '',
    phone_2: '',
    phone_3: '',
    phone_4: '',
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'United States',
    website: 'http://',
    comments: '',
    tax_id_type: '',
    taxpayer_id: '',
    use_different_name: false,
    use_different_address: false,
    insurance_provider: '',
    policy_number: '',
    insurance_expiration_date: '',
    rental_owner_id: ''
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
        console.log('📋 Response headers:', response.headers);
        
        // Check if response has error
        if (response.data && response.data.error) {
          console.error('❌ API returned error:', response.data.error);
          throw new Error(response.data.error);
        }
        
        console.log('🎉 API call successful, returning data');
        return response.data;
      } catch (error) {
        console.error('💥 API call failed:', error);
        console.error('📄 Error response:', error.response?.data);
        console.error('🔢 Error status:', error.response?.status);
        console.error('📝 Error message:', error.message);
        throw error;
      }
    },
    { 
      enabled: isOpen,
      retry: 1,
      onError: (error) => {
        console.error('🚨 useQuery onError:', error);
        console.error('📄 Error details:', error.response?.data);
      }
    }
  );

  // Safely extract rental owners array
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
      enabled: isOpen,
      retry: 1
    }
  );

  const vendorCategories = Array.isArray(vendorCategoriesData?.categories) 
    ? vendorCategoriesData.categories 
    : Array.isArray(vendorCategoriesData) 
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
        queryClient.invalidateQueries('vendors');
        onVendorAdded && onVendorAdded(data);
        onClose();
        // Reset form
        setFormData({
          first_name: '',
          last_name: '',
          company_name: '',
          is_company: false,
          category_id: '',
          expense_account: '',
          account_number: '',
          primary_email: '',
          alternate_email: '',
          phone_1: '',
          phone_2: '',
          phone_3: '',
          phone_4: '',
          street_address: '',
          city: '',
          state: '',
          zip_code: '',
          country: 'United States',
          website: 'http://',
          comments: '',
          tax_id_type: '',
          taxpayer_id: '',
          use_different_name: false,
          use_different_address: false,
          insurance_provider: '',
          policy_number: '',
          insurance_expiration_date: '',
          rental_owner_id: ''
        });
      },
      onError: (error) => {
        console.error('Error creating vendor:', error);
      }
    }
  );

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // If rental owner is selected, automatically populate company_name
    if (name === 'rental_owner_id' && value) {
      const selectedOwner = rentalOwners.find(owner => owner.id.toString() === value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        company_name: selectedOwner ? selectedOwner.company_name : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prepare vendor data - company_name is already set by handleInputChange
    const vendorData = {
      ...formData,
      is_company: true // Since we're selecting a rental owner company
    };

    createVendorMutation.mutate(vendorData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add Vendor</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vendor Identification & Financials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NAME (REQUIRED)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  placeholder="First"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  placeholder="Last"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

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
                <select
                  name="rental_owner_id"
                  value={formData.rental_owner_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Rental Owner Company...</option>
                  {rentalOwners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.company_name} ({owner.property_count || owner.properties?.length || 0} properties)
                    </option>
                  ))}
                </select>
              )}
              
              {/* Show selected company name */}
              {formData.company_name && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <span className="text-sm text-blue-700">
                    Selected: <strong>{formData.company_name}</strong>
                  </span>
                </div>
              )}
              
              {/* Hidden field to store company_name for backend */}
              <input
                type="hidden"
                name="company_name"
                value={formData.company_name}
              />
            </div>

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
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Uncategorized</option>
                  {vendorCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                EXPENSE ACCOUNT
              </label>
              <select
                name="expense_account"
                value={formData.expense_account}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Please select</option>
                <option value="maintenance">Maintenance</option>
                <option value="repairs">Repairs</option>
                <option value="utilities">Utilities</option>
                <option value="insurance">Insurance</option>
                <option value="legal">Legal</option>
                <option value="marketing">Marketing</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ACCOUNT NUMBER
              </label>
              <input
                type="text"
                name="account_number"
                value={formData.account_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PRIMARY EMAIL
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400">✉</span>
                <input
                  type="email"
                  name="primary_email"
                  value={formData.primary_email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ALTERNATE EMAIL
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400">✉</span>
                <input
                  type="email"
                  name="alternate_email"
                  value={formData.alternate_email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PHONE NUMBERS
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">📞</span>
                  <input
                    type="tel"
                    name="phone_1"
                    value={formData.phone_1}
                    onChange={handleInputChange}
                    placeholder="Phone number"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">📞</span>
                  <input
                    type="tel"
                    name="phone_2"
                    value={formData.phone_2}
                    onChange={handleInputChange}
                    placeholder="Phone number"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">📞</span>
                  <input
                    type="tel"
                    name="phone_3"
                    value={formData.phone_3}
                    onChange={handleInputChange}
                    placeholder="Phone number"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">📞</span>
                  <input
                    type="tel"
                    name="phone_4"
                    value={formData.phone_4}
                    onChange={handleInputChange}
                    placeholder="Phone number"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address & Website */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                STREET ADDRESS
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400">🏠</span>
                <input
                  type="text"
                  name="street_address"
                  value={formData.street_address}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CITY
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                STATE
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                <option value="AL">Alabama</option>
                <option value="AK">Alaska</option>
                <option value="AZ">Arizona</option>
                <option value="AR">Arkansas</option>
                <option value="CA">California</option>
                <option value="CO">Colorado</option>
                <option value="CT">Connecticut</option>
                <option value="DE">Delaware</option>
                <option value="FL">Florida</option>
                <option value="GA">Georgia</option>
                <option value="HI">Hawaii</option>
                <option value="ID">Idaho</option>
                <option value="IL">Illinois</option>
                <option value="IN">Indiana</option>
                <option value="IA">Iowa</option>
                <option value="KS">Kansas</option>
                <option value="KY">Kentucky</option>
                <option value="LA">Louisiana</option>
                <option value="ME">Maine</option>
                <option value="MD">Maryland</option>
                <option value="MA">Massachusetts</option>
                <option value="MI">Michigan</option>
                <option value="MN">Minnesota</option>
                <option value="MS">Mississippi</option>
                <option value="MO">Missouri</option>
                <option value="MT">Montana</option>
                <option value="NE">Nebraska</option>
                <option value="NV">Nevada</option>
                <option value="NH">New Hampshire</option>
                <option value="NJ">New Jersey</option>
                <option value="NM">New Mexico</option>
                <option value="NY">New York</option>
                <option value="NC">North Carolina</option>
                <option value="ND">North Dakota</option>
                <option value="OH">Ohio</option>
                <option value="OK">Oklahoma</option>
                <option value="OR">Oregon</option>
                <option value="PA">Pennsylvania</option>
                <option value="RI">Rhode Island</option>
                <option value="SC">South Carolina</option>
                <option value="SD">South Dakota</option>
                <option value="TN">Tennessee</option>
                <option value="TX">Texas</option>
                <option value="UT">Utah</option>
                <option value="VT">Vermont</option>
                <option value="VA">Virginia</option>
                <option value="WA">Washington</option>
                <option value="WV">West Virginia</option>
                <option value="WI">Wisconsin</option>
                <option value="WY">Wyoming</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ZIP
              </label>
              <input
                type="text"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                COUNTRY
              </label>
              <select
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="Mexico">Mexico</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WEBSITE
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                COMMENTS
              </label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tax Filing & Insurance Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">1099-NEC tax filing information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TAX IDENTITY TYPE
                  </label>
                  <select
                    name="tax_id_type"
                    value={formData.tax_id_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select type...</option>
                    <option value="SSN">SSN</option>
                    <option value="EIN">EIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TAXPAYER ID
                  </label>
                  <input
                    type="text"
                    name="taxpayer_id"
                    value={formData.taxpayer_id}
                    onChange={handleInputChange}
                    placeholder="Enter SSN or EIN..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="use_different_name"
                      checked={formData.use_different_name}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Use a different name</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="use_different_address"
                      checked={formData.use_different_address}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Use a different address</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Insurance</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PROVIDER
                  </label>
                  <input
                    type="text"
                    name="insurance_provider"
                    value={formData.insurance_provider}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    POLICY NUMBER
                  </label>
                  <input
                    type="text"
                    name="policy_number"
                    value={formData.policy_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    EXPIRATION DATE
                  </label>
                  <input
                    type="text"
                    name="insurance_expiration_date"
                    value={formData.insurance_expiration_date}
                    onChange={handleInputChange}
                    placeholder="m/yyyy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-start space-x-4 pt-6">
            <button
              type="submit"
              disabled={createVendorMutation.isLoading}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            >
              {createVendorMutation.isLoading ? 'Creating...' : 'Create vendor'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVendorModal;
