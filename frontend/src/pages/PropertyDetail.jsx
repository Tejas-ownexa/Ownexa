import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../utils/axios';
import { invalidatePropertyAndRelatedCaches } from '../utils/cacheUtils';
import { MapPin, DollarSign, Calendar, User, Heart, Share2, Home, Edit, X, Building2, TrendingUp, CreditCard, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';

const PropertyDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [activeImage, setActiveImage] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  const { data: property, isLoading, error } = useQuery(
    ['property', id],
    async () => {
      const response = await api.get(`/api/properties/${id}`);
      return response.data;
    }
  );

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatAddress = (property) => {
    // Handle both old and new property data structures
    let street1, street2, apt, city, state, zip;
    
    if (property.address) {
      // New structure with nested address object
      street1 = property.address.street_1;
      street2 = property.address.street_2;
      apt = property.address.apt;
      city = property.address.city;
      state = property.address.state;
      zip = property.address.zip;
    } else {
      // Old structure with direct fields
      street1 = property.street_address_1;
      street2 = property.street_address_2;
      apt = property.apt_number;
      city = property.city;
      state = property.state;
      zip = property.zip_code;
    }
    
    const parts = [street1, street2, apt, city, state, zip].filter(Boolean);
    return parts.join(', ');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'rented':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 dark:text-yellow-200';
      case 'unavailable':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Function to get the full image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http')) return imageUrl;
    // Otherwise, construct the full URL from the backend
    return `http://localhost:5000/uploads/${imageUrl}`;
  };

  const handleFavorite = async () => {
    try {
      await api.post(`/api/properties/${id}/favorite`);
      toast.success('Added to favorites!');
    } catch (error) {
      toast.error('Failed to add to favorites');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: property.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  // Edit functionality
  const handleEditClick = () => {
    if (property) {
      setEditFormData({
        title: property.title,
        description: property.description,
        rent_amount: property.rent_amount,
        status: property.status,
        case_number: property.case_number || '',
        folio: property.folio || '',
        street_address_1: property.address?.street_1 || property.street_address_1,
        street_address_2: property.address?.street_2 || property.street_address_2,
        apt_number: property.address?.apt || property.apt_number,
        city: property.address?.city || property.city,
        state: property.address?.state || property.state,
        zip_code: property.address?.zip || property.zip_code
      });
      setIsEditModalOpen(true);
    }
  };

  const handleInputChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updatePropertyMutation = useMutation(
    async (data) => {
      const response = await api.put(`/api/properties/${id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        // Invalidate all property-related queries to ensure data consistency
        invalidatePropertyAndRelatedCaches(queryClient, id);
        
        toast.success('Property updated successfully');
        setIsEditModalOpen(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update property');
      }
    }
  );

  const handleSave = () => {
    updatePropertyMutation.mutate(editFormData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading property details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 dark:text-red-400">
        Error loading property: {error.message}
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center">
        <div className="text-lg">Property not found</div>
      </div>
    );
  }

  const imageUrl = getImageUrl(property.image_url);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{property.title}</h1>
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{formatAddress(property)}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleEditClick}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            title="Edit Property"
          >
            <Edit className="h-5 w-5" />
          </button>
          <button
            onClick={handleFavorite}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 transition-colors"
          >
            <Heart className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={handleShare}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 transition-colors"
          >
            <Share2 className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Property Image */}
      <div className="bg-gray-200 rounded-lg h-96 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={property.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              if (e.target && e.target.style) {
                e.target.style.display = 'none';
              }
              if (e.target && e.target.nextSibling && e.target.nextSibling.style) {
                e.target.nextSibling.style.display = 'flex';
              }
            }}
          />
        ) : null}
        
        {/* Fallback when no image or image fails to load */}
        <div className={`w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 ${imageUrl ? 'hidden' : 'flex'}`}>
          <div className="text-center">
            <Home className="h-24 w-24 mx-auto mb-4 text-gray-300" />
            <span className="text-lg">No Image Available</span>
          </div>
        </div>
      </div>

      {/* Property Info Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Price and Status */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-600 to-gray-600 px-6 py-4">
              <div className="flex items-center">
                <div className="bg-white dark:bg-gray-800/20 p-2 rounded-lg mr-3">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Property Overview</h3>
              </div>
            </div>
            
            <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <div className="text-3xl font-bold text-slate-700">
                {formatPrice(property.rent_amount)}
                  <span className="text-lg text-gray-600 dark:text-gray-300">/month</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(property.status)}`}>
                {getStatusText(property.status)}
              </span>
            </div>

            {/* Property Description */}
              <div className="bg-white dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                <div className="flex items-center mb-2">
                  <div className="w-2 h-2 bg-slate-500 rounded-full mr-2"></div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">Property Description</p>
                </div>
                <p className="text-gray-900 dark:text-white font-medium text-sm">{property.description || 'No description available'}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl shadow-lg border border-indigo-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
              <div className="flex items-center">
                <div className="bg-white dark:bg-gray-800/20 p-2 rounded-lg mr-3">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Description</h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-white dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                <p className="text-gray-900 dark:text-white leading-relaxed">{property.description || 'No description available'}</p>
              </div>
          </div>
        </div>

          {/* Property Details - Horizontal Layout */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-lg border border-purple-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
              <div className="flex items-center">
                <div className="bg-white dark:bg-gray-800/20 p-2 rounded-lg mr-3">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Property Details</h3>
                </div>
              </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 hover:bg-white dark:bg-gray-800/80 transition-all duration-200">
                  <div className="flex items-center mb-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">Address</p>
                  </div>
                  <p className="text-gray-900 dark:text-white font-medium text-sm leading-relaxed">
                    {formatAddress(property)}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 hover:bg-white dark:bg-gray-800/80 transition-all duration-200">
                  <div className="flex items-center mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">Monthly Rent</p>
                  </div>
                  <p className="text-green-600 dark:text-green-400 font-bold text-lg">{formatPrice(property.rent_amount)}</p>
                </div>

                <div className="bg-white dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 hover:bg-white dark:bg-gray-800/80 transition-all duration-200">
                  <div className="flex items-center mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">Status</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
                    {getStatusText(property.status)}
                  </span>
                </div>

                <div className="bg-white dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 hover:bg-white dark:bg-gray-800/80 transition-all duration-200">
                  <div className="flex items-center mb-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">Added</p>
                  </div>
                  <p className="text-gray-900 dark:text-white font-medium text-sm">
                    {property.created_at ? new Date(property.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 hover:bg-white dark:bg-gray-800/80 transition-all duration-200">
                  <div className="flex items-center mb-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">Updated</p>
                  </div>
                  <p className="text-gray-900 dark:text-white font-medium text-sm">
                    {property.updated_at ? new Date(property.updated_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                {property.case_number && (
                  <div className="bg-white dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 hover:bg-white dark:bg-gray-800/80 transition-all duration-200">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">Case Number</p>
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium text-sm">{property.case_number}</p>
                  </div>
                )}

                {property.folio && (
                  <div className="bg-white dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 hover:bg-white dark:bg-gray-800/80 transition-all duration-200">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">Folio</p>
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium text-sm">{property.folio}</p>
                </div>
              )}
              </div>
             </div>
           </div>

           {/* Financial Information */}
           {property.financial_details && (
             <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-lg border border-green-100 overflow-hidden">
               <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                 <div className="flex items-center">
                   <div className="bg-white dark:bg-gray-800/20 p-2 rounded-lg mr-3">
                     <TrendingUp className="h-5 w-5 text-white" />
                   </div>
                   <h3 className="text-lg font-semibold text-white">Financial Information</h3>
                 </div>
               </div>
               
               <div className="p-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                   {/* Property Value */}
                   <div className="bg-white dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 hover:bg-white dark:bg-gray-800/80 transition-all duration-200">
                     <div className="flex items-center mb-2">
                       <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                       <p className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">Total Value</p>
                     </div>
                     <p className="text-green-600 dark:text-green-400 font-bold text-lg">
                       {property.financial_details.total_value ? `$${property.financial_details.total_value.toLocaleString()}` : 'N/A'}
                     </p>
                   </div>

                   {/* Purchase Price */}
                   <div className="bg-white dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 hover:bg-white dark:bg-gray-800/80 transition-all duration-200">
                     <div className="flex items-center mb-2">
                       <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                       <p className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">Purchase Price</p>
                     </div>
                     <p className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                       {property.financial_details.purchase_price ? `$${property.financial_details.purchase_price.toLocaleString()}` : 'N/A'}
                     </p>
                   </div>

                   {/* Purchase Date */}
                   <div className="bg-white dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 hover:bg-white dark:bg-gray-800/80 transition-all duration-200">
                     <div className="flex items-center mb-2">
                       <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                       <p className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">Purchase Date</p>
                     </div>
                     <p className="text-gray-900 dark:text-white font-medium text-sm">
                       {property.financial_details.purchase_date ? new Date(property.financial_details.purchase_date).toLocaleDateString() : 'N/A'}
                     </p>
                   </div>

                   {/* Down Payment */}
                   <div className="bg-white dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 hover:bg-white dark:bg-gray-800/80 transition-all duration-200">
                     <div className="flex items-center mb-2">
                       <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                       <p className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">Down Payment</p>
                     </div>
                     <p className="text-orange-600 dark:text-orange-400 font-bold text-lg">
                       {property.financial_details.down_payment ? `$${property.financial_details.down_payment.toLocaleString()}` : 'N/A'}
                     </p>
                   </div>

                   {/* Mortgage Amount */}
                   <div className="bg-white dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 hover:bg-white dark:bg-gray-800/80 transition-all duration-200">
                     <div className="flex items-center mb-2">
                       <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                       <p className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">Mortgage Amount</p>
                     </div>
                     <p className="text-red-600 dark:text-red-400 font-bold text-lg">
                       {property.financial_details.mortgage_amount ? `$${property.financial_details.mortgage_amount.toLocaleString()}` : 'N/A'}
                     </p>
                   </div>

                   {/* Monthly Loan Payment */}
                   <div className="bg-white dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 hover:bg-white dark:bg-gray-800/80 transition-all duration-200">
                     <div className="flex items-center mb-2">
                       <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                       <p className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">Monthly Payment</p>
                     </div>
                     <p className="text-indigo-600 font-bold text-lg">
                       {property.financial_details.monthly_loan_payment ? `$${property.financial_details.monthly_loan_payment.toLocaleString()}` : 'N/A'}
                     </p>
                   </div>

                   {/* APR */}
                   <div className="bg-white dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 hover:bg-white dark:bg-gray-800/80 transition-all duration-200">
                     <div className="flex items-center mb-2">
                       <div className="w-2 h-2 bg-teal-500 rounded-full mr-2"></div>
                       <p className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">Interest Rate</p>
                     </div>
                     <p className="text-teal-600 font-bold text-lg">
                       {property.financial_details.current_apr ? `${property.financial_details.current_apr}%` : 'N/A'}
                     </p>
                   </div>

                   {/* Loan Term */}
                   <div className="bg-white dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 hover:bg-white dark:bg-gray-800/80 transition-all duration-200">
                     <div className="flex items-center mb-2">
                       <div className="w-2 h-2 bg-pink-500 rounded-full mr-2"></div>
                       <p className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">Loan Term</p>
                     </div>
                     <p className="text-pink-600 font-bold text-lg">
                       {property.financial_details.loan_term_years ? `${property.financial_details.loan_term_years} years` : 'N/A'}
                     </p>
            </div>
          </div>

                 {/* Monthly Expenses Breakdown */}
                 <div className="bg-white dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-white/50 mb-4">
                   <div className="flex items-center mb-3">
                     <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg mr-3">
                       <Calculator className="h-4 w-4 text-green-600 dark:text-green-400" />
                     </div>
                     <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Expenses Breakdown</p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <div className="flex justify-between text-sm">
                         <span className="text-gray-600 dark:text-gray-300">Mortgage Payment:</span>
                         <span className="font-medium">
                           {property.financial_details.monthly_loan_payment ? `$${property.financial_details.monthly_loan_payment.toLocaleString()}` : '$0'}
                         </span>
                       </div>
                       <div className="flex justify-between text-sm">
                         <span className="text-gray-600 dark:text-gray-300">Property Tax:</span>
                         <span className="font-medium">
                           {property.financial_details.property_tax_annual ? `$${(property.financial_details.property_tax_annual / 12).toLocaleString()}` : '$0'}
                </span>
              </div>
                       <div className="flex justify-between text-sm">
                         <span className="text-gray-600 dark:text-gray-300">Insurance:</span>
                         <span className="font-medium">
                           {property.financial_details.insurance_annual ? `$${(property.financial_details.insurance_annual / 12).toLocaleString()}` : '$0'}
                         </span>
              </div>
              </div>
                     <div className="space-y-2">
                       <div className="flex justify-between text-sm">
                         <span className="text-gray-600 dark:text-gray-300">HOA Fees:</span>
                <span className="font-medium">
                           {property.financial_details.hoa_fees_monthly ? `$${property.financial_details.hoa_fees_monthly.toLocaleString()}` : '$0'}
                </span>
              </div>
                       <div className="flex justify-between text-sm">
                         <span className="text-gray-600 dark:text-gray-300">Maintenance Reserve:</span>
                <span className="font-medium">
                           {property.financial_details.maintenance_reserve_monthly ? `$${property.financial_details.maintenance_reserve_monthly.toLocaleString()}` : '$0'}
                         </span>
                       </div>
                       <div className="flex justify-between text-sm font-semibold border-t pt-2">
                         <span className="text-gray-700 dark:text-gray-300">Total Monthly Expenses:</span>
                         <span className="text-red-600 dark:text-red-400">
                           {property.financial_details.total_monthly_expenses ? `$${property.financial_details.total_monthly_expenses.toLocaleString()}` : '$0'}
                </span>
              </div>
                     </div>
                   </div>
                 </div>

                 {/* Cash Flow and ROI */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="bg-white dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                     <div className="flex items-center mb-3">
                       <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg mr-3">
                         <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                       </div>
                       <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Cash Flow</p>
                     </div>
                     <p className={`text-2xl font-bold ${property.financial_details.monthly_cash_flow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                       {property.financial_details.monthly_cash_flow ? `$${property.financial_details.monthly_cash_flow.toLocaleString()}` : '$0'}
                     </p>
                     <p className="text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 mt-1">
                       Rent: ${property.rent_amount ? property.rent_amount.toLocaleString() : '0'} - Expenses: ${property.financial_details.total_monthly_expenses ? property.financial_details.total_monthly_expenses.toLocaleString() : '0'}
                     </p>
                   </div>

                   <div className="bg-white dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                     <div className="flex items-center mb-3">
                       <div className="bg-purple-100 p-2 rounded-lg mr-3">
                         <TrendingUp className="h-4 w-4 text-purple-600" />
                       </div>
                       <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Return on Investment</p>
                     </div>
                     <p className={`text-2xl font-bold ${property.financial_details.roi_percentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                       {property.financial_details.roi_percentage ? `${property.financial_details.roi_percentage}%` : '0%'}
                     </p>
                     <p className="text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 mt-1">
                       Annual cash flow / Down payment
                     </p>
                   </div>
                 </div>
               </div>
             </div>
           )}
         </div>

         {/* Sidebar */}
        <div className="space-y-6">
          {/* Association Details */}
          {property.association_assignment && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <div className="flex items-center">
                  <div className="bg-white dark:bg-gray-800/20 p-2 rounded-lg mr-3">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Association Details</h3>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4 mb-6">
                  <div className="bg-white dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 hover:bg-white dark:bg-gray-800/80 transition-all duration-200">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">Association</p>
                    </div>
                    <p className="text-gray-900 dark:text-white font-semibold text-sm">{property.association_assignment.association?.name || 'N/A'}</p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 hover:bg-white dark:bg-gray-800/80 transition-all duration-200">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">HOA Fees</p>
                    </div>
                    <p className="text-gray-900 dark:text-white font-semibold text-sm">
                      {property.association_assignment.hoa_fees ? (
                        <span className="text-green-600 dark:text-green-400">${property.association_assignment.hoa_fees}/month</span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">Not specified</span>
                      )}
                    </p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 hover:bg-white dark:bg-gray-800/80 transition-all duration-200">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">Special Assessment</p>
                    </div>
                    <p className="text-gray-900 dark:text-white font-semibold text-sm">
                      {property.association_assignment.special_assessment ? (
                        <span className="text-orange-600 dark:text-orange-400">${property.association_assignment.special_assessment}</span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">Not specified</span>
                      )}
                    </p>
                  </div>
                </div>

                {(property.association_assignment.shipping_address?.street_1 || property.association_assignment.shipping_address?.city) && (
                  <div className="bg-white dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                    <div className="flex items-center mb-3">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg mr-3">
                        <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Shipping Address for Payments</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 border border-white/30">
                      <p className="text-gray-900 dark:text-white text-sm leading-relaxed">
                        {property.association_assignment.shipping_address.street_1}
                        {property.association_assignment.shipping_address.street_2 && `, ${property.association_assignment.shipping_address.street_2}`}
                        {property.association_assignment.shipping_address.city && (
                          <>
                            <br />
                            {property.association_assignment.shipping_address.city}
                            {property.association_assignment.shipping_address.state && `, ${property.association_assignment.shipping_address.state}`}
                            {property.association_assignment.shipping_address.zip && ` ${property.association_assignment.shipping_address.zip}`}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
                </div>
              )}

          {/* Contact Info */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl shadow-lg border border-emerald-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
              <div className="flex items-center">
                <div className="bg-white dark:bg-gray-800/20 p-2 rounded-lg mr-3">
                  <User className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Contact Information</h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-white dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                <div className="flex items-center mb-3">
                  <div className="bg-emerald-100 p-2 rounded-lg mr-3">
                    <User className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{property.rental_owner?.company_name || property.created_by_user?.full_name || 'Owner Name'}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{property.rental_owner?.contact_email || property.created_by_user?.email || 'owner@email.com'}</div>
                  </div>
                </div>
                {property.rental_owner?.contact_phone && (
                  <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 border border-white/30">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Phone: {property.rental_owner.contact_phone}</span>
                    </div>
                </div>
              )}
            </div>
          </div>
          </div>


          {/* Listing Information */}
          {property.listing && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl shadow-lg border border-amber-100 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4">
                <div className="flex items-center">
                  <div className="bg-white dark:bg-gray-800/20 p-2 rounded-lg mr-3">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Listing Information</h3>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  <div className="bg-white dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 hover:bg-white dark:bg-gray-800/80 transition-all duration-200">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">Listing Date</p>
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium text-sm">
                    {property.listing.listing_date ? new Date(property.listing.listing_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 hover:bg-white dark:bg-gray-800/80 transition-all duration-200">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">Listing Status</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {property.listing.status || 'N/A'}
                  </span>
                </div>

                  <div className="bg-white dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 hover:bg-white dark:bg-gray-800/80 transition-all duration-200">
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">Listed Price</p>
                </div>
                    <p className="text-green-600 dark:text-green-400 font-bold text-lg">
                    {property.listing.rent_price ? formatPrice(property.listing.rent_price) : 'N/A'}
                    </p>
                </div>

                {property.listing.notes && (
                    <div className="bg-white dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                      <div className="flex items-center mb-3">
                        <div className="bg-amber-100 p-2 rounded-lg mr-3">
                          <DollarSign className="h-4 w-4 text-amber-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Listing Notes</p>
                  </div>
                      <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 border border-white/30">
                        <p className="text-gray-900 dark:text-white text-sm leading-relaxed">{property.listing.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Property Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Property</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Basic Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Property Title *
                </label>
                <input
                  type="text"
                  value={editFormData.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monthly Rent *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.rent_amount || ''}
                  onChange={(e) => handleInputChange('rent_amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status *
                </label>
                <select
                  value={editFormData.status || ''}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="available">Available</option>
                  <option value="rented">Rented</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>

              {/* Case Number and Folio */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Case Number
                  </label>
                  <input
                    type="text"
                    value={editFormData.case_number || ''}
                    onChange={(e) => handleInputChange('case_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter case number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Folio
                  </label>
                  <input
                    type="text"
                    value={editFormData.folio || ''}
                    onChange={(e) => handleInputChange('folio', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter folio"
                  />
                </div>
              </div>

              {/* Address Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Street Address 1 *
                </label>
                <input
                  type="text"
                  value={editFormData.street_address_1 || ''}
                  onChange={(e) => handleInputChange('street_address_1', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Street Address 2
                </label>
                <input
                  type="text"
                  value={editFormData.street_address_2 || ''}
                  onChange={(e) => handleInputChange('street_address_2', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Apartment/Unit Number
                </label>
                <input
                  type="text"
                  value={editFormData.apt_number || ''}
                  onChange={(e) => handleInputChange('apt_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={editFormData.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    value={editFormData.state || ''}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    value={editFormData.zip_code || ''}
                    onChange={(e) => handleInputChange('zip_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={editFormData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updatePropertyMutation.isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {updatePropertyMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetail; 