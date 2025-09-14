import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from 'react-query';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import { X, User, Building, Calendar, DollarSign } from 'lucide-react';

const AddLeaseModal = ({ isOpen, onClose, onSuccess }) => {
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [proratedRent, setProratedRent] = useState(null);
  const [calculatingProration, setCalculatingProration] = useState(false);
  const [prorationError, setProrationError] = useState(null);
  const [calculationTimeout, setCalculationTimeout] = useState(null);
  const [leaseDetails, setLeaseDetails] = useState({
    leaseStartDate: '',
    leaseEndDate: '',
    monthlyRent: '',
    securityDeposit: '',
    petDeposit: '',
    moveInDate: ''
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm();

  // Watch form values for prorated rent calculation
  const watchedValues = watch(['lease_start_date', 'rent_payment_day']);

  // Fetch approved applicants
  const { data: approvedApplicantsData, isLoading: applicantsLoading } = useQuery(
    ['approved-applicants'],
    async () => {
      const response = await api.get('/api/leasing/applicants?status=Approved');
      return response.data;
    },
    {
      enabled: isOpen,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const approvedApplicants = approvedApplicantsData || [];
  
  // Debug: Log the approved applicants data
  useEffect(() => {
    if (approvedApplicantsData) {
      console.log('Approved applicants data:', approvedApplicantsData);
      approvedApplicantsData.forEach((applicant, index) => {
        console.log(`Applicant ${index}:`, applicant.full_name, applicant.property);
      });
    }
  }, [approvedApplicantsData]);

  // Client-side prorated rent calculation
  const calculateProratedRentClientSide = (property, leaseStartDate, rentPaymentDay) => {
    try {
      if (!property || !leaseStartDate || !rentPaymentDay) {
        return null;
      }

      const startDate = new Date(leaseStartDate);
      const paymentDay = parseInt(rentPaymentDay);
      
      if (isNaN(paymentDay) || paymentDay < 1 || paymentDay > 31) {
        return null;
      }

      // Get the last day of the month
      const lastDayOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
      const actualPaymentDay = Math.min(paymentDay, lastDayOfMonth);
      
      // Calculate days remaining in the month
      const daysRemaining = lastDayOfMonth - startDate.getDate() + 1;
      const totalDaysInMonth = lastDayOfMonth;
      
      // Calculate prorated amount
      const monthlyRent = parseFloat(property.monthly_rent) || 0;
      const proratedAmount = (monthlyRent / totalDaysInMonth) * daysRemaining;
      
      return {
        amount: Math.round(proratedAmount * 100) / 100,
        daysRemaining,
        totalDaysInMonth,
        monthlyRent,
        startDate: startDate.toISOString().split('T')[0],
        paymentDay: actualPaymentDay
      };
    } catch (error) {
      console.error('Error calculating prorated rent:', error);
      return null;
    }
  };

  // Calculate prorated rent
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
      
      // Find property from selected applicant
      const property = selectedApplicant?.property;
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

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset();
      setSelectedApplicant(null);
      setProratedRent(null);
      setCalculatingProration(false);
      setProrationError(null);
      setCalculationTimeout(null);
      setLeaseDetails({
        leaseStartDate: '',
        leaseEndDate: '',
        monthlyRent: '',
        securityDeposit: '',
        petDeposit: '',
        moveInDate: ''
      });
    }
  }, [isOpen, reset]);

  // Auto-fill lease details when applicant is selected
  useEffect(() => {
    if (selectedApplicant && selectedApplicant.property) {
      console.log('Selected applicant property data:', selectedApplicant.property);
      console.log('Monthly rent value:', selectedApplicant.property.monthly_rent);
      setValue('property_id', selectedApplicant.property.id);
      setValue('monthly_rent', selectedApplicant.property.monthly_rent || '');
      setValue('security_deposit', selectedApplicant.property.monthly_rent || ''); // Default to monthly rent
    }
  }, [selectedApplicant, setValue]);

  // Trigger prorated rent calculation when lease start date or rent payment day changes
  useEffect(() => {
    const [leaseStartDate, rentPaymentDay] = watchedValues;
    
    if (leaseStartDate && rentPaymentDay && selectedApplicant?.property) {
      // Debounce the calculation
      const timeoutId = setTimeout(() => {
        calculateProratedRent(selectedApplicant.property.id, leaseStartDate, rentPaymentDay);
      }, 300);
      
      setCalculationTimeout(timeoutId);
      
      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }
  }, [watchedValues, selectedApplicant]);

  // Safety timeout for prorated rent calculation
  useEffect(() => {
    if (calculatingProration) {
      const timeoutId = setTimeout(() => {
        console.log('⏰ Prorated rent calculation timeout - forcing completion');
        setCalculatingProration(false);
        setProrationError('Calculation timed out. Please try again.');
      }, 15000); // 15 second timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [calculatingProration]);

  // Cleanup timeout when modal closes
  useEffect(() => {
    if (!isOpen && calculationTimeout) {
      clearTimeout(calculationTimeout);
      setCalculationTimeout(null);
    }
  }, [isOpen, calculationTimeout]);

  const onSubmit = async (data) => {
    if (!selectedApplicant) {
      toast.error('Please select an approved applicant');
      return;
    }

    if (!selectedApplicant.property) {
      toast.error('Selected applicant has no associated property');
      return;
    }

    try {
      const leaseData = {
        applicant_id: selectedApplicant.id,
        property_id: selectedApplicant.property.id,
        tenant_first_name: selectedApplicant.first_name,
        tenant_last_name: selectedApplicant.last_name,
        tenant_email: selectedApplicant.email,
        tenant_phone: selectedApplicant.phone_number,
        lease_start_date: data.lease_start_date,
        lease_end_date: data.lease_end_date,
        monthly_rent: selectedApplicant.property.monthly_rent || 0,
        security_deposit: selectedApplicant.property.monthly_rent || 0, // Default to monthly rent
        pet_deposit: 0, // Default to 0
        move_in_date: data.lease_start_date, // Use lease start date as move-in date
        lease_status: 'Active'
      };

      const response = await api.post('/api/leasing/create-lease-from-applicant', leaseData);
      
      if (response.data.success) {
        toast.success('Lease created successfully!');
        onSuccess && onSuccess();
        onClose();
      } else {
        toast.error('Failed to create lease');
      }
    } catch (error) {
      console.error('Error creating lease:', error);
      toast.error(error.response?.data?.error || 'Failed to create lease');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Lease from Approved Application</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Step 1: Select Approved Applicant */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Step 1: Select Approved Applicant
            </h3>
            
            {applicantsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading approved applicants...</p>
              </div>
            ) : approvedApplicants.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No approved applicants found</p>
                <p className="text-sm text-gray-400 mt-1">Please approve some applications first</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {approvedApplicants.map((applicant) => (
                  <div
                    key={applicant.id}
                    onClick={() => setSelectedApplicant(applicant)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedApplicant?.id === applicant.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {applicant.first_name} {applicant.last_name}
                        </h4>
                        <p className="text-sm text-gray-600">{applicant.email}</p>
                        <p className="text-sm text-gray-600">{applicant.phone}</p>
                        {applicant.property && (
                          <p className="text-sm text-blue-600 mt-1">
                            Applied for: {applicant.property.title}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Approved
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Lease Details */}
          {selectedApplicant && (
            <div className="space-y-4">
              {/* Property Information */}
              {selectedApplicant.property && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Selected Property</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-900">{selectedApplicant.property.title}</p>
                      <p className="text-sm text-blue-700">
                        {selectedApplicant.property.address}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-blue-900">
                        ${selectedApplicant.property.monthly_rent?.toLocaleString() || 'N/A'}/month
                      </p>
                      <p className="text-xs text-blue-600">Monthly Rent</p>
                    </div>
                  </div>
                </div>
              )}

              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Step 2: Lease Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lease Start Date *
                  </label>
                  <input
                    type="date"
                    {...register('lease_start_date', { required: 'Lease start date is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.lease_start_date && (
                    <p className="text-red-500 text-sm mt-1">{errors.lease_start_date.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lease End Date *
                  </label>
                  <input
                    type="date"
                    {...register('lease_end_date', { required: 'Lease end date is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.lease_end_date && (
                    <p className="text-red-500 text-sm mt-1">{errors.lease_end_date.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rent Payment Day *
                  </label>
                  <select
                    {...register('rent_payment_day', { required: 'Rent payment day is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select day</option>
                    {Array.from({ length: 31 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}st of each month
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Select the day of each month when rent payment is due</p>
                  {errors.rent_payment_day && (
                    <p className="text-red-500 text-sm mt-1">{errors.rent_payment_day.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Rent
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={selectedApplicant?.property?.monthly_rent ? `$${selectedApplicant.property.monthly_rent.toLocaleString()}/month` : 'N/A'}
                      readOnly
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedApplicant?.property?.monthly_rent ? 'Rent amount is set by the property\'s listing' : 'No rent amount set for this property'}
                  </p>
                </div>

                {/* Prorated Rent Section */}
                <div className="md:col-span-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 shadow-sm">
                    <h4 className="text-lg font-semibold text-blue-900 mb-4">Prorated Rent Calculation</h4>
                    
                    {calculatingProration && (
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-gray-600">Calculating prorated rent...</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCalculatingProration(false);
                            setProrationError('Calculation cancelled');
                          }}
                          className="text-xs text-red-600 hover:text-red-800 underline"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {prorationError && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-red-600">❌ {prorationError}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const [leaseStartDate, rentPaymentDay] = watchedValues;
                            if (leaseStartDate && rentPaymentDay && selectedApplicant?.property) {
                              calculateProratedRent(selectedApplicant.property.id, leaseStartDate, rentPaymentDay);
                            }
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          Try again
                        </button>
                      </div>
                    )}

                    {proratedRent && !calculatingProration && (
                      <>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          {/* First Month Amount */}
                          <div className="text-center">
                            <p className="text-sm text-gray-700 mb-1">First Month Amount</p>
                            <p className="text-2xl font-bold text-blue-600">${proratedRent.amount.toFixed(0)}</p>
                            <p className="text-xs text-gray-500">Instead of ${proratedRent.monthlyRent.toFixed(0)}</p>
                          </div>

                          {/* You Save */}
                          <div className="text-center">
                            <p className="text-sm text-gray-700 mb-1">You Save</p>
                            <p className="text-2xl font-bold text-green-600">${(proratedRent.monthlyRent - proratedRent.amount).toFixed(2)}</p>
                            <p className="text-xs text-gray-500">For partial month</p>
                          </div>

                          {/* Days Prorated */}
                          <div className="text-center">
                            <p className="text-sm text-gray-700 mb-1">Days Prorated</p>
                            <p className="text-2xl font-bold text-gray-800">{proratedRent.daysRemaining} days</p>
                            <p className="text-xs text-gray-500">Out of {proratedRent.totalDaysInMonth} days</p>
                          </div>

                          {/* Daily Rate */}
                          <div className="text-center">
                            <p className="text-sm text-gray-700 mb-1">Daily Rate</p>
                            <p className="text-2xl font-bold text-gray-800">${(proratedRent.monthlyRent / proratedRent.totalDaysInMonth).toFixed(0)}/day</p>
                            <p className="text-xs text-gray-500">Next full payment: {(() => {
                              const startDate = new Date(proratedRent.startDate);
                              const nextMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
                              return nextMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            })()}</p>
                          </div>
                        </div>

                        <div className="bg-blue-100 rounded-md p-3">
                          <p className="text-sm text-blue-800 text-center">
                            Calculation: Prorated for {proratedRent.daysRemaining} days at ${(proratedRent.monthlyRent / proratedRent.totalDaysInMonth).toFixed(0)}/day
                          </p>
                        </div>
                      </>
                    )}

                    {!proratedRent && !calculatingProration && !prorationError && (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500 mb-4">
                          Enter lease start date and rent payment day to calculate prorated rent
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const [leaseStartDate, rentPaymentDay] = watchedValues;
                            if (leaseStartDate && rentPaymentDay && selectedApplicant?.property) {
                              calculateProratedRent(selectedApplicant.property.id, leaseStartDate, rentPaymentDay);
                            } else {
                              toast.error('Please fill in lease start date and rent payment day first');
                            }
                          }}
                          className="bg-blue-100 text-blue-700 px-6 py-2 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
                        >
                          Calculate Prorated Rent
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedApplicant}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Assign Tenant to Property
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLeaseModal;
