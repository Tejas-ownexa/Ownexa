import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../utils/axios';
import { MapPin, DollarSign, Calendar, User, Heart, Share2, Home } from 'lucide-react';
import toast from 'react-hot-toast';

const PropertyDetail = () => {
  const { id } = useParams();
  const [activeImage, setActiveImage] = useState(0);

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
    </div>
  );
};

export default PropertyDetail; 