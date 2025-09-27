import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../utils/axios';
import { 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal,
  Edit,
  Download,
  Upload,
  Filter,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

const RentalOwnerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('properties');
  const [statusFilter, setStatusFilter] = useState('active');
  const [sortField, setSortField] = useState('property_name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Fetch all rental owners and find the specific one
  const { data: allOwnersData, isLoading: ownerLoading, error: ownerError } = useQuery(
    ['rental-owners'],
    async () => {
      console.log('Fetching rental owners from API...');
      const response = await api.get('/api/rental-owners/rental-owners');
      console.log('API Response:', response.data);
      return response.data.rental_owners || [];
    },
    {
      onError: (error) => {
        console.error('Error fetching owners:', error);
        console.error('Error response:', error.response?.data);
        toast.error('Failed to load owner data');
      }
    }
  );

  // Find the specific owner and their properties
  const ownerData = allOwnersData?.find(owner => owner.id.toString() === id);
  const propertiesData = ownerData?.properties || [];

  // Fetch vendors for this rental owner
  const { data: vendorsData = [], isLoading: vendorsLoading, error: vendorsError } = useQuery(
    ['vendors', id],
    async () => {
      try {
        const response = await api.get('/api/vendors');
        const allVendors = response.data || [];
        // Filter vendors by rental owner ID
        return allVendors.filter(vendor => 
          vendor.rental_owner && vendor.rental_owner.id.toString() === id
        );
      } catch (error) {
        console.error('Error fetching vendors:', error);
        return [];
      }
    },
    {
      enabled: !!id, // Only run query when we have an ID
      retry: 1
    }
  );

  // Debug logging
  console.log('Looking for owner ID:', id);
  console.log('All owners data:', allOwnersData);
  console.log('Found owner data:', ownerData);

  // Ensure we always have owner data for display (fallback for loading state)
  const displayOwnerData = ownerData || {
    id: id,
    company_name: 'Loading...',
    business_type: '',
    contact_email: '',
    contact_phone: '',
    city: '',
    state: '',
    property_count: 0
  };

  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'financials', label: 'Financials' },
    { id: 'properties', label: `Properties (${propertiesData?.length || 0})` },
    { id: 'vendors', label: 'Vendors' },
    { id: 'communications', label: 'Communications' },
    { id: 'files', label: 'Files' },
    { id: 'notes', label: 'Notes' }
  ];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowDown className="h-4 w-4 text-gray-400 dark:text-gray-500 dark:text-gray-300" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4 text-gray-600 dark:text-gray-300" /> : 
      <ArrowDown className="h-4 w-4 text-gray-600 dark:text-gray-300" />;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  // Show loading state
  if (ownerLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  // Show error state
  if (ownerError || !ownerData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Owner not found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">The rental owner you're looking for doesn't exist.</p>
          <button 
            onClick={() => navigate('/rental-owners')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Rental Owners
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Owner Icon */}
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {getInitials(displayOwnerData.company_name)}
                </span>
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{displayOwnerData.company_name}</h1>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Rental owner</span>
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200">Edit</button>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700">
                Manage properties
              </button>
              
              {/* Navigation Controls */}
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 dark:text-gray-500 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-300">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-400 dark:text-gray-500 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-300">
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-400 dark:text-gray-500 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-300">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-green-500 text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:border-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">
        {activeTab === 'properties' && (
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700">
                  Manage properties
                </button>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900">
                  Record management fees
                </button>
              </div>
            </div>

            {/* Filter and Results */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="all">All</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 dark:text-gray-300 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {ownerLoading ? 'Loading...' : `${propertiesData?.length || 0} matches`}
                </span>
                <button className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:text-gray-200">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Properties Table */}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700"
                      onClick={() => handleSort('property_name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>PROPERTY</span>
                        {getSortIcon('property_name')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      STATUS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      LOCATION
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      OTHER RENTAL OWNERS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      TYPE
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {/* Actions column */}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                  {ownerLoading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400 mr-2"></div>
                          <span className="text-gray-600 dark:text-gray-300">Loading properties...</span>
                        </div>
                      </td>
                    </tr>
                  ) : propertiesData && propertiesData.length > 0 ? (
                    propertiesData.map((property) => (
                      <tr key={property.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {property.title || property.property_name || property.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            property.status === 'active' || property.status === 'occupied' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}>
                            {property.status || 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {property.address ? 
                            `${property.address.split(',')[0]}, ${property.address.split(',')[1]?.trim() || ''}`.replace(/,$/, '') :
                            property.location || 'N/A'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {displayOwnerData.company_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {property.property_type || property.type || 'Residential'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-gray-400 dark:text-gray-500 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-300">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300">
                        <div className="text-center">
                          <p className="text-lg font-medium mb-2">No properties found</p>
                          <p className="text-sm">
                            We didn't find any properties. Maybe you don't have any or maybe you need to{' '}
                            <button 
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200 font-medium"
                              onClick={() => {
                                // Clear any filters if needed
                                setStatusFilter('active');
                              }}
                            >
                              clear your filters
                            </button>
                            .
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'vendors' && (
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => navigate('/maintenance/vendors/add')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Add Vendor
                </button>
              </div>
            </div>

            {/* Filter and Results */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <select 
                    className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All categories</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="hvac">HVAC</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="landscaping">Landscaping</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 dark:text-gray-300 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {vendorsLoading ? 'Loading...' : `${vendorsData?.length || 0} vendors`}
                </span>
                <button 
                  onClick={() => {
                    // TODO: Implement export functionality
                    console.log('Export vendors for rental owner:', id);
                    // Could export to CSV or PDF
                  }}
                  className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:text-gray-200 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Vendors by Category */}
            {vendorsLoading ? (
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-600 p-12">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400 mr-2"></div>
                  <span className="text-gray-600 dark:text-gray-300">Loading vendors...</span>
                </div>
              </div>
            ) : vendorsError ? (
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-600 p-12">
                <div className="text-center">
                  <p className="text-red-500">Failed to load vendors. Please try again.</p>
                </div>
              </div>
            ) : vendorsData && vendorsData.length > 0 ? (
              <div className="space-y-6">
                {/* Group vendors by category */}
                {Object.entries(
                  vendorsData.reduce((acc, vendor) => {
                    const categoryName = vendor.category?.name || 'Uncategorized';
                    if (!acc[categoryName]) {
                      acc[categoryName] = [];
                    }
                    acc[categoryName].push(vendor);
                    return acc;
                  }, {})
                ).map(([categoryName, vendors]) => (
                  <div key={categoryName} className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                    {/* Category Header */}
                    <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                        <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                        {categoryName}
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300">({vendors.length} vendor{vendors.length !== 1 ? 's' : ''})</span>
                      </h3>
                    </div>
                    
                    {/* Vendors Grid */}
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {vendors.map((vendor) => (
                          <div key={vendor.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {vendor.company_name || `${vendor.first_name} ${vendor.last_name}`}
                                </h4>
                                {vendor.company_name && (
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {vendor.first_name} {vendor.last_name}
                                  </p>
                                )}
                              </div>
                              <button 
                                onClick={() => {
                                  // TODO: Add more options menu functionality
                                  console.log('More options for vendor:', vendor.id);
                                }}
                                className="text-gray-400 dark:text-gray-500 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-300 transition-colors"
                                title="More options"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              {vendor.primary_email && (
                                <div className="flex items-center text-gray-600 dark:text-gray-300">
                                  <span className="w-4 h-4 mr-2">📧</span>
                                  <span className="truncate">{vendor.primary_email}</span>
                                </div>
                              )}
                              {vendor.phone_1 && (
                                <div className="flex items-center text-gray-600 dark:text-gray-300">
                                  <span className="w-4 h-4 mr-2">📞</span>
                                  <span>{vendor.phone_1}</span>
                                </div>
                              )}
                              {vendor.website && (
                                <div className="flex items-center text-gray-600 dark:text-gray-300">
                                  <span className="w-4 h-4 mr-2">🌐</span>
                                  <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200 truncate">
                                    {vendor.website}
                                  </a>
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  vendor.is_active 
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                }`}>
                                  {vendor.is_active ? 'Active' : 'Inactive'}
                                </span>
                                {vendor.is_verified && (
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                                    Verified
                                  </span>
                                )}
                              </div>
                              <div className="flex space-x-1">
                                <button 
                                  onClick={() => {
                                    // TODO: Add view vendor functionality
                                    console.log('View vendor:', vendor.id);
                                    // Could open a modal or navigate to vendor detail page
                                  }}
                                  className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200 transition-colors" 
                                  title="View"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => {
                                    // TODO: Add edit vendor functionality
                                    console.log('Edit vendor:', vendor.id);
                                    // Could open edit modal or navigate to edit page
                                  }}
                                  className="p-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:text-green-200 transition-colors" 
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-600 p-12">
                <div className="text-center">
                  <p className="text-lg font-medium mb-2">No vendors found</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    This rental owner doesn't have any vendors assigned yet.
                  </p>
                  <button 
                    onClick={() => navigate('/maintenance/vendors/add')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Add First Vendor
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Owner Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">Company Information</h3>
                <dl className="mt-2 space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-900 dark:text-white">Company Name</dt>
                    <dd className="text-sm text-gray-600 dark:text-gray-300">{displayOwnerData.company_name || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-900 dark:text-white">Business Type</dt>
                    <dd className="text-sm text-gray-600 dark:text-gray-300">{displayOwnerData.business_type || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-900 dark:text-white">Location</dt>
                    <dd className="text-sm text-gray-600 dark:text-gray-300">
                      {displayOwnerData.city && displayOwnerData.state ? `${displayOwnerData.city}, ${displayOwnerData.state}` : 'N/A'}
                    </dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact Information</h3>
                <dl className="mt-2 space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-900 dark:text-white">Email</dt>
                    <dd className="text-sm text-gray-600 dark:text-gray-300">{displayOwnerData.contact_email || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-900 dark:text-white">Phone</dt>
                    <dd className="text-sm text-gray-600 dark:text-gray-300">{displayOwnerData.contact_phone || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-900 dark:text-white">Total Properties</dt>
                    <dd className="text-sm text-gray-600 dark:text-gray-300">{propertiesData?.length || 0}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'financials' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Financial Information</h2>
            <p className="text-gray-600 dark:text-gray-300">Financial data will be displayed here.</p>
          </div>
        )}

        {activeTab === 'communications' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Communications</h2>
            <p className="text-gray-600 dark:text-gray-300">Communication history will be displayed here.</p>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Files</h2>
            <p className="text-gray-600 dark:text-gray-300">File management will be displayed here.</p>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notes</h2>
            <p className="text-gray-600 dark:text-gray-300">Notes and comments will be displayed here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RentalOwnerDetail;
