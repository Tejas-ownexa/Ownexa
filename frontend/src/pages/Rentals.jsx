import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/axios';
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
  DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Rentals = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('rentroll');

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Rent roll</h1>
        <div className="flex space-x-3">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add lease</span>
          </button>
          <button className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
            Renew lease
          </button>
          <button className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
            Receive payment
          </button>
          <button className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('properties')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'properties'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Properties
          </button>
          <button
            onClick={() => setActiveTab('rentroll')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rentroll'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Rent roll
          </button>
          <button
            onClick={() => setActiveTab('liability')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'liability'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
            <div className="flex space-x-3">
              <Link
                to="/add-property"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add property</span>
              </Link>
              <button className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center space-x-2">
                <span>Management fees</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              <button className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                Manage bank accounts
              </button>
              <button className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filters and Search Bar */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={propertySearchTerm}
                  onChange={(e) => setPropertySearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select 
                value={propertyFilterStatus} 
                onChange={(e) => setPropertyFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All rentals</option>
                <option value="available">Available</option>
                <option value="rented">Rented</option>
                <option value="maintenance">Maintenance</option>
              </select>
              <button className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span>Add filter option</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Show bank accounts</span>
                <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                  <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                  <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                </div>
              </div>
            </div>
            <button 
              onClick={() => {
                // Export properties functionality
                const csvContent = [
                  ['PROPERTY', 'LOCATION', 'RENTAL OWNERS', 'MANAGER', 'TYPE', 'OPERATING ACCOUNT', 'DEPOSIT TRUST ACCOUNT'],
                  ...(properties || []).map(property => [
                    property.title,
                    `${property.address?.city || ''}, ${property.address?.state || ''}`,
                    property.owner?.full_name || 'N/A',
                    'N/A',
                    'Residential',
                    'EFT ATK ASSOCIATE...',
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
              className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            {filteredProperties.length} matches
          </div>

          {/* Properties Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('property')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>PROPERTY</span>
                        {getSortIcon('property')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('location')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>LOCATION</span>
                        {getSortIcon('location')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('owner')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>RENTAL OWNERS</span>
                        {getSortIcon('owner')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MANAGER
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('type')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>TYPE</span>
                        {getSortIcon('type')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      OPERATING ACCOUNT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DEPOSIT TRUST ACCOUNT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProperties.length > 0 ? (
                    filteredProperties.map((property) => (
                      <tr key={property.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to={`/properties/${property.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            {property.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {property.address?.city || 'N/A'}, {property.address?.state || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {property.owner?.full_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          -
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Residential, {property.apt_number ? 'Condo/Townhome' : 'Single-Family'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">EFT</span>
                            <span className="text-xs bg-green-500 w-2 h-2 rounded-full"></span>
                            <span className="text-sm text-gray-900">ATK ASSOCIATE...</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to="#"
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Setup
                          </Link>
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
                      <td colSpan="8" className="px-6 py-12 text-center">
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
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All rentals</option>
                <option value="active">Active</option>
                <option value="future">Future</option>
                <option value="expired">Expired</option>
              </select>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  ({filteredLeases.filter(l => l.status === 'Active').length} Active, {filteredLeases.filter(l => l.status === 'Future').length} Future)
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
              <button className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span>Add filter option</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            <button 
              onClick={handleExport}
              className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            {filteredLeases.length} matches
          </div>

          {/* Rent Roll Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('lease')}
                >
                  <div className="flex items-center space-x-1">
                    <span>LEASE</span>
                    {getSortIcon('lease')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>STATUS</span>
                    {getSortIcon('status')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center space-x-1">
                    <span>TYPE</span>
                    {getSortIcon('type')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('daysLeft')}
                >
                  <div className="flex items-center space-x-1">
                    <span>DAYS LEFT</span>
                    {getSortIcon('daysLeft')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('rent')}
                >
                  <div className="flex items-center space-x-1">
                    <span>RENT</span>
                    {getSortIcon('rent')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeases.map((lease) => (
                <tr key={lease.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{lease.lease}</div>
                      <div className="text-sm text-gray-500">ID: {lease.uniqueId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      lease.status === 'Active' ? 'text-green-600 bg-green-100' : 
                      lease.status === 'Future' ? 'text-blue-600 bg-blue-100' : 
                      'text-gray-600 bg-gray-100'
                    }`}>
                      {lease.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lease.typeDisplay}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lease.daysLeft}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(lease.rent)}
                      </span>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-gray-400 hover:text-gray-600">
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search leases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </>
      )}

      {activeTab === 'liability' && (
        <div className="space-y-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Liability Management</h3>
            <p className="text-gray-600">This section is under development.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rentals;
