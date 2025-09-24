import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../utils/axios';
import { MapPin, DollarSign, Calendar, User, Heart, Share2, Home, Edit, X } from 'lucide-react';
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
        return 'bg-green-100 text-green-800';
      case 'rented':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'unavailable':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        queryClient.invalidateQueries(['property', id]);
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
      <div className="text-center text-red-600">
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
          <div className="flex items-center text-gray-600">
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
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Heart className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={handleShare}
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Share2 className="h-5 w-5 text-gray-600" />
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
        <div className={`w-full h-full flex items-center justify-center text-gray-400 ${imageUrl ? 'hidden' : 'flex'}`}>
          <div className="text-center">
            <Home className="h-24 w-24 mx-auto mb-4 text-gray-300" />
            <span className="text-lg">No Image Available</span>
          </div>
        </div>
      </div>

      {/* Property Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Price and Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="text-3xl font-bold text-primary-600">
                {formatPrice(property.rent_amount)}
                <span className="text-lg text-gray-600">/month</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(property.status)}`}>
                {getStatusText(property.status)}
              </span>
            </div>

            {/* Property Description */}
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-700 mb-2">Property Description</div>
              <div className="text-sm text-gray-600">{property.description || 'No description available'}</div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <p className="text-gray-700 leading-relaxed">{property.description || 'No description available'}</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-600 mr-3" />
                <div>
                  <div className="font-medium">{property.rental_owner?.company_name || property.created_by_user?.full_name || 'Owner Name'}</div>
                  <div className="text-sm text-gray-600">{property.rental_owner?.contact_email || property.created_by_user?.email || 'owner@email.com'}</div>
                </div>
              </div>
              {property.rental_owner?.contact_phone && (
                <div className="text-sm text-gray-600">
                  Phone: {property.rental_owner.contact_phone}
                </div>
              )}
            </div>
          </div>

          {/* Property Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Property Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Address:</span>
                <span className="font-medium text-right max-w-xs">
                  {formatAddress(property)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Rent:</span>
                <span className="font-medium">{formatPrice(property.rent_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium capitalize">{property.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Property Added:</span>
                <span className="font-medium">
                  {property.created_at ? new Date(property.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-medium">
                  {property.updated_at ? new Date(property.updated_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              {property.case_number && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Case Number:</span>
                  <span className="font-medium">{property.case_number}</span>
                </div>
              )}
              {property.folio && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Folio:</span>
                  <span className="font-medium">{property.folio}</span>
                </div>
              )}
            </div>
          </div>

          {/* Listing Information */}
          {property.listing && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Listing Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Listing Date:</span>
                  <span className="font-medium">
                    {property.listing.listing_date ? new Date(property.listing.listing_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Listing Status:</span>
                  <span className="font-medium capitalize">{property.listing.status || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Listed Price:</span>
                  <span className="font-medium">
                    {property.listing.rent_price ? formatPrice(property.listing.rent_price) : 'N/A'}
                  </span>
                </div>
                {property.listing.notes && (
                  <div className="pt-2 border-t">
                    <span className="text-gray-600">Notes:</span>
                    <p className="text-sm text-gray-700 mt-1">{property.listing.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Property Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Edit Property</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Basic Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Title *
                </label>
                <input
                  type="text"
                  value={editFormData.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Rent *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.rent_amount || ''}
                  onChange={(e) => handleInputChange('rent_amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={editFormData.status || ''}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Case Number
                  </label>
                  <input
                    type="text"
                    value={editFormData.case_number || ''}
                    onChange={(e) => handleInputChange('case_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter case number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Folio
                  </label>
                  <input
                    type="text"
                    value={editFormData.folio || ''}
                    onChange={(e) => handleInputChange('folio', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter folio"
                  />
                </div>
              </div>

              {/* Address Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address 1 *
                </label>
                <input
                  type="text"
                  value={editFormData.street_address_1 || ''}
                  onChange={(e) => handleInputChange('street_address_1', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address 2
                </label>
                <input
                  type="text"
                  value={editFormData.street_address_2 || ''}
                  onChange={(e) => handleInputChange('street_address_2', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apartment/Unit Number
                </label>
                <input
                  type="text"
                  value={editFormData.apt_number || ''}
                  onChange={(e) => handleInputChange('apt_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={editFormData.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    value={editFormData.state || ''}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    value={editFormData.zip_code || ''}
                    onChange={(e) => handleInputChange('zip_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={editFormData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
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