import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import { useQueryClient } from 'react-query';
import { 
  Plus, 
  Download, 
  Phone, 
  Mail, 
  MoreHorizontal, 
  ChevronUp,
  ChevronDown,
  Filter,
  Search,
  Upload,
  Trash2
} from 'lucide-react';
import AddTenantModal from '../components/AddTenantModal';
import toast from 'react-hot-toast';

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [userProperties, setUserProperties] = useState([]);
  const [sortField, setSortField] = useState('last_name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Delete tenant handler
  const handleDeleteTenant = async (tenantId) => {
    if (window.confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      try {
        await api.delete(`/api/tenants/${tenantId}`);
        toast.success('Tenant deleted successfully!');
        // Refresh the tenants list
        queryClient.invalidateQueries(['tenants']);
        fetchTenants();
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete tenant. Please try again.');
      }
    }
  };

  const fetchUserProperties = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await api.get(`/api/properties/?owner_id=${user.id}`);
      setUserProperties(response.data);
    } catch (error) {
      console.error('Error fetching user properties:', error);
      toast.error('Failed to load properties');
    }
  }, [user?.id]);

  const fetchTenants = useCallback(async () => {
    try {
      const response = await api.get('/api/tenants/');
      console.log('Tenants API response:', response.data);
      setTenants(response.data.items || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast.error('Failed to load tenants');
    }
  }, []);



  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchUserProperties(),
        fetchTenants()
      ]);
      setIsLoading(false);
    };

    fetchData();
  }, [fetchUserProperties, fetchTenants]);

  const handleAddTenantSuccess = () => {
    fetchTenants();
  };

  // Sorting and filtering functions
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedTenants = tenants
    .filter(tenant => {
      const matchesSearch = searchTerm === '' || 
        tenant.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.phone_number?.includes(searchTerm);
      
      const matchesStatus = filterStatus === 'all' || tenant.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

  const exportTenants = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Property', 'Lease Start', 'Lease End', 'Rent Amount', 'Status'],
      ...filteredAndSortedTenants.map(tenant => [
        tenant.full_name || '',
        tenant.email || '',
        tenant.phone_number || '',
        tenant.property?.title || '',
        tenant.lease_start || '',
        tenant.lease_end || '',
        tenant.rent_amount || '',
        tenant.status || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tenants_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tenant Management</h1>
            <p className="text-gray-600 mt-1">Manage your tenants and their lease information</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={exportTenants}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="-ml-1 mr-2 h-5 w-5" />
              Export
            </button>
            <button
              onClick={() => setShowAddTenant(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Add Tenant
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={`${sortField}-${sortDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                setSortField(field);
                setSortDirection(direction);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="full_name-asc">Name (A-Z)</option>
              <option value="full_name-desc">Name (Z-A)</option>
              <option value="email-asc">Email (A-Z)</option>
              <option value="email-desc">Email (Z-A)</option>
              <option value="rent_amount-asc">Rent (Low to High)</option>
              <option value="rent_amount-desc">Rent (High to Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading tenants...</p>
          </div>
        ) : filteredAndSortedTenants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('full_name')}
                  >
                    <div className="flex items-center">
                      Tenant Name
                      {sortField === 'full_name' && (
                        sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lease Period
                  </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rent Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tenants.map((tenant) => (
                          <tr key={tenant.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                                <div className="text-sm text-gray-500">{tenant.email}</div>
                                <div className="text-sm text-gray-500">{tenant.phone}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {tenant.property ? tenant.property.name : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {tenant.leaseStartDate && tenant.leaseEndDate ? (
                                `${new Date(tenant.leaseStartDate).toLocaleDateString()} - ${new Date(tenant.leaseEndDate).toLocaleDateString()}`
                              ) : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${tenant.rentAmount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                tenant.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {tenant.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  ) : (
                    <div className="text-center py-12">
                    <p className="text-gray-600">No tenants found. Add your first tenant to get started!</p>
                    </div>
                  )}
              </div>
            )}

            {activeTab === 'rent-roll' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Rent Roll</h2>
                </div>

                {rentPayments.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tenant
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Property
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payment Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {rentPayments.map((payment) => (
                          <tr key={payment.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.tenant_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.property_title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(payment.payment_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${payment.amount_paid}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                payment.status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {payment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-12">
                    <p className="text-gray-600">No rent payments recorded yet.</p>
                    </div>
                  )}
                </div>
            )}

            {activeTab === 'balances' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Outstanding Balances</h2>
                </div>

                {outstandingBalances.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tenant
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Property
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Due Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount Due
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {outstandingBalances.map((balance) => (
                          <tr key={balance.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {balance.tenant_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {balance.property_title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(balance.due_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${balance.due_amount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-12">
                    <p className="text-gray-600">No outstanding balances.</p>
                    </div>
                  )}
                </div>
            )}
          </div>
        </div>
      </div>

        }, [fetchUserProperties, fetchTenants]);

  const handleAddTenantSuccess = () => {
    fetchTenants();
  };

  const handleExport = () => {
    try {
      // Create CSV content
      const headers = ['Full Name', 'Email', 'Phone', 'Property', 'Lease Start', 'Lease End', 'Rent Amount', 'Payment Status'];
      const csvContent = [
        headers.join(','),
        ...filteredTenants.map(tenant => {
          return [
            `"${tenant.name || 'N/A'}"`,
            `"${tenant.email || 'N/A'}"`,
            `"${tenant.phone || 'N/A'}"`,
            `"${tenant.property?.name || 'N/A'}"`,
            `"${tenant.leaseStartDate || 'N/A'}"`,
            `"${tenant.leaseEndDate || 'N/A'}"`,
            `"${tenant.rentAmount || 'N/A'}"`,
            `"${tenant.status || 'N/A'}"`
          ].join(',');
        })
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `tenants_export_${new Date().toISOString().split('T')[0]}.csv`);
      if (link && link.style) {
        link.style.visibility = 'hidden';
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Tenants exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export tenants');
    }
  };

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

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || tenant.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowAddTenant(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add lease</span>
          </button>
          <button className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
            Receive payment
          </button>
          <button className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
            Compose email
          </button>
          <button className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
            Resident Center users
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">{filteredTenants.length} matches</span>
          <div className="flex space-x-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All rentals</option>
              <option value="active">Active</option>
              <option value="future">Future</option>
            </select>
            <button className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Add filter option</span>
            </button>
          </div>
        </div>
<<<<<<< HEAD
        <button
          onClick={handleExport}
          className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </button>
=======
        <div className="flex space-x-2">
          <button 
            onClick={handleExport}
            className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          
          <button 
                         onClick={() => {
               // Download CSV template with available properties
               const availableProperties = userProperties.filter(p => p.status === 'available');
               let csvTemplate = [
                 ['FULL_NAME', 'EMAIL', 'PHONE', 'PROPERTY_ID', 'LEASE_START_DATE', 'LEASE_END_DATE', 'RENT_AMOUNT', 'PAYMENT_STATUS'],
                 ['# Required fields: FULL_NAME, EMAIL, PHONE'],
                 ['# PROPERTY_ID: Leave empty for future tenants, or use available property ID'],
                 ['# PAYMENT_STATUS: Use "active" for assigned tenants, "future" for unassigned tenants'],
                 ['# Date format: YYYY-MM-DD (e.g., 2024-01-01)'],
                 ['# Rent amount: Use numbers only (e.g., 2500.00)']
               ];
               
               // Add sample rows - one assigned, one future tenant
               if (availableProperties.length > 0) {
                 // Assigned tenant example
                 csvTemplate.push([
                   'John Doe', 'john.doe@email.com', '+1-555-0123', 
                   availableProperties[0].id.toString(), '2024-01-01', '2024-12-31', 
                   availableProperties[0].rent_amount?.toString() || '2500.00', 'active'
                 ]);
                 
                 // Future tenant example (no property assignment)
                 csvTemplate.push([
                   'Jane Smith', 'jane.smith@email.com', '+1-555-0124', 
                   '', '2024-06-01', '2025-05-31', '2800.00', 'future'
                 ]);
               } else {
                 // If no available properties, show future tenant examples
                 csvTemplate.push([
                   'John Doe', 'john.doe@email.com', '+1-555-0123', '', '2024-01-01', '2024-12-31', '2500.00', 'future'
                 ]);
                 csvTemplate.push([
                   'Jane Smith', 'jane.smith@email.com', '+1-555-0124', '', '2024-06-01', '2025-05-31', '2800.00', 'future'
                 ]);
               }
               
               const csvContent = csvTemplate.map(row => row.join(',')).join('\n');

                             const blob = new Blob([csvContent], { type: 'text/csv' });
              const link = document.createElement('a');
              const url = URL.createObjectURL(blob);
              link.setAttribute('href', url);
              link.setAttribute('download', 'tenants_import_template.csv');
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
                  
                  const response = await api.post('/api/tenants/import', formData, {
                    headers: {
                      'Content-Type': 'multipart/form-data',
                    },
                  });
                  
                  if (response.data.success) {
                    if (response.data.imported_count > 0) {
                      toast.success(`Successfully imported ${response.data.imported_count} tenants!`);
                      // Refresh the tenants list using React Query
                      queryClient.invalidateQueries(['tenants']);
                      fetchTenants();
                    } else {
                      // Show errors if no tenants were imported
                      if (response.data.errors && response.data.errors.length > 0) {
                        const errorMessage = response.data.errors.join(', ');
                        toast.error(`Import failed: ${errorMessage}`);
                      } else {
                        toast.error('No tenants were imported. Please check your CSV format.');
                      }
                    }
                  } else {
                    toast.error('Import failed: ' + (response.data.error || 'Unknown error'));
                  }
                } catch (error) {
                  console.error('Import error:', error);
                  if (error.response && error.response.data && error.response.data.error) {
                    toast.error('Import failed: ' + error.response.data.error);
                  } else {
                    toast.error('Failed to import tenants. Please check your CSV format.');
                  }
                }
                
                // Clean up
                document.body.removeChild(fileInput);
              };
              
              document.body.appendChild(fileInput);
              fileInput.click();
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Import</span>
          </button>
        </div>
>>>>>>> 3b4e62808a1c36c84adfcd0835660e0ae1323bab
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search tenants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
<<<<<<< HEAD
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  FIRST NAME
                </th>
                <th
=======
                <th 
>>>>>>> 3b4e62808a1c36c84adfcd0835660e0ae1323bab
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('full_name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>FULL NAME</span>
                    {getSortIcon('full_name')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EMAIL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PHONE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PROPERTY
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LEASE PERIOD
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RENT AMOUNT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PAYMENT STATUS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Loading tenants...</p>
                  </td>
                </tr>
              ) : filteredTenants.length > 0 ? (
                                 filteredTenants.map((tenant) => {
                   return (
                     <tr key={tenant.id} className="hover:bg-gray-50">
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div>
                           <Link to={`/tenants/${tenant.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                             {tenant.name || 'N/A'}
                           </Link>
                           <div className="text-xs text-gray-500">TENANT</div>
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         {tenant.email ? (
                           <div className="flex items-center space-x-2">
                             <Mail className="h-4 w-4 text-gray-400" />
                             <Link to={`mailto:${tenant.email}`} className="text-sm text-blue-600 hover:text-blue-800">
                               {tenant.email}
                             </Link>
                           </div>
                         ) : (
                           <span className="text-gray-400">--</span>
                         )}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         {tenant.phone ? (
                           <div>
                             <div className="flex items-center space-x-2">
                               <Phone className="h-4 w-4 text-gray-400" />
                               <span className="text-sm text-gray-900">{tenant.phone}</span>
                             </div>
                             <Link to="#" className="text-xs text-blue-600 hover:text-blue-800">
                               Send opt-in text message
                             </Link>
                           </div>
                         ) : (
                           <span className="text-gray-400">--</span>
                         )}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                         {tenant.property ? tenant.property.name : (
                           <span className="text-orange-600 font-medium">Unassigned</span>
                         )}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                         {tenant.leaseStartDate && tenant.leaseEndDate ? (
                           <div>
                             <div className="text-sm">{new Date(tenant.leaseStartDate).toLocaleDateString()}</div>
                             <div className="text-xs text-gray-500">to {new Date(tenant.leaseEndDate).toLocaleDateString()}</div>
                           </div>
                         ) : (
                           <span className="text-gray-400">--</span>
                         )}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                         {tenant.rentAmount ? `$${parseFloat(tenant.rentAmount).toLocaleString()}` : 'N/A'}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                           tenant.status === 'active' ? 'bg-green-100 text-green-800' :
                           tenant.status === 'past_due' ? 'bg-red-100 text-red-800' :
                           tenant.status === 'future' ? 'bg-blue-100 text-blue-800' :
                           'bg-gray-100 text-gray-800'
                         }`}>
                           {tenant.status === 'future' ? 'Future' : (tenant.status || 'N/A')}
                         </span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                         <div className="flex items-center space-x-2">
                           <button 
                             onClick={() => handleDeleteTenant(tenant.id)}
                             className="text-red-600 hover:text-red-900 transition-colors"
                             title="Delete Tenant"
                           >
                             <Trash2 className="h-4 w-4" />
                           </button>
                           <button className="text-gray-400 hover:text-gray-600">
                             <MoreHorizontal className="h-4 w-4" />
                           </button>
                         </div>
                       </td>
                     </tr>
                   );
                 })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <p className="text-gray-600">No tenants found. Add your first tenant to get started!</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Tenant Modal */}
      <AddTenantModal
        isOpen={showAddTenant}
        onClose={() => setShowAddTenant(false)}
        properties={userProperties.filter(p => p.status === 'available')}
        onSuccess={handleAddTenantSuccess}
      />
    </div>
  );
};

export default Tenants; 