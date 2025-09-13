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
  ArrowDown
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
      return <ArrowDown className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4 text-gray-600" /> : 
      <ArrowDown className="h-4 w-4 text-gray-600" />;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  // Show loading state
  if (ownerLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show error state
  if (ownerError || !ownerData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Owner not found</h2>
          <p className="text-gray-600 mb-4">The rental owner you're looking for doesn't exist.</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
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
                <h1 className="text-2xl font-bold text-gray-900">{displayOwnerData.company_name}</h1>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Rental owner</span>
                  <button className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                Inactivate owner
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700">
                Manage properties
              </button>
              
              {/* Navigation Controls */}
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600">
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
                    ? 'border-green-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
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
                    className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="all">All</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {ownerLoading ? 'Loading...' : `${propertiesData?.length || 0} matches`}
                </span>
                <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Properties Table */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('property_name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>PROPERTY</span>
                        {getSortIcon('property_name')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      STATUS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LOCATION
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      OTHER RENTAL OWNERS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TYPE
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {/* Actions column */}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ownerLoading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                          <span className="text-gray-600">Loading properties...</span>
                        </div>
                      </td>
                    </tr>
                  ) : propertiesData && propertiesData.length > 0 ? (
                    propertiesData.map((property) => (
                      <tr key={property.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {property.title || property.property_name || property.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            property.status === 'active' || property.status === 'occupied' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {property.status || 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {property.address ? 
                            `${property.address.split(',')[0]}, ${property.address.split(',')[1]?.trim() || ''}`.replace(/,$/, '') :
                            property.location || 'N/A'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {displayOwnerData.company_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {property.property_type || property.type || 'Residential'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        <div className="text-center">
                          <p className="text-lg font-medium mb-2">No properties found</p>
                          <p className="text-sm">
                            We didn't find any properties. Maybe you don't have any or maybe you need to{' '}
                            <button 
                              className="text-blue-600 hover:text-blue-800 font-medium"
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

        {activeTab === 'summary' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Owner Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Company Information</h3>
                <dl className="mt-2 space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-900">Company Name</dt>
                    <dd className="text-sm text-gray-600">{displayOwnerData.company_name || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-900">Business Type</dt>
                    <dd className="text-sm text-gray-600">{displayOwnerData.business_type || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-900">Location</dt>
                    <dd className="text-sm text-gray-600">
                      {displayOwnerData.city && displayOwnerData.state ? `${displayOwnerData.city}, ${displayOwnerData.state}` : 'N/A'}
                    </dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Contact Information</h3>
                <dl className="mt-2 space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-900">Email</dt>
                    <dd className="text-sm text-gray-600">{displayOwnerData.contact_email || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-900">Phone</dt>
                    <dd className="text-sm text-gray-600">{displayOwnerData.contact_phone || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-900">Total Properties</dt>
                    <dd className="text-sm text-gray-600">{propertiesData?.length || 0}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'financials' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Financial Information</h2>
            <p className="text-gray-600">Financial data will be displayed here.</p>
          </div>
        )}

        {activeTab === 'communications' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Communications</h2>
            <p className="text-gray-600">Communication history will be displayed here.</p>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Files</h2>
            <p className="text-gray-600">File management will be displayed here.</p>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>
            <p className="text-gray-600">Notes and comments will be displayed here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RentalOwnerDetail;
