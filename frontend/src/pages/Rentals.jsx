import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/axios';
import { invalidatePropertyCaches } from '../utils/cacheUtils';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus,
  Download,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Filter,
  Search,
  MapPin,
  DollarSign,
  Upload,
  Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Rentals = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('rentroll');
  const queryClient = useQueryClient();

  // Delete property handler
  const handleDeleteProperty = async (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      try {
        await api.delete(`/api/properties/${propertyId}`);
        toast.success('Property deleted successfully!');
        // Refresh all property-related data
        invalidatePropertyCaches(queryClient);
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete property. Please try again.');
      }
    }
  };

  // Add CSS for toggle switch
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .toggle-checkbox:checked {
        right: 0;
        border-color: #10b981;
      }
      .toggle-checkbox:checked + .toggle-label {
        background-color: #10b981;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  const [sortField, setSortField] = useState('lease');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [propertySearchTerm, setPropertySearchTerm] = useState('');
  const [propertyFilterStatus, setPropertyFilterStatus] = useState('all');

  // Handle URL parameters to set initial tab
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      const tabMapping = {
        'properties': 'properties',
        'payments': 'rentroll',
        'leases': 'rentroll',
        'balances': 'liability'
      };
      if (tabMapping[tab]) {
        setActiveTab(tabMapping[tab]);
      }
    }
  }, [searchParams]);

  // Fetch tenants for the current owner's properties
  const { data: tenants, isLoading: tenantsLoading } = useQuery(
    ['tenants'],
    async () => {
      const response = await api.get('/api/tenants/');
      return response.data;
    },
    { enabled: !!user?.id }
  );

  // Fetch properties for the current owner
  const { data: properties, isLoading: propertiesLoading } = useQuery(
    ['properties'],
    async () => {
      const response = await api.get('/api/properties/');
      return response.data;
    },
    { enabled: !!user?.id }
  );

  // Fetch rent roll data
  const { data: rentRoll, isLoading: rentRollLoading } = useQuery(
    ['rent-roll'],
    async () => {
      const response = await api.get('/api/rentals/rent-roll');
      return response.data;
    },
    { enabled: !!user?.id }
  );

  // Combine data to create lease entries
  const leaseEntries = React.useMemo(() => {
    // Handle different API response structures
    const tenantsArray = tenants?.items || tenants || [];
    const rentRollArray = rentRoll || [];
    
    console.log('Debug - tenants:', tenants);
    console.log('Debug - tenantsArray:', tenantsArray);
    console.log('Debug - rentRoll:', rentRoll);
    
    if (!tenantsArray.length) return [];

    return tenantsArray.map(tenant => {
      // Use property data that's already included in tenant response
      const property = tenant.property;
      const payments = rentRollArray.filter(p => p.tenant_id === tenant.id);
      
             // Calculate lease type and dates
       const leaseStart = new Date(tenant.leaseStartDate);
       const leaseEnd = new Date(tenant.leaseEndDate);
       const now = new Date();
       
       // Determine lease type
       let leaseType = 'Fixed w/rollover';
       let typeDisplay = `${leaseStart.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })} - ${leaseEnd.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}`;
       
       if (tenant.lease_type === 'at_will') {
         leaseType = 'At will';
         typeDisplay = leaseEnd.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
       }
      
      // Calculate days left
      const daysLeft = Math.ceil((leaseEnd - now) / (1000 * 60 * 60 * 24));
      const daysLeftDisplay = daysLeft > 0 ? daysLeft : '';
      
      // Generate unique ID (simulating the format from the image)
      const uniqueId = `000${Math.floor(Math.random() * 90000) + 10000}`;
      
             return {
         id: tenant.id,
         uniqueId,
         lease: `${property?.name || 'Unknown Property'} - ${property?.apt || 'N/A'} | ${tenant.name}`,
         status: tenant.status || 'Active',
         type: leaseType,
         typeDisplay,
         daysLeft: daysLeftDisplay,
         rent: parseFloat(tenant.rentAmount || 0),
         property: property,
         tenant: tenant,
         payments: payments
       };
    });
  }, [tenants, rentRoll]);

  // Filter and sort lease entries
  const filteredLeases = React.useMemo(() => {
    let filtered = leaseEntries;

         // Apply search filter
     if (searchTerm) {
       filtered = filtered.filter(lease => 
         lease.lease.toLowerCase().includes(searchTerm.toLowerCase()) ||
         lease.tenant.name.toLowerCase().includes(searchTerm.toLowerCase())
       );
     }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(lease => lease.status.toLowerCase() === filterStatus.toLowerCase());
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(lease => lease.type.toLowerCase() === filterType.toLowerCase());
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'lease':
          aValue = a.lease.toLowerCase();
          bValue = b.lease.toLowerCase();
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case 'type':
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        case 'daysLeft':
          aValue = a.daysLeft || 0;
          bValue = b.daysLeft || 0;
          break;
        case 'rent':
          aValue = a.rent;
          bValue = b.rent;
          break;
        default:
          aValue = a.lease.toLowerCase();
          bValue = b.lease.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [leaseEntries, searchTerm, filterStatus, filterType, sortField, sortDirection]);

  // Filter and sort properties
  const filteredProperties = React.useMemo(() => {
    let filtered = properties || [];

    // Apply search filter
    if (propertySearchTerm) {
      filtered = filtered.filter(property => 
        property.title.toLowerCase().includes(propertySearchTerm.toLowerCase()) ||
        `${property.address?.city || ''} ${property.address?.state || ''}`.toLowerCase().includes(propertySearchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (propertyFilterStatus !== 'all') {
      filtered = filtered.filter(property => property.status === propertyFilterStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'property':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'location':
          aValue = `${a.address?.city || ''} ${a.address?.state || ''}`;
          bValue = `${b.address?.city || ''} ${b.address?.state || ''}`;
          break;
        case 'owner':
          aValue = a.owner?.full_name || '';
          bValue = b.owner?.full_name || '';
          break;
        case 'type':
          aValue = a.apt_number ? 'Condo/Townhome' : 'Single-Family';
          bValue = b.apt_number ? 'Condo/Townhome' : 'Single-Family';
          break;
        default:
          aValue = a.title;
          bValue = b.title;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? -1 : 1;
      }
    });

    return filtered;
  }, [properties, propertySearchTerm, propertyFilterStatus, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const handleExport = () => {
    try {
      const csvContent = [
        ['LEASE', 'STATUS', 'TYPE', 'DAYS LEFT', 'RENT'],
        ...filteredLeases.map(lease => [
          lease.lease,
          lease.status,
          lease.typeDisplay,
          lease.daysLeft || '',
          `$${lease.rent.toFixed(2)}`
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `rent_roll_${new Date().toISOString().split('T')[0]}.csv`);
      if (link && link.style) {
        link.style.visibility = 'hidden';
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Rent roll exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export rent roll');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  if (tenantsLoading || rentRollLoading || propertiesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">


      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-600">
        <nav className="flex flex-wrap space-x-4 sm:space-x-8">
          <button
            onClick={() => setActiveTab('properties')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'properties'
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:border-gray-600'
            }`}
          >
            Properties
          </button>
          <button
            onClick={() => setActiveTab('rentroll')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'rentroll'
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:border-gray-600'
            }`}
          >
            Rent roll
          </button>
          <button
            onClick={() => setActiveTab('liability')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'liability'
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:border-gray-600'
            }`}
          >
            Liability management
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'properties' && (
        <div className="space-y-6">
          {/* Properties Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Properties</h1>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Link
                to="/add-property"
                className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 text-sm sm:text-base"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add property</span>
                <span className="sm:hidden">Add</span>
              </Link>
            </div>
          </div>

          {/* Filters and Search Bar */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 dark:text-gray-300" />
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={propertySearchTerm}
                  onChange={(e) => setPropertySearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                />
              </div>
              <select 
                value={propertyFilterStatus} 
                onChange={(e) => setPropertyFilterStatus(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm w-full sm:w-auto"
              >
                <option value="all">All rentals</option>
                <option value="available">Available</option>
                <option value="rented">Rented</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full lg:w-auto">
              <button 
                onClick={() => {
                  // Export properties functionality
                  const csvContent = [
                    ['PROPERTY', 'LOCATION', 'RENTAL OWNERS', 'MANAGER', 'TYPE', 'STATUS', 'DEPOSIT TRUST ACCOUNT'],
                    ...(properties || []).map(property => [
                      property.title,
                      `${property.address?.city || ''}, ${property.address?.state || ''}`,
                      property.rental_owner?.company_name || 'N/A',
                      'N/A',
                      'Residential',
                      property.status ? property.status.charAt(0).toUpperCase() + property.status.slice(1) : 'Unknown',
                      'Setup'
                    ])
                  ].map(row => row.join(',')).join('\n');

                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const link = document.createElement('a');
                  const url = URL.createObjectURL(blob);
                  link.setAttribute('href', url);
                  link.setAttribute('download', `properties_${new Date().toISOString().split('T')[0]}.csv`);
                  if (link && link.style) {
                    link.style.visibility = 'hidden';
                  }
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success('Properties exported successfully!');
                }}
                className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 sm:px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 transition-colors flex items-center justify-center sm:justify-start space-x-2 text-sm sm:text-base"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              
              <button 
                onClick={() => {
                  // Download CSV template
                  const csvTemplate = [
                    ['PROPERTY', 'LOCATION', 'STREET_ADDRESS', 'STREET_ADDRESS_2', 'APT_NUMBER', 'DESCRIPTION', 'RENT_AMOUNT', 'STATUS', 'ZIP_CODE'],
                    ['Sample Property 1', 'New York, NY', '123 Main St', 'Apt 1B', 'Beautiful apartment in downtown', '2500.00', 'available', '10001'],
                    ['Sample Property 2', 'Los Angeles, CA', '456 Oak Ave', '', 'Modern house with garden', '3500.00', 'available', '90210'],
                    ['Sample Property 3', 'Chicago, IL', '789 Pine St', 'Unit 5', 'Cozy studio apartment', '1800.00', 'rented', '60601']
                  ].map(row => row.join(',')).join('\n');

                  const blob = new Blob([csvTemplate], { type: 'text/csv' });
                  const link = document.createElement('a');
                  const url = URL.createObjectURL(blob);
                  link.setAttribute('href', url);
                  link.setAttribute('download', 'properties_import_template.csv');
                  if (link && link.style) {
                    link.style.visibility = 'hidden';
                  }
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success('CSV template downloaded!');
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Template</span>
              </button>
              
              <button 
                onClick={() => {
                  // Create a file input for CSV import
                  const fileInput = document.createElement('input');
                  fileInput.type = 'file';
                  fileInput.accept = '.csv';
                  fileInput.style.display = 'none';
                  
                  fileInput.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    try {
                      const formData = new FormData();
                      formData.append('csv_file', file);
                      
                      const response = await api.post('/api/properties/import', formData, {
                        headers: {
                          'Content-Type': 'multipart/form-data',
                        },
                      });
                      
                      if (response.data.success) {
                        toast.success(`Successfully imported ${response.data.imported_count} properties!`);
                        // Refresh all property-related data
                        invalidatePropertyCaches(queryClient);
                      } else {
                        toast.error('Import failed: ' + response.data.error);
                      }
                    } catch (error) {
                      console.error('Import error:', error);
                      toast.error('Failed to import properties. Please check your CSV format.');
                    }
                    
                    // Clean up
                    document.body.removeChild(fileInput);
                  };
                  
                  document.body.appendChild(fileInput);
                  fileInput.click();
                }}
                className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center sm:justify-start space-x-2 text-sm sm:text-base"
              >
                <Upload className="h-4 w-4" />
                <span>Import</span>
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {filteredProperties.length} matches
          </div>

          {/* Properties Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th 
                      className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700"
                      onClick={() => handleSort('property')}
                    >
                      <div className="flex items-center space-x-1">
                        <span className="hidden sm:inline">PROPERTY</span>
                        <span className="sm:hidden">PROP</span>
                        {getSortIcon('property')}
                      </div>
                    </th>
                    <th 
                      className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700"
                      onClick={() => handleSort('location')}
                    >
                      <div className="flex items-center space-x-1">
                        <span className="hidden sm:inline">LOCATION</span>
                        <span className="sm:hidden">LOC</span>
                        {getSortIcon('location')}
                      </div>
                    </th>
                    <th 
                      className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700 hidden md:table-cell"
                      onClick={() => handleSort('owner')}
                    >
                      <div className="flex items-center space-x-1">
                        <span className="hidden lg:inline">RENTAL OWNERS</span>
                        <span className="lg:hidden">OWNERS</span>
                        {getSortIcon('owner')}
                      </div>
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                      MANAGER
                    </th>
                    <th 
                      className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700"
                      onClick={() => handleSort('type')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>TYPE</span>
                        {getSortIcon('type')}
                      </div>
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      STATUS
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden 2xl:table-cell">
                      DEPOSIT TRUST ACCOUNT
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                  {filteredProperties.length > 0 ? (
                    filteredProperties.map((property) => (
                      <tr key={property.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <Link
                            to={`/properties/${property.id}`}
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200"
                          >
                            {property.title}
                          </Link>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {property.address?.city || 'N/A'}, {property.address?.state || 'N/A'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden md:table-cell">
                          {property.rental_owner?.company_name || 'N/A'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 hidden lg:table-cell">
                          -
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <span className="hidden sm:inline">Residential, {property.apt_number ? 'Condo/Townhome' : 'Single-Family'}</span>
                          <span className="sm:hidden">{property.apt_number ? 'Condo' : 'Single'}</span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                            property.status === 'available' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                              : property.status === 'rented'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                              : property.status === 'maintenance'
                              ? 'bg-yellow-100 text-yellow-800 dark:text-yellow-200'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}>
                            <span className={`w-2 h-2 rounded-full mr-2 ${
                              property.status === 'available' 
                                ? 'bg-green-500' 
                                : property.status === 'rented'
                                ? 'bg-blue-500'
                                : property.status === 'maintenance'
                                ? 'bg-yellow-500'
                                : 'bg-gray-50 dark:bg-gray-9000'
                            }`}></span>
                            {property.status ? property.status.charAt(0).toUpperCase() + property.status.slice(1) : 'Unknown'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden 2xl:table-cell">
                          <Link
                            to="#"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200"
                          >
                            Setup
                          </Link>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleDeleteProperty(property.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 transition-colors"
                              title="Delete Property"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button className="text-gray-400 dark:text-gray-500 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-300">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-3 sm:px-6 py-12 text-center">
                        <div className="text-gray-400 dark:text-gray-500 dark:text-gray-300 mb-4">
                          <Search className="h-16 w-16 mx-auto" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No properties found</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">Get started by adding your first property to your portfolio</p>
                        <Link
                          to="/add-property"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Plus className="-ml-1 mr-2 h-5 w-5" />
                          Add Your First Property
                        </Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rentroll' && (
        <>
          {/* Filters and Search */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All rentals</option>
                <option value="active">Active</option>
                <option value="future">Future</option>
                <option value="expired">Expired</option>
              </select>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  ({filteredLeases.filter(l => l.status === 'Active').length} Active, {filteredLeases.filter(l => l.status === 'Future').length} Future)
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500 dark:text-gray-300" />
              </div>
              <button className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span>Add filter option</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            <button 
              onClick={handleExport}
              className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {filteredLeases.length} matches
          </div>

          {/* Rent Roll Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700"
                  onClick={() => handleSort('lease')}
                >
                  <div className="flex items-center space-x-1">
                    <span>LEASE</span>
                    {getSortIcon('lease')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>STATUS</span>
                    {getSortIcon('status')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center space-x-1">
                    <span>TYPE</span>
                    {getSortIcon('type')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700"
                  onClick={() => handleSort('daysLeft')}
                >
                  <div className="flex items-center space-x-1">
                    <span>DAYS LEFT</span>
                    {getSortIcon('daysLeft')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700"
                  onClick={() => handleSort('rent')}
                >
                  <div className="flex items-center space-x-1">
                    <span>RENT</span>
                    {getSortIcon('rent')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
              {filteredLeases.map((lease) => (
                <tr key={lease.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{lease.lease}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300">ID: {lease.uniqueId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      lease.status === 'Active' ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30' : 
                      lease.status === 'Future' ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30' : 
                      'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700'
                    }`}>
                      {lease.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {lease.typeDisplay}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {lease.daysLeft}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(lease.rent)}
                      </span>
                      <button className="text-gray-400 dark:text-gray-500 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-300">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-gray-400 dark:text-gray-500 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-300">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 dark:text-gray-300" />
            <input
              type="text"
              placeholder="Search leases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </>
      )}

      {activeTab === 'liability' && (
        <div className="space-y-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Liability Management</h3>
            <p className="text-gray-600 dark:text-gray-300">This section is under development.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rentals;
