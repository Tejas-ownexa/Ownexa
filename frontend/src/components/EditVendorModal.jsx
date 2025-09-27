import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { X } from 'lucide-react';
import api from '../utils/axios';

const EditVendorModal = ({ vendor, isOpen, onClose, onVendorUpdated }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    primary_email: '',
    phone_1: '',
    company_name: '',
    category_id: '',
    rental_owner_id: '',
    insurance_provider: '',
    insurance_expiration_date: '',
    website: '',
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    comments: ''
  });

  // Fetch vendor categories
  const { data: vendorCategories } = useQuery(
    'vendorCategories',
    async () => {
      const response = await api.get('/api/vendors/categories');
      return response.data;
    }
  );

  // Fetch rental owners
  const { data: rentalOwners } = useQuery(
    'rentalOwners',
    async () => {
      const response = await api.get('/api/rental-owners');
      return response.data.rental_owners;
    }
  );

  // Update vendor mutation
  const updateVendorMutation = useMutation(
    async (vendorData) => {
      const response = await api.put(`/api/vendors/${vendor.id}`, vendorData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vendors');
        onVendorUpdated();
      },
      onError: (error) => {
        console.error('Error updating vendor:', error);
        alert('Failed to update vendor. Please try again.');
      }
    }
  );

  // Initialize form data when vendor changes
  useEffect(() => {
    if (vendor) {
      setFormData({
        first_name: vendor.first_name || '',
        last_name: vendor.last_name || '',
        primary_email: vendor.primary_email || '',
        phone_1: vendor.phone_1 || '',
        company_name: vendor.company_name || '',
        category_id: vendor.category_id || '',
        rental_owner_id: vendor.rental_owner_id || '',
        insurance_provider: vendor.insurance_provider || '',
        insurance_expiration_date: vendor.insurance_expiration_date || '',
        website: vendor.website || '',
        street_address: vendor.street_address || '',
        city: vendor.city || '',
        state: vendor.state || '',
        zip_code: vendor.zip_code || '',
        comments: vendor.comments || ''
      });
    }
  }, [vendor]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateVendorMutation.mutate(formData);
  };

  if (!isOpen || !vendor) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up">
      <div className="glass-card p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gradient">Edit Vendor</h2>
            <p className="text-sm text-gray-600 mt-1">Update vendor information</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 dark:text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-all duration-300 hover:scale-110"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="primary_email"
                value={formData.primary_email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone_1"
                value={formData.phone_1}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {vendorCategories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rental Owner
              </label>
              <select
                name="rental_owner_id"
                value={formData.rental_owner_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a rental owner</option>
                {rentalOwners?.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.company_name} ({owner.property_count || 0} properties)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Insurance Provider
              </label>
              <input
                type="text"
                name="insurance_provider"
                value={formData.insurance_provider}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Insurance Expiration Date
              </label>
              <input
                type="date"
                name="insurance_expiration_date"
                value={formData.insurance_expiration_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                name="street_address"
                value={formData.street_address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ZIP Code
              </label>
              <input
                type="text"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comments
            </label>
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateVendorMutation.isLoading}
              className="btn-success flex items-center space-x-2 disabled:opacity-50"
            >
              {updateVendorMutation.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Vendor</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditVendorModal;
