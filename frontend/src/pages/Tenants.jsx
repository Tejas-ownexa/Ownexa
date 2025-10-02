import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import { useQueryClient } from 'react-query';
import { invalidateTenantCaches } from '../utils/cacheUtils';
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
  Trash2,
  User,
  Building
} from 'lucide-react';
import AddTenantModal from '../components/AddTenantModal';
import AddLeaseModal from '../components/AddLeaseModal';
import toast from 'react-hot-toast';

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [showAddLease, setShowAddLease] = useState(false);
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
        // Invalidate all tenant and property related caches since removing a tenant
        // changes property status from occupied back to available
        invalidateTenantCaches(queryClient);
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
    // Invalidate all tenant and property related caches since assigning a tenant
    // changes property status from available to occupied
    invalidateTenantCaches(queryClient);
    fetchTenants();
    fetchUserProperties();
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
      {/* Enhanced Header */}
      <div className="glass-card p-6 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Tenants</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">Manage your tenant relationships and lease agreements</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">
              <span>Total: {tenants.length}</span>
              <span>•</span>
              <span>Active: {tenants.filter(t => t.status === 'active').length}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            {/* Add Tenant Options Dropdown */}
            <div className="relative group">
              <button className="btn-primary flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Tenant</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="py-2">
                <button
                  onClick={() => setShowAddTenant(true)}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:hover:bg-gray-600 flex items-center space-x-3"
                >
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium">Add New Tenant</div>
                    <div className="text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">Create a new tenant manually</div>
                  </div>
                </button>
                
                <button
                  onClick={() => setShowAddLease(true)}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:hover:bg-gray-600 flex items-center space-x-3"
                >
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Building className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="font-medium">Create Lease from Application</div>
                    <div className="text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">Convert approved application to lease</div>
                  </div>
                </button>
              </div>
            </div>
            </div>
          
            <button className="btn-secondary">
              Receive payment
            </button>
            <button className="btn-secondary">
              Compose email
            </button>
            <button className="btn-secondary">
              Resident Center users
            </button>
          </div>
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
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All rentals</option>
              <option value="active">Active</option>
              <option value="future">Future</option>
            </select>
            <button className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Add filter option</span>
            </button>
          </div>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleExport}
            className="bg-white dark:bg-gray-800 text-gray-700 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 transition-colors flex items-center space-x-2"
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
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300" />
        <input
          type="text"
          placeholder="Search tenants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Tenants Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700"
                  onClick={() => handleSort('full_name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>FULL NAME</span>
                    {getSortIcon('full_name')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  EMAIL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  PHONE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  PROPERTY
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  LEASE PERIOD
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  RENT AMOUNT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  PAYMENT STATUS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                    <p className="mt-2 text-gray-600">Loading tenants...</p>
                  </td>
                </tr>
              ) : filteredTenants.length > 0 ? (
                                 filteredTenants.map((tenant) => {
                   return (
                     <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900">
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div>
                           <Link to={`/tenants/${tenant.id}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 dark:text-blue-200 font-medium">
                             {tenant.name || 'N/A'}
                           </Link>
                           <div className="text-xs text-gray-500 dark:text-gray-300">TENANT</div>
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         {tenant.email ? (
                           <div className="flex items-center space-x-2">
                             <Mail className="h-4 w-4 text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300" />
                             <Link to={`mailto:${tenant.email}`} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 dark:text-blue-200">
                               {tenant.email}
                             </Link>
                           </div>
                         ) : (
                           <span className="text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">--</span>
                         )}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         {tenant.phone ? (
                           <div>
                             <div className="flex items-center space-x-2">
                               <Phone className="h-4 w-4 text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300" />
                               <span className="text-sm text-gray-900 dark:text-white">{tenant.phone}</span>
                             </div>
                             <Link to="#" className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 dark:text-blue-200">
                               Send opt-in text message
                             </Link>
                           </div>
                         ) : (
                           <span className="text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">--</span>
                         )}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                         {tenant.property ? tenant.property.name : (
                           <span className="text-orange-600 dark:text-orange-400 font-medium">Unassigned</span>
                         )}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                         {tenant.leaseStartDate && tenant.leaseEndDate ? (
                           <div>
                             <div className="text-sm">{new Date(tenant.leaseStartDate).toLocaleDateString()}</div>
                             <div className="text-xs text-gray-500 dark:text-gray-300">to {new Date(tenant.leaseEndDate).toLocaleDateString()}</div>
                           </div>
                         ) : (
                           <span className="text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">--</span>
                         )}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                         {tenant.rentAmount ? `$${parseFloat(tenant.rentAmount).toLocaleString()}` : 'N/A'}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                           tenant.status === 'active' ? 'bg-green-100 text-green-800 dark:text-green-200' :
                           tenant.status === 'past_due' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' :
                           tenant.status === 'future' ? 'bg-blue-100 text-blue-800 dark:text-blue-200' :
                           'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                         }`}>
                           {tenant.status === 'future' ? 'Future' : (tenant.status || 'N/A')}
                         </span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                         <div className="flex items-center space-x-2">
                           <button 
                             onClick={() => handleDeleteTenant(tenant.id)}
                             className="text-red-600 dark:text-red-400 hover:text-red-900 transition-colors"
                             title="Delete Tenant"
                           >
                             <Trash2 className="h-4 w-4" />
                           </button>
                           <button className="text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-300">
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

      {/* Add Lease Modal */}
      <AddLeaseModal
        isOpen={showAddLease}
        onClose={() => setShowAddLease(false)}
        onSuccess={handleAddTenantSuccess}
      />
    </div>
  );
};

export default Tenants; 