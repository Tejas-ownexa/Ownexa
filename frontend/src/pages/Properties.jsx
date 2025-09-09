import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import { Search, Filter, MapPin, DollarSign, Plus } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import toast from 'react-hot-toast';

const Properties = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: '',
    min_price: '',
    max_price: '',
    status: '',
    city: '',
    state: '',
  });

  const { data: properties, isLoading, error } = useQuery(
    ['properties', filters],
    async () => {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      const response = await api.get('/api/properties/', { params });
      return response.data;
    }
  );

  // Delete property handler
  const handleDeleteProperty = async (propertyId) => {
    console.log('🗑️ Delete requested for property ID:', propertyId);
    console.log('🔍 Current auth token:', localStorage.getItem('token') ? 'Present' : 'Missing');
    console.log('🔍 API base URL:', api.defaults.baseURL);
    
    if (window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      try {
        console.log('🔗 Making API call to delete property...');
        console.log('🔗 Request URL:', `${api.defaults.baseURL}/api/properties/${propertyId}`);
        
        const response = await api.delete(`/api/properties/${propertyId}`);
        console.log('✅ Delete response status:', response.status);
        console.log('✅ Delete response data:', response.data);
        
        toast.success('Property deleted successfully!');
        // Refresh the properties list
        queryClient.invalidateQueries(['properties']);
      } catch (error) {
        console.error('❌ Delete error full object:', error);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error response status:', error.response?.status);
        console.error('❌ Error response data:', error.response?.data);
        console.error('❌ Error request:', error.request);
        
        let errorMessage = 'Failed to delete property. Please try again.';
        
        if (error.response) {
          // Server responded with error status
          errorMessage = error.response.data?.error || `Server error: ${error.response.status}`;
          console.log('📊 Server responded with error:', error.response.status);
        } else if (error.request) {
          // Request was made but no response received
          errorMessage = 'Network error: Could not connect to server';
          console.log('📊 Network error - no response received');
        } else {
          // Something else happened
          errorMessage = `Request error: ${error.message}`;
          console.log('📊 Request setup error:', error.message);
        }
        
        toast.error(errorMessage);
      }
    } else {
      console.log('🚫 Delete cancelled by user');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      min_price: '',
      max_price: '',
      status: '',
      city: '',
      state: '',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading properties...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Error loading properties: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Properties</h1>
          <p className="text-gray-600">Manage and browse your property portfolio</p>
        </div>
        <Link
          to="/add-property"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Add Property
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search properties..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Rent Range */}
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min Rent"
              value={filters.min_price}
              onChange={(e) => handleFilterChange('min_price', e.target.value)}
              className="input-field"
            />
            <input
              type="number"
              placeholder="Max Rent"
              value={filters.max_price}
              onChange={(e) => handleFilterChange('max_price', e.target.value)}
              className="input-field"
            />
          </div>

          {/* Status */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="input-field"
            >
              <option value="">Any Status</option>
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Maintenance</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
        </div>

        {/* Location Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <input
            type="text"
            placeholder="City"
            value={filters.city}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            className="input-field"
          />
          <input
            type="text"
            placeholder="State"
            value={filters.state}
            onChange={(e) => handleFilterChange('state', e.target.value)}
            className="input-field"
          />
        </div>

        {/* Clear Filters */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={clearFilters}
            className="btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {properties?.length || 0} Properties Found
        </h2>
      </div>

      {/* Property Grid */}
      {properties && properties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard 
              key={property.id} 
              property={property} 
              onDelete={handleDeleteProperty}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
          <p className="text-gray-600 mb-6">Get started by adding your first property to your portfolio</p>
          <Link
            to="/add-property"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Add Your First Property
          </Link>
        </div>
      )}
    </div>
  );
};

export default Properties; 