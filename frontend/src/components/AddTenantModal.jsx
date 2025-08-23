import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from 'react-query';
import api from '../utils/axios';
import toast from 'react-hot-toast';

const AddTenantModal = ({ isOpen, onClose, properties, onSuccess }) => {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm();

  // Fetch available tenants
  const { data: availableTenantsData, isLoading: tenantsLoading } = useQuery(
    ['available-tenants'],
    async () => {
      const response = await api.get('/api/tenants/available-tenants');
      return response.data;
    },
    { enabled: isOpen }
  );

  const availableTenants = availableTenantsData?.available_tenants || [];

  // Handle property selection to update rent amount
  const handlePropertyChange = (e) => {
    const propertyId = parseInt(e.target.value);
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setSelectedProperty(property);
      setValue('rentAmount', property.rent_amount);
    } else {
      setSelectedProperty(null);
      setValue('rentAmount', '');
    }
  };

  const onSubmit = async (data) => {
    try {
      if (!selectedTenant) {
        toast.error('Please select a tenant first');
        return;
      }

      // Use the property's rent amount and selected tenant data
      const formData = {
        name: selectedTenant.full_name,
        email: selectedTenant.email,
        phone: selectedTenant.phone_number,
        rentAmount: selectedProperty.rent_amount,
        propertyId: parseInt(data.propertyId),
        leaseStartDate: data.leaseStartDate,
        leaseEndDate: data.leaseEndDate
      };

      console.log('Submitting tenant data:', formData);
      const response = await api.post('/api/tenants/', formData);
      
      toast.success('Tenant assigned to property successfully!');
      reset();
      setSelectedProperty(null);
      setSelectedTenant(null);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding tenant:', error);
      toast.error(error.response?.data?.error || 'Failed to assign tenant to property');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Assign Tenant to Property</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Tenant Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Tenant</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Choose Registered Tenant *
              </label>
              <select
                {...register('tenantId', { required: 'Please select a tenant' })}
                className="input-field w-full"
                onChange={(e) => {
                  const tenantId = parseInt(e.target.value);
                  const tenant = availableTenants.find(t => t.id === tenantId);
                  setSelectedTenant(tenant);
                  if (tenant) {
                    setValue('name', tenant.full_name);
                    setValue('email', tenant.email);
                    setValue('phone', tenant.phone_number);
                  }
                }}
              >
                <option value="">Select a tenant...</option>
                {availableTenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.full_name} ({tenant.email})
                  </option>
                ))}
              </select>
              {errors.tenantId && (
                <p className="text-red-500 text-sm mt-1">{errors.tenantId.message}</p>
              )}
              {tenantsLoading && (
                <p className="text-gray-500 text-sm mt-1">Loading available tenants...</p>
              )}
              {!tenantsLoading && availableTenants.length === 0 && (
                <p className="text-gray-500 text-sm mt-1">No available tenants found. All registered tenants are already assigned to properties.</p>
              )}
            </div>
          </div>

          {/* Tenant Information (Read-only when tenant is selected) */}
          {selectedTenant && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tenant Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    className="input-field w-full bg-gray-50"
                    placeholder="Enter full name"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="input-field w-full bg-gray-50"
                    placeholder="Enter email"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    className="input-field w-full bg-gray-50"
                    placeholder="Enter phone number"
                    readOnly
                  />
                </div>
                             </div>
             </div>
           )}

           {/* Property Selection */}
           <div className="space-y-4">
             <h3 className="text-lg font-semibold">Property Assignment</h3>
             
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Property *
               </label>
               <select
                 {...register('propertyId', { required: 'Property is required' })}
                 className="input-field w-full"
                 onChange={handlePropertyChange}
               >
                 <option value="">Select a property</option>
                 {properties.map(property => (
                   <option key={property.id} value={property.id}>
                     {property.title} - ${property.rent_amount}/month
                   </option>
                 ))}
               </select>
               {errors.propertyId && (
                 <p className="text-red-500 text-sm mt-1">{errors.propertyId.message}</p>
               )}
             </div>
           </div>

          {/* Lease Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Lease Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lease Start Date *
                </label>
                <input
                  type="date"
                  {...register('leaseStartDate', { required: 'Lease start date is required' })}
                  className="input-field w-full"
                />
                {errors.leaseStartDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.leaseStartDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lease End Date *
                </label>
                <input
                  type="date"
                  {...register('leaseEndDate', { required: 'Lease end date is required' })}
                  className="input-field w-full"
                />
                {errors.leaseEndDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.leaseEndDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Rent
                </label>
                <input
                  type="text"
                  value={selectedProperty ? `$${selectedProperty.rent_amount}/month` : 'Select a property first'}
                  className="input-field w-full bg-gray-100"
                  disabled
                />
                <p className="text-sm text-gray-500 mt-1">Rent amount is set by the property's listing</p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedTenant || !selectedProperty}
            >
              Assign Tenant to Property
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTenantModal;