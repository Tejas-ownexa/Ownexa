import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import { Upload, X, Calculator, DollarSign, Home, CreditCard, Building2 } from 'lucide-react';
import rentalOwnerService from '../services/rentalOwnerService';

const AddProperty = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showFinancialDetails, setShowFinancialDetails] = useState(false);
  const [calculatedPayment, setCalculatedPayment] = useState(null);
  const navigate = useNavigate();

  // Fetch rental owners for dropdown
  const { data: rentalOwners = [], isLoading: ownersLoading } = useQuery(
    ['rental-owners'],
    () => rentalOwnerService.getRentalOwners(),
    {
      onError: (error) => {
        console.error('Error fetching rental owners:', error);
      }
    }
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm();

  // Watch financial fields for calculations
  const mortgageAmount = watch('mortgage_amount');
  const currentApr = watch('current_apr');
  const loanTermYears = watch('loan_term_years');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Calculate monthly mortgage payment
  const calculateMonthlyPayment = () => {
    if (!mortgageAmount || !currentApr || !loanTermYears) {
      setCalculatedPayment(null);
      return;
    }

    const principal = parseFloat(mortgageAmount);
    const monthlyRate = parseFloat(currentApr) / 12 / 100;
    const numPayments = parseInt(loanTermYears) * 12;

    if (monthlyRate > 0) {
      const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
      setCalculatedPayment(payment.toFixed(2));
    } else {
      setCalculatedPayment((principal / numPayments).toFixed(2));
    }
  };

  // Calculate payment when financial fields change
  React.useEffect(() => {
    calculateMonthlyPayment();
  }, [mortgageAmount, currentApr, loanTermYears]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      
      // Add all form data
      Object.keys(data).forEach(key => {
        if (['rent_amount', 'total_value', 'purchase_price', 'mortgage_amount', 'down_payment', 'current_apr', 'property_tax_annual', 'insurance_annual', 'hoa_fees_monthly', 'maintenance_reserve_monthly', 'purchase_price_per_sqft'].includes(key)) {
          formData.append(key, parseFloat(data[key]) || 0);
        } else if (['loan_term_years', 'loan_payment_date'].includes(key)) {
          formData.append(key, parseInt(data[key]) || 0);
        } else {
          formData.append(key, data[key]);
        }
      });
      
      
      // Add image if selected
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      // Create property first
      const propertyResponse = await api.post('/api/properties/add', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const propertyId = propertyResponse.data.property_id;

      // If financial details are provided, create financial record
      if (showFinancialDetails && data.mortgage_amount && data.down_payment) {
        const financialData = {
          total_value: parseFloat(data.total_value) || 0,
          purchase_price: parseFloat(data.purchase_price) || 0,
          purchase_date: data.purchase_date || new Date().toISOString().split('T')[0],
          purchase_price_per_sqft: parseFloat(data.purchase_price_per_sqft) || 0,
          mortgage_amount: parseFloat(data.mortgage_amount),
          down_payment: parseFloat(data.down_payment),
          current_apr: parseFloat(data.current_apr),
          loan_term_years: parseInt(data.loan_term_years) || 30,
          loan_payment_date: parseInt(data.loan_payment_date) || 1,
          property_tax_annual: parseFloat(data.property_tax_annual) || 0,
          insurance_annual: parseFloat(data.insurance_annual) || 0,
          hoa_fees_monthly: parseFloat(data.hoa_fees_monthly) || 0,
          maintenance_reserve_monthly: parseFloat(data.maintenance_reserve_monthly) || 0
        };

        await api.post(`/api/financial/property/${propertyId}/financial`, financialData);
      }

      toast.success('Property added successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error adding property:', error);
      let errorMessage = 'Failed to add property';
      
      if (error.response?.data) {
        if (error.response.data.detail && Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map(err => err.msg).join(', ');
        } else if (error.response.data.detail && typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.detail && typeof error.response.data.detail === 'object') {
          if (error.response.data.detail.msg) {
            errorMessage = error.response.data.detail.msg;
          } else {
            errorMessage = 'Validation error occurred';
          }
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Add New Property</h1>
        <p className="text-gray-600 dark:text-gray-300">Create a new property listing with financial details</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Home className="h-5 w-5 mr-2" />
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Property Title *
              </label>
              <input
                type="text"
                {...register('title', { required: 'Property title is required' })}
                className="input-field"
                placeholder="Enter property title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status *
              </label>
              <select
                {...register('status', { required: 'Status is required' })}
                className="input-field"
              >
                <option value="">Select status</option>
                <option value="available">Available</option>
                <option value="rented">Rented</option>
                <option value="maintenance">Maintenance</option>
                <option value="unavailable">Unavailable</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.status.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Building2 className="h-4 w-4 inline mr-1" />
                Rental Owner *
              </label>
              <select
                {...register('owner_id', { required: 'Rental owner is required' })}
                className="input-field"
                disabled={ownersLoading}
              >
                <option value="">
                  {ownersLoading ? 'Loading rental owners...' : 'Select rental owner'}
                </option>
                {rentalOwners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.company_name} {owner.contact_email && `(${owner.contact_email})`}
                  </option>
                ))}
              </select>
              {errors.owner_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.owner_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Monthly Rent *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('rent_amount', { required: 'Monthly rent is required', min: 0 })}
                className="input-field"
                placeholder="Enter monthly rent amount"
              />
              {errors.rent_amount && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.rent_amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Case Number
              </label>
              <input
                type="text"
                {...register('case_number')}
                className="input-field"
                placeholder="Enter case number (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Folio
              </label>
              <input
                type="text"
                {...register('folio')}
                className="input-field"
                placeholder="Enter folio (optional)"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Address Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Street Address 1 *
              </label>
              <input
                type="text"
                {...register('street_address_1', { required: 'Street address is required' })}
                className="input-field"
                placeholder="Enter street address"
              />
              {errors.street_address_1 && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.street_address_1.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Street Address 2
              </label>
              <input
                type="text"
                {...register('street_address_2')}
                className="input-field"
                placeholder="Apt, Suite, etc. (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Apartment/Unit Number
              </label>
              <input
                type="text"
                {...register('apt_number')}
                className="input-field"
                placeholder="Apt/Unit number (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                City *
              </label>
              <input
                type="text"
                {...register('city', { required: 'City is required' })}
                className="input-field"
                placeholder="Enter city"
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.city.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                State *
              </label>
              <input
                type="text"
                {...register('state', { required: 'State is required' })}
                className="input-field"
                placeholder="Enter state"
              />
              {errors.state && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.state.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ZIP Code *
              </label>
              <input
                type="text"
                {...register('zip_code', { required: 'ZIP code is required' })}
                className="input-field"
                placeholder="Enter ZIP code"
              />
              {errors.zip_code && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.zip_code.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Financial Details Toggle */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Financial Details
            </h2>
            <button
              type="button"
              onClick={() => setShowFinancialDetails(!showFinancialDetails)}
              className="btn-secondary"
            >
              {showFinancialDetails ? 'Hide' : 'Add'} Financial Details
            </button>
          </div>
        </div>

        {/* Financial Details Form */}
        {showFinancialDetails && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Property Financial Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Property Value Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total Property Value
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('total_value')}
                  className="input-field"
                  placeholder="Current market value"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Purchase Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('purchase_price')}
                  className="input-field"
                  placeholder="Original purchase price"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Purchase Date
                </label>
                <input
                  type="date"
                  {...register('purchase_date')}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price per Sq Ft
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('purchase_price_per_sqft')}
                  className="input-field"
                  placeholder="Price per square foot"
                />
              </div>

              {/* Mortgage Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mortgage Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('mortgage_amount', { required: showFinancialDetails ? 'Mortgage amount is required' : false })}
                  className="input-field"
                  placeholder="Total mortgage amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Down Payment *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('down_payment', { required: showFinancialDetails ? 'Down payment is required' : false })}
                  className="input-field"
                  placeholder="Down payment amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current APR (%) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('current_apr', { required: showFinancialDetails ? 'APR is required' : false })}
                  className="input-field"
                  placeholder="e.g., 4.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loan Term (Years)
                </label>
                <select
                  {...register('loan_term_years')}
                  className="input-field"
                >
                  <option value="15">15 Years</option>
                  <option value="20">20 Years</option>
                  <option value="30" selected>30 Years</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Day of Month
                </label>
                <select
                  {...register('loan_payment_date')}
                  className="input-field"
                >
                  {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              {/* Calculated Payment Display */}
              {calculatedPayment && (
                <div className="md:col-span-2 lg:col-span-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                      <span className="font-medium text-blue-900">
                        Calculated Monthly Payment: ${calculatedPayment}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Expenses */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Annual Property Tax
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('property_tax_annual')}
                  className="input-field"
                  placeholder="Annual property tax"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Annual Insurance
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('insurance_annual')}
                  className="input-field"
                  placeholder="Annual insurance cost"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monthly HOA Fees
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('hoa_fees_monthly')}
                  className="input-field"
                  placeholder="Monthly HOA fees"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monthly Maintenance Reserve
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('maintenance_reserve_monthly')}
                  className="input-field"
                  placeholder="Monthly maintenance reserve"
                />
              </div>
            </div>
          </div>
        )}

        {/* Property Image */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Property Image</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload Property Image
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Property preview"
                      className="mx-auto h-64 w-auto rounded-lg shadow-md"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-300">
                      <label
                        htmlFor="image-upload"
                        className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="image-upload"
                          name="image-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">
                      PNG, JPG, GIF, WEBP up to 16MB
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Description</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Property Description *
            </label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              rows="4"
              className="input-field"
              placeholder="Describe the property..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? 'Adding Property...' : 'Add Property'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProperty; 