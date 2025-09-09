import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, DollarSign, Heart, Home, Trash2, MoreHorizontal } from 'lucide-react';
import { useMutation, useQueryClient } from 'react-query';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const PropertyCard = ({ property, isFavorite = false, onDelete }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [favorite, setFavorite] = useState(isFavorite);
  const [showDropdown, setShowDropdown] = useState(false);

  // Update favorite state when prop changes
  useEffect(() => {
    setFavorite(isFavorite);
  }, [isFavorite]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const addToFavoritesMutation = useMutation(
    async (propertyId) => {
      const response = await api.post(`/api/properties/${propertyId}/favorite`);
      return response.data;
    },
    {
      onSuccess: () => {
        setFavorite(true);
        queryClient.invalidateQueries(['user-favorites']);
        toast.success('Added to favorites!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add to favorites');
      }
    }
  );

  const removeFromFavoritesMutation = useMutation(
    async (propertyId) => {
      const response = await api.delete(`/api/properties/${propertyId}/favorite`);
      return response.data;
    },
    {
      onSuccess: () => {
        setFavorite(false);
        queryClient.invalidateQueries(['user-favorites']);
        toast.success('Removed from favorites!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to remove from favorites');
      }
    }
  );

  const handleFavoriteToggle = (e) => {
    e.preventDefault(); // Prevent navigation if this is inside a link
    e.stopPropagation(); // Prevent event bubbling
    
    if (!user) {
      toast.error('Please log in to add favorites');
      return;
    }

    if (favorite) {
      removeFromFavoritesMutation.mutate(property.id);
    } else {
      addToFavoritesMutation.mutate(property.id);
    }
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(false);
    if (onDelete) {
      onDelete(property.id);
    }
  };

  const handleDropdownToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
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
    if (!status) return 'Unknown';
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatAddress = (property) => {
    if (!property) return 'Address not available';
    
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
    
    // Check if we have the minimum required address components
    if (!street1 || !city || !state || !zip) {
      return 'Address not available';
    }
    
    let address = street1;
    if (street2) {
      address += `, ${street2}`;
    }
    if (apt) {
      address += `, Apt ${apt}`;
    }
    address += `, ${city}, ${state} ${zip}`;
    return address;
  };

  // Function to get the full image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http')) return imageUrl;
    // Otherwise, construct the full URL from the backend
    return `http://localhost:5000/uploads/${imageUrl}`;
  };

  const imageUrl = getImageUrl(property.image_url);

  // Debug logging
  console.log('PropertyCard - Property data:', property);
  console.log('PropertyCard - Image URL:', imageUrl);

  return (
    <div className="card hover:shadow-lg transition-shadow duration-300">
      {/* Property Image */}
      <div className="relative h-40 sm:h-48 bg-gray-200 overflow-hidden">
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
            <Home className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <span className="text-sm">No Image Available</span>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
            {getStatusText(property.status)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex space-x-2">
          {/* Favorite Button */}
          <button 
            onClick={handleFavoriteToggle}
            className={`p-2 rounded-full shadow-md transition-colors ${
              favorite 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-white hover:bg-gray-50'
            }`}
            disabled={addToFavoritesMutation.isLoading || removeFromFavoritesMutation.isLoading}
          >
            <Heart className={`h-4 w-4 ${
              favorite ? 'text-white fill-white' : 'text-gray-400'
            }`} />
          </button>

          {/* Options Dropdown */}
          {onDelete && (
            <div className="relative dropdown-container">
              <button 
                onClick={handleDropdownToggle}
                className="p-2 rounded-full bg-white hover:bg-gray-50 shadow-md transition-colors"
              >
                <MoreHorizontal className="h-4 w-4 text-gray-400" />
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    <button
                      onClick={handleDelete}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-3" />
                      Delete Property
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Property Details */}
      <div className="p-3 sm:p-4">
        <div className="mb-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
            {property.title || 'Untitled Property'}
          </h3>
          <div className="flex items-center text-gray-600 text-xs sm:text-sm">
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            <span className="line-clamp-1">{formatAddress(property)}</span>
          </div>
        </div>

        {/* Rent Amount */}
        <div className="mb-3">
          <div className="text-xl sm:text-2xl font-bold text-primary-600">
            {formatPrice(property.rent_amount)}
          </div>
          <span className="text-xs sm:text-sm text-gray-600">/month</span>
        </div>

        {/* Property Description */}
        <div className="mb-4">
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
            {property.description || 'No description available'}
          </p>
        </div>

        {/* View Details Button */}
        <Link
          to={`/properties/${property.id}`}
          className="block w-full text-center btn-primary text-sm sm:text-base py-2 sm:py-2"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default PropertyCard; 