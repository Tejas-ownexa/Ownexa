import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import { ArrowLeft, Building2, MapPin, Save, X, User } from 'lucide-react';
import toast from 'react-hot-toast';
import associationService from '../services/associationService';

const AddAssociation = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    street_address_1: '',
    street_address_2: '',
    apt_number: '',
    city: '',
    state: '',
    zip_code: '',
    managers: [{ name: '', email: '', phone: '' }]
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create association mutation
  const createAssociationMutation = useMutation(
    (associationData) => associationService.createAssociation(associationData),
    {
      onSuccess: (response) => {
        // Invalidate and refetch associations list
        queryClient.invalidateQueries(['associations']);
        
        // Show success message
        toast.success('Association created successfully!');
        
        // Navigate back to associations page
        navigate('/associations');
      },
      onError: (error) => {
        console.error('Error creating association:', error);
        const errorMessage = error.response?.data?.error || 'Failed to create association';
        toast.error(`Error: ${errorMessage}`);
      }
    }
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleManagerChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      managers: prev.managers.map((manager, i) => 
        i === index ? { ...manager, [field]: value } : manager
      )
    }));
    
    // Clear manager errors when user starts typing
    if (errors[`manager_${index}_${field}`]) {
      setErrors(prev => ({
        ...prev,
        [`manager_${index}_${field}`]: ''
      }));
    }
  };

  const addManager = () => {
    if (formData.managers.length < 5) {
      setFormData(prev => ({
        ...prev,
        managers: [...prev.managers, { name: '', email: '', phone: '' }]
      }));
    }
  };

  const removeManager = (index) => {
    if (formData.managers.length > 1) {
      setFormData(prev => ({
        ...prev,
        managers: prev.managers.filter((_, i) => i !== index)
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Association name is required';
    }
    
    if (!formData.street_address_1.trim()) {
      newErrors.street_address_1 = 'Street address is required';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    
    if (!formData.zip_code.trim()) {
      newErrors.zip_code = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zip_code)) {
      newErrors.zip_code = 'Please enter a valid ZIP code';
    }
    
    // Validate managers
    formData.managers.forEach((manager, index) => {
      if (manager.name.trim() && !manager.email.trim()) {
        newErrors[`manager_${index}_email`] = 'Email is required when manager name is provided';
      }
      if (manager.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(manager.email)) {
        newErrors[`manager_${index}_email`] = 'Please enter a valid email address';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare data for submission - convert managers array to the format expected by backend
      const submissionData = {
        ...formData,
        manager: formData.managers[0]?.name || '', // Keep first manager as primary for backward compatibility
        managers: formData.managers.filter(m => m.name.trim() || m.email.trim() || m.phone.trim()) // Only include non-empty managers
      };
      
      await createAssociationMutation.mutateAsync(submissionData);
    } catch (error) {
      // Error is handled in the mutation's onError callback
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/associations');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/associations')}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Association</h1>
              <p className="text-gray-600">Create a new association with its location details</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Association Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="h-4 w-4 inline mr-2" />
              Association Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter association name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Managers Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                <User className="h-4 w-4 inline mr-2" />
                Managers (Optional)
              </label>
              {formData.managers.length < 5 && (
                <button
                  type="button"
                  onClick={addManager}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Manager
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {formData.managers.map((manager, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Manager {index + 1}</span>
                    {formData.managers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeManager(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor={`manager_${index}_name`} className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        id={`manager_${index}_name`}
                        value={manager.name}
                        onChange={(e) => handleManagerChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter manager name"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor={`manager_${index}_email`} className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id={`manager_${index}_email`}
                        value={manager.email}
                        onChange={(e) => handleManagerChange(index, 'email', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors[`manager_${index}_email`] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter manager email"
                      />
                      {errors[`manager_${index}_email`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`manager_${index}_email`]}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor={`manager_${index}_phone`} className="block text-sm font-medium text-gray-700 mb-1">
                        Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        id={`manager_${index}_phone`}
                        value={manager.phone}
                        onChange={(e) => handleManagerChange(index, 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {formData.managers.length >= 5 && (
              <p className="text-sm text-gray-500 mt-2">Maximum of 5 managers allowed</p>
            )}
          </div>

          {/* Address Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Address Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Street Address 1 */}
              <div className="md:col-span-2">
                <label htmlFor="street_address_1" className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  id="street_address_1"
                  name="street_address_1"
                  value={formData.street_address_1}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.street_address_1 ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="123 Main Street"
                />
                {errors.street_address_1 && (
                  <p className="mt-1 text-sm text-red-600">{errors.street_address_1}</p>
                )}
              </div>

              {/* Street Address 2 */}
              <div className="md:col-span-2">
                <label htmlFor="street_address_2" className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address 2 (Optional)
                </label>
                <input
                  type="text"
                  id="street_address_2"
                  name="street_address_2"
                  value={formData.street_address_2}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Suite 100, Floor 2, etc."
                />
              </div>

              {/* Apartment Number */}
              <div>
                <label htmlFor="apt_number" className="block text-sm font-medium text-gray-700 mb-2">
                  Apartment/Unit Number (Optional)
                </label>
                <input
                  type="text"
                  id="apt_number"
                  name="apt_number"
                  value={formData.apt_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Apt 1A, Unit 101, etc."
                />
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.city ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter city"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                )}
              </div>

              {/* State */}
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.state ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter state"
                />
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                )}
              </div>

              {/* ZIP Code */}
              <div>
                <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  id="zip_code"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.zip_code ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="12345 or 12345-6789"
                />
                {errors.zip_code && (
                  <p className="mt-1 text-sm text-red-600">{errors.zip_code}</p>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Association
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAssociation;
