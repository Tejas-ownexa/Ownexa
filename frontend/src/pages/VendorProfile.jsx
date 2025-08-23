import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/axios';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  Wrench, 
  Save, 
  Edit,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

const VendorProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  // Fetch vendor profile
  const { data: vendorProfile, isLoading } = useQuery(
    ['vendor-profile'],
    async () => {
      const response = await api.get('/api/vendors/profile');
      return response.data;
    },
    {
      onError: (error) => {
        toast.error('Failed to load vendor profile');
      }
    }
  );

  // Update vendor profile mutation
  const updateProfileMutation = useMutation(
    async (data) => {
      const response = await api.put('/api/vendors/profile', data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['vendor-profile']);
        toast.success('Profile updated successfully');
        setIsEditing(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update profile');
      }
    }
  );

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleEdit = () => {
    setFormData({
      business_name: vendorProfile.business_name,
      phone_number: vendorProfile.phone_number,
      email: vendorProfile.email,
      address: vendorProfile.address,
      license_number: vendorProfile.license_number,
      insurance_info: vendorProfile.insurance_info,
      hourly_rate: vendorProfile.hourly_rate
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  const getVendorTypeLabel = (type) => {
    const typeMap = {
      'carpenter': 'Carpenter',
      'electrician': 'Electrician',
      'plumber': 'Plumber',
      'pest_control': 'Pest Control',
      'hvac': 'HVAC',
      'general': 'General Contractor'
    };
    return typeMap[type] || type;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading vendor profile...</div>
      </div>
    );
  }

  if (!vendorProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Vendor Profile Not Found</h2>
          <p className="text-gray-600">Please contact support to set up your vendor profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Vendor Profile</h1>
              <p className="text-gray-600 mt-1">Manage your business information and services</p>
            </div>
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Building className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Business Information</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.business_name || ''}
                      onChange={(e) => handleInputChange('business_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">{vendorProfile.business_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor Type
                  </label>
                  <div className="flex items-center">
                    <Wrench className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-gray-900">{getVendorTypeLabel(vendorProfile.vendor_type)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone_number || ''}
                      onChange={(e) => handleInputChange('phone_number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-gray-900">{vendorProfile.phone_number}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-gray-900">{vendorProfile.email}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Address
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 text-gray-500 mr-2 mt-0.5" />
                      <span className="text-gray-900">{vendorProfile.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Professional Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Number
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.license_number || ''}
                      onChange={(e) => handleInputChange('license_number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your license number"
                    />
                  ) : (
                    <p className="text-gray-900">{vendorProfile.license_number || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Insurance Information
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.insurance_info || ''}
                      onChange={(e) => handleInputChange('insurance_info', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your insurance details"
                    />
                  ) : (
                    <p className="text-gray-900">{vendorProfile.insurance_info || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Rate ($)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={formData.hourly_rate || ''}
                      onChange={(e) => handleInputChange('hourly_rate', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your hourly rate"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {vendorProfile.hourly_rate ? `$${vendorProfile.hourly_rate}/hour` : 'Not set'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateProfileMutation.isLoading}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Verification Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    vendorProfile.is_verified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {vendorProfile.is_verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Account Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    vendorProfile.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {vendorProfile.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm text-gray-900">
                    {vendorProfile.created_at ? new Date(vendorProfile.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/maintenance')}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  <Wrench className="h-4 w-4 mr-3" />
                  View Maintenance Requests
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorProfile;
