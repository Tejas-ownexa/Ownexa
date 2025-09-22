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
  const [tenantMode, setTenantMode] = useState('existing'); // 'existing' or 'new'
  const [calculationTimeout, setCalculationTimeout] = useState(null);
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
  const watchedFormData = watch(['name', 'email', 'phone']);
  
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

  // Simple synchronous calculation function
  const calculateProratedRent = (propertyId, leaseStartDate, rentPaymentDay) => {
    console.log('🔄 Starting prorated rent calculation:', { propertyId, leaseStartDate, rentPaymentDay });
    
    // Clear any existing states first
    setProratedRent(null);
    setProrationError(null);
    setCalculatingProration(false);
    
    if (!propertyId || !leaseStartDate || !rentPaymentDay) {
      console.log('❌ Missing required fields');
      return;
    }
    
    try {
      console.log('⏳ Setting calculating state to true');
      setCalculatingProration(true);
      
      // Find property
      const property = properties.find(p => p.id === parseInt(propertyId));
      console.log('🏠 Found property:', property);
      
      if (!property) {
        setProrationError('Property not found for calculation');
        setCalculatingProration(false);
        return;
      }
      
      // Do the calculation immediately (synchronous)
      console.log('🧮 Calculating prorated rent...');
      const clientResult = calculateProratedRentClientSide(property, leaseStartDate, rentPaymentDay);
      console.log('✅ Calculation result:', clientResult);
      
      if (clientResult) {
        setProratedRent(clientResult);
        console.log('✅ Prorated rent set successfully');
      } else {
        setProrationError('Unable to calculate prorated rent');
        console.log('❌ Calculation returned null');
      }
      
      console.log('🏁 Setting calculating state to false');
      setCalculatingProration(false);
      
    } catch (error) {
      console.error('❌ Error calculating prorated rent:', error);
      setProrationError('Error calculating prorated rent');
      setCalculatingProration(false);
    }
  };
  
  // Effect to recalculate prorated rent when form values change
  useEffect(() => {
    const [propertyId, leaseStartDate, rentPaymentDay] = watchedValues;
    console.log('📊 useEffect triggered with values:', { propertyId, leaseStartDate, rentPaymentDay });
    
    // Clear any existing timeout
    if (calculationTimeout) {
      clearTimeout(calculationTimeout);
    }
    
    // Clear states immediately if any value is missing
    if (!propertyId || !leaseStartDate || !rentPaymentDay) {
      console.log('❌ Missing values, clearing states');
      setProratedRent(null);
      setProrationError(null);
      setCalculatingProration(false);
      return;
    }
    
    // Debounce the calculation to prevent rapid calls
    console.log('✅ All values present, debouncing calculation');
    const timeout = setTimeout(() => {
      console.log('🚀 Executing debounced calculation');
      calculateProratedRent(propertyId, leaseStartDate, rentPaymentDay);
    }, 300); // 300ms debounce
    
    setCalculationTimeout(timeout);
    
    // Cleanup function
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [watchedValues]);

  // Safety mechanism to prevent infinite loading
  useEffect(() => {
    if (calculatingProration) {
      const timeout = setTimeout(() => {
        console.warn('Prorated rent calculation timeout - forcing stop');
        setCalculatingProration(false);
        setProrationError('Calculation timeout - please try again');
      }, 15000); // 15 second maximum

      return () => clearTimeout(timeout);
    }
  }, [calculatingProration]);

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setProratedRent(null);
      setProrationError(null);
      setCalculatingProration(false);
      if (calculationTimeout) {
        clearTimeout(calculationTimeout);
        setCalculationTimeout(null);
      }
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
      if (tenantMode === 'existing' && !selectedTenant) {
        toast.error('Please select a tenant first');
        return;
      }

      if (!selectedProperty) {
        toast.error('Please select a property first');
        return;
      }

      // Prepare form data based on mode
      const formData = {
        name: tenantMode === 'existing' ? selectedTenant.full_name : data.name,
        email: tenantMode === 'existing' ? selectedTenant.email : data.email,
        phone: tenantMode === 'existing' ? selectedTenant.phone_number : data.phone,
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
      setTenantMode('existing');
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
          {/* Tenant Mode Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tenant Information</h3>
            
            <div className="flex space-x-4 mb-4">
              <button
                type="button"
                onClick={() => setTenantMode('existing')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  tenantMode === 'existing'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Select Existing Tenant
              </button>
              <button
                type="button"
                onClick={() => setTenantMode('new')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  tenantMode === 'new'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Create New Tenant
              </button>
            </div>

            {tenantMode === 'existing' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Choose Registered Tenant *
                </label>
                <select
                  {...register('tenantId', { required: tenantMode === 'existing' ? 'Please select a tenant' : false })}
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    {...register('name', { required: tenantMode === 'new' ? 'Full name is required' : false })}
                    className="input-field w-full"
                    placeholder="Enter full name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    {...register('email', { required: tenantMode === 'new' ? 'Email is required' : false })}
                    className="input-field w-full"
                    placeholder="Enter email"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    {...register('phone', { required: tenantMode === 'new' ? 'Phone number is required' : false })}
                    className="input-field w-full"
                    placeholder="Enter phone number"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                  )}
                </div>
              </div>
            )}
          </div>


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
              <div className="mt-3 text-center space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setCalculatingProration(false);
                    setProrationError('Calculation cancelled by user');
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Cancel calculation
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const [propertyId, leaseStartDate, rentPaymentDay] = watchedValues;
                    if (propertyId && leaseStartDate && rentPaymentDay) {
                      calculateProratedRent(propertyId, leaseStartDate, rentPaymentDay);
                    }
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Force calculate
                </button>
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
              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    const [propertyId, leaseStartDate, rentPaymentDay] = watchedValues;
                    if (propertyId && leaseStartDate && rentPaymentDay) {
                      calculateProratedRent(propertyId, leaseStartDate, rentPaymentDay);
                    }
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Manual calculation button when no calculation is happening */}
          {!calculatingProration && !proratedRent && !prorationError && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  const [propertyId, leaseStartDate, rentPaymentDay] = watchedValues;
                  if (propertyId && leaseStartDate && rentPaymentDay) {
                    calculateProratedRent(propertyId, leaseStartDate, rentPaymentDay);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
              >
                Calculate Prorated Rent
              </button>
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
              disabled={
                !selectedProperty || 
                (tenantMode === 'existing' && !selectedTenant) || 
                (tenantMode === 'new' && (!watchedFormData[0] || !watchedFormData[1] || !watchedFormData[2]))
              }
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