import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from 'react-query';
import api from '../utils/axios';
import toast from 'react-hot-toast';

const AddTenantModal = ({ isOpen, onClose, properties, onSuccess }) => {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [proratedRent, setProratedRent] = useState(null);
  const [calculatingProration, setCalculatingProration] = useState(false);
  const [prorationError, setProrationError] = useState(null);
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
  
  // Watch form values for prorated rent calculation
  const watchedValues = watch(['propertyId', 'leaseStartDate', 'rentPaymentDay']);
  
  // Client-side prorated rent calculation as fallback
  const calculateProratedRentClientSide = (property, leaseStartDate, rentPaymentDay) => {
    if (!property || !leaseStartDate || !rentPaymentDay) return null;
    
    const startDate = new Date(leaseStartDate);
    const paymentDay = parseInt(rentPaymentDay);
    const monthlyRent = parseFloat(property.rent_amount);
    
    // Get days in the start month
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Calculate billing logic
    let daysToBill;
    if (startDate.getDate() <= paymentDay) {
      // Bill from lease start to end of month
      daysToBill = daysInMonth - startDate.getDate() + 1;
    } else {
      // Bill from lease start to next payment day
      const daysCurrentMonth = daysInMonth - startDate.getDate() + 1;
      daysToBill = daysCurrentMonth + paymentDay;
    }
    
    const dailyRate = monthlyRent / daysInMonth;
    const proratedAmount = dailyRate * daysToBill;
    const savings = monthlyRent - proratedAmount;
    
    // Calculate next payment date
    let nextPaymentDate;
    if (startDate.getDate() <= paymentDay) {
      nextPaymentDate = new Date(year, month + 1, Math.min(paymentDay, new Date(year, month + 2, 0).getDate()));
    } else {
      nextPaymentDate = new Date(year, month + 1, Math.min(paymentDay, new Date(year, month + 2, 0).getDate()));
    }
    
    return {
      monthly_rent: monthlyRent,
      first_month_amount: Math.round(proratedAmount * 100) / 100,
      days_in_month: daysInMonth,
      days_prorated: daysToBill,
      daily_rate: Math.round(dailyRate * 100) / 100,
      next_full_payment_date: nextPaymentDate.toISOString().split('T')[0],
      calculation_note: `Prorated for ${daysToBill} days at $${Math.round(dailyRate * 100) / 100}/day`,
      savings: Math.round(savings * 100) / 100
    };
  };

  // Calculate prorated rent when form values change
  const calculateProratedRent = async (propertyId, leaseStartDate, rentPaymentDay) => {
    if (!propertyId || !leaseStartDate || !rentPaymentDay) {
      setProratedRent(null);
      setProrationError(null);
      return;
    }
    
    try {
      setCalculatingProration(true);
      setProrationError(null);
      setProratedRent(null); // Clear previous result
      
      // Try API first
      const response = await api.post('/api/tenants/calculate-prorated-rent', {
        propertyId: parseInt(propertyId),
        leaseStartDate,
        rentPaymentDay: parseInt(rentPaymentDay)
      });
      
      if (response.data.success) {
        setProratedRent(response.data.prorated_rent);
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.warn('API calculation failed, using client-side calculation:', error);
      
      // Fallback to client-side calculation
      const property = properties.find(p => p.id === parseInt(propertyId));
      if (property) {
        const clientResult = calculateProratedRentClientSide(property, leaseStartDate, rentPaymentDay);
        if (clientResult) {
          setProratedRent(clientResult);
        } else {
          setProrationError('Unable to calculate prorated rent');
        }
      } else {
        setProrationError('Property not found for calculation');
      }
    } finally {
      setCalculatingProration(false);
    }
  };
  
  // Effect to recalculate prorated rent when form values change
  useEffect(() => {
    const [propertyId, leaseStartDate, rentPaymentDay] = watchedValues;
    if (propertyId && leaseStartDate && rentPaymentDay) {
      calculateProratedRent(propertyId, leaseStartDate, rentPaymentDay);
    } else {
      setProratedRent(null);
      setProrationError(null);
    }
  }, [watchedValues]);

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setProratedRent(null);
      setProrationError(null);
      setCalculatingProration(false);
    }
  }, [isOpen]);

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
        rentAmount: selectedProperty.rent_amount, // Always use property's rent amount when assigning
        propertyId: parseInt(data.propertyId),
        leaseStartDate: data.leaseStartDate,
        leaseEndDate: data.leaseEndDate,
        rentPaymentDay: parseInt(data.rentPaymentDay)
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
                  Rent Payment Day *
                </label>
                <select
                  {...register('rentPaymentDay', { required: 'Rent payment day is required' })}
                  className="input-field w-full"
                  defaultValue="1"
                >
                  <option value="">Select payment day...</option>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>
                      {day === 1 ? '1st' : 
                       day === 2 ? '2nd' : 
                       day === 3 ? '3rd' : 
                       `${day}th`} of each month
                    </option>
                  ))}
                </select>
                {errors.rentPaymentDay && (
                  <p className="text-red-500 text-sm mt-1">{errors.rentPaymentDay.message}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Select the day of each month when rent payment is due
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Rent
                </label>
                <input
                  type="text"
                  value={
                    selectedProperty 
                      ? `$${selectedProperty.rent_amount}/month` 
                      : selectedTenant && selectedTenant.rent_amount && selectedTenant.rent_amount !== 'N/A'
                        ? `$${selectedTenant.rent_amount}/month`
                        : 'N/A'
                  }
                  className="input-field w-full bg-gray-100"
                  disabled
                />
                <p className="text-sm text-gray-500 mt-1">
                  {selectedProperty 
                    ? 'Rent amount is set by the property\'s listing'
                    : selectedTenant && selectedTenant.rent_amount && selectedTenant.rent_amount !== 'N/A'
                      ? 'Rent amount from tenant record'
                      : 'No rent amount set for this tenant'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Prorated Rent Information */}
          {proratedRent && (
            <div className={`border rounded-lg p-4 ${proratedRent.savings > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
              <h4 className={`text-lg font-semibold mb-3 ${proratedRent.savings > 0 ? 'text-blue-800' : 'text-gray-800'}`}>
                {proratedRent.savings > 0 ? 'Prorated Rent Calculation' : 'Full Month Rent Billing'}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">First Month Amount</p>
                  <p className="text-xl font-bold text-blue-600">${proratedRent.first_month_amount}</p>
                  <p className="text-xs text-gray-500">Instead of ${proratedRent.monthly_rent}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">You Save</p>
                  <p className={`text-xl font-bold ${proratedRent.savings > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                    ${proratedRent.savings.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {proratedRent.savings > 0 ? 'For partial month' : 'Full month billing'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Days Prorated</p>
                  <p className="text-lg font-semibold">{proratedRent.days_prorated} days</p>
                  <p className="text-xs text-gray-500">Out of {proratedRent.days_in_month} days</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Daily Rate</p>
                  <p className="text-lg font-semibold">${proratedRent.daily_rate}/day</p>
                  <p className="text-xs text-gray-500">Next full payment: {new Date(proratedRent.next_full_payment_date).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className={`mt-3 p-3 rounded ${proratedRent.savings > 0 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <p className={`text-sm ${proratedRent.savings > 0 ? 'text-blue-800' : 'text-gray-800'}`}>
                  <strong>Calculation:</strong> {proratedRent.calculation_note}
                </p>
                {proratedRent.savings === 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Note:</strong> Since the lease starts before the rent payment day, 
                    the tenant is billed for the full month from lease start to month end.
                  </p>
                )}
              </div>
            </div>
          )}
          
          {calculatingProration && !proratedRent && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                <p className="text-gray-600">Calculating prorated rent...</p>
              </div>
            </div>
          )}
          
          {prorationError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-red-600 mr-3">⚠️</div>
                <div>
                  <p className="text-red-800 font-medium">Error calculating prorated rent</p>
                  <p className="text-red-600 text-sm">{prorationError}</p>
                </div>
              </div>
            </div>
          )}

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