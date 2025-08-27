import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { Wrench, AlertTriangle, Clock, Calendar, FileText, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const MaintenanceRequest = () => {
  const navigate = useNavigate();
  const [selectedVendorType, setSelectedVendorType] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm();

  // Get user's properties (for tenants)
  const { data: userProperties } = useQuery(
    ['user-properties'],
    async () => {
      const response = await api.get('/api/properties');
      return response.data;
    },
    {
      onError: (error) => {
        console.error('Error fetching properties:', error);
      }
    }
  );

  const createMaintenanceRequest = useMutation(
    async (data) => {
      const response = await api.post('/api/maintenance/requests', data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success('Maintenance request submitted successfully!');
        navigate('/dashboard');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to submit maintenance request');
      },
    }
  );

  const onSubmit = async (data) => {
    if (!data.property_id) {
      toast.error('Please select a property');
      return;
    }

    if (!data.request_title || !data.request_description) {
      toast.error('Please fill in all required fields');
      return;
    }

    createMaintenanceRequest.mutate(data);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVendorTypeIcon = (type) => {
    switch (type) {
      case 'carpenter':
        return '🔨';
      case 'electrician':
        return '⚡';
      case 'plumber':
        return '🔧';
      case 'pest_control':
        return '🐜';
      case 'hvac':
        return '❄️';
      case 'general':
        return '🏗️';
      default:
        return '🔧';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <div className="flex items-center">
            <Wrench className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Submit Maintenance Request</h1>
              <p className="text-gray-600 mt-1">Report maintenance issues for your property</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Property Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property *
              </label>
              <select
                {...register('property_id', { required: 'Property is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select your property</option>
                {userProperties?.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.title} - {property.address?.street_1}, {property.address?.city}
                  </option>
                ))}
              </select>
              {errors.property_id && (
                <p className="mt-1 text-sm text-red-600">{errors.property_id.message}</p>
              )}
            </div>

            {/* Request Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Title *
              </label>
              <input
                type="text"
                {...register('request_title', { required: 'Issue title is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of the issue"
              />
              {errors.request_title && (
                <p className="mt-1 text-sm text-red-600">{errors.request_title.message}</p>
              )}
            </div>

            {/* Request Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Description *
              </label>
              <textarea
                {...register('request_description', { required: 'Description is required' })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Please provide detailed information about the maintenance issue..."
              />
              {errors.request_description && (
                <p className="mt-1 text-sm text-red-600">{errors.request_description.message}</p>
              )}
            </div>

            {/* Priority Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'low', label: 'Low', description: 'Minor issue, not urgent' },
                  { value: 'medium', label: 'Medium', description: 'Moderate issue' },
                  { value: 'high', label: 'High', description: 'Important issue' },
                  { value: 'urgent', label: 'Urgent', description: 'Critical issue' }
                ].map((priority) => (
                  <label
                    key={priority.value}
                    className={`relative flex flex-col p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      watch('priority') === priority.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={priority.value}
                      {...register('priority', { required: 'Priority is required' })}
                      className="sr-only"
                    />
                    <div className="flex items-center mb-2">
                      <div className={`w-3 h-3 rounded-full border-2 ${
                        watch('priority') === priority.value
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`} />
                      <span className={`ml-2 text-sm font-medium px-2 py-1 rounded-full ${getPriorityColor(priority.value)}`}>
                        {priority.label}
                      </span>
                    </div>
                    <span className="text-xs text-gray-600">{priority.description}</span>
                  </label>
                ))}
              </div>
              {errors.priority && (
                <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
              )}
            </div>

            {/* Vendor Type Suggestion */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suggested Vendor Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { value: 'carpenter', label: 'Carpenter', icon: '🔨' },
                  { value: 'electrician', label: 'Electrician', icon: '⚡' },
                  { value: 'plumber', label: 'Plumber', icon: '🔧' },
                  { value: 'pest_control', label: 'Pest Control', icon: '🐜' },
                  { value: 'hvac', label: 'HVAC', icon: '❄️' },
                  { value: 'general', label: 'General', icon: '🏗️' }
                ].map((type) => (
                  <label
                    key={type.value}
                    className={`relative flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      selectedVendorType === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={type.value}
                      onChange={(e) => {
                        setSelectedVendorType(e.target.value);
                        setValue('suggested_vendor_type', e.target.value);
                      }}
                      className="sr-only"
                    />
                    <span className="text-2xl mr-3">{type.icon}</span>
                    <span className="text-sm font-medium">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Request Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Date
              </label>
              <input
                type="date"
                {...register('request_date')}
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                {...register('tenant_notes')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any additional information that might help with the repair..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMaintenanceRequest.isLoading}
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMaintenanceRequest.isLoading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>

        {/* Information Panel */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">What happens next?</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Your request will be reviewed within 24 hours
                </li>
                <li className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  A vendor will be assigned based on the issue type
                </li>
                <li className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  You'll receive updates on the progress via email
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceRequest;
