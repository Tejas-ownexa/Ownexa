import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import { User, Mail, Lock, Phone, MapPin, Building, Users, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('');
  const [vendorTypes, setVendorTypes] = useState([]);
  const [isLoadingVendorTypes, setIsLoadingVendorTypes] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm();

  const registerMutation = useMutation(
    async (data) => {
      const response = await api.post('/api/auth/register', data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success('Registration successful! You can now log in.');
        navigate('/login');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Registration failed');
      },
    }
  );

  const fetchVendorTypes = async () => {
    try {
      setIsLoadingVendorTypes(true);
      const response = await api.get('/api/vendors/types');
      setVendorTypes(response.data);
    } catch (error) {
      console.error('Error fetching vendor types:', error);
    } finally {
      setIsLoadingVendorTypes(false);
    }
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setValue('role', role);
    
    if (role === 'VENDOR') {
      fetchVendorTypes();
    }
  };

  const onSubmit = async (data) => {
    if (!data.role) {
      toast.error('Please select an account type');
      return;
    }

    if (data.role === 'VENDOR' && !data.vendor_type) {
      toast.error('Please select a vendor type');
      return;
    }

    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
          Or{' '}
          <Link to="/login" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Account Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Account Type
              </label>
              <select
                {...register('role', { required: 'Account type is required' })}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select account type</option>
                <option value="OWNER">Property Owner</option>
                <option value="TENANT">Tenant</option>
                <option value="AGENT">Property Agent</option>
                <option value="VENDOR">Vendor</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.role.message}</p>
              )}
            </div>

            {/* Vendor Type Selection (only show if vendor is selected) */}
            {selectedRole === 'VENDOR' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Vendor Type
                </label>
                <select
                  {...register('vendor_type', { required: 'Vendor type is required' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoadingVendorTypes}
                >
                  <option value="">Select vendor type</option>
                  {vendorTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.vendor_type && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.vendor_type.message}</p>
                )}
              </div>
            )}

<<<<<<< HEAD
            {/* First Name and Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <div className="mt-1 relative">
                  <input
                    id="first_name"
                    type="text"
                    {...register('first_name', { required: 'First name is required' })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 pl-10"
                    placeholder="Enter your first name"
                  />
                  <User className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <div className="mt-1 relative">
                  <input
                    id="last_name"
                    type="text"
                    {...register('last_name', { required: 'Last name is required' })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 pl-10"
                    placeholder="Enter your last name"
                  />
                  <User className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                )}
              </div>
=======
            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <div className="mt-1 relative">
                <input
                  id="full_name"
                  type="text"
                  {...register('full_name', { required: 'Full name is required' })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 pl-10"
                  placeholder="Enter your full name"
                />
                <User className="h-5 w-5 text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 absolute left-3 top-2.5" />
              </div>
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.full_name.message}</p>
              )}
>>>>>>> 9010d28ffdbe7d520a9135b06ed90726c286e44f
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Username
              </label>
              <div className="mt-1 relative">
                <input
                  id="username"
                  type="text"
                  {...register('username', { required: 'Username is required' })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 pl-10"
                  placeholder="Choose a username"
                />
                <User className="h-5 w-5 text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 absolute left-3 top-2.5" />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 pl-10"
                  placeholder="Enter your email"
                />
                <Mail className="h-5 w-5 text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 absolute left-3 top-2.5" />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <div className="mt-1 relative">
                <input
                  id="phone_number"
                  type="tel"
                  {...register('phone_number', { required: 'Phone number is required' })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 pl-10"
                  placeholder="Enter your phone number"
                />
                <Phone className="h-5 w-5 text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 absolute left-3 top-2.5" />
              </div>
              {errors.phone_number && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone_number.message}</p>
              )}
            </div>

            {/* Address Fields */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="street_address_1" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Street Address
                </label>
                <div className="mt-1 relative">
                  <input
                    id="street_address_1"
                    type="text"
                    {...register('street_address_1', { required: 'Street address is required' })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 pl-10"
                    placeholder="Enter street address"
                  />
                  <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 absolute left-3 top-2.5" />
                </div>
                {errors.street_address_1 && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.street_address_1.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    {...register('city', { required: 'City is required' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="City"
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    State
                  </label>
                  <input
                    id="state"
                    type="text"
                    {...register('state', { required: 'State is required' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="State"
                  />
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.state.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ZIP Code
                </label>
                <input
                  id="zip_code"
                  type="text"
                  {...register('zip_code', { required: 'ZIP code is required' })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ZIP Code"
                />
                {errors.zip_code && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.zip_code.message}</p>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type="password"
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 pl-10"
                  placeholder="Create a password"
                />
                <Lock className="h-5 w-5 text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 absolute left-3 top-2.5" />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirm_password"
                  type="password"
                  {...register('confirm_password', { 
                    required: 'Please confirm your password',
                    validate: value => value === watch('password') || 'Passwords do not match'
                  })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 pl-10"
                  placeholder="Confirm your password"
                />
                <Lock className="h-5 w-5 text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 absolute left-3 top-2.5" />
              </div>
              {errors.confirm_password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirm_password.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={registerMutation.isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {registerMutation.isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register; 