import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  Download, 
  Phone, 
  Mail, 
  MoreHorizontal, 
  ChevronUp,
  ChevronDown,
  Filter,
  Search
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
      const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Property', 'Status'];
      const csvContent = [
        headers.join(','),
        ...filteredTenants.map(tenant => {
          const [firstName, ...lastNameParts] = (tenant.name || '').split(' ');
          const lastName = lastNameParts.join(' ');
          return [
            `"${firstName || 'N/A'}"`,
            `"${lastName || 'N/A'}"`,
            `"${tenant.email || 'N/A'}"`,
            `"${tenant.phone || 'N/A'}"`,
            `"${tenant.property?.name || 'N/A'}"`,
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
      link.style.visibility = 'hidden';
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
        <button
          onClick={handleExport}
          className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </button>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  FIRST NAME
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('last_name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>LAST NAME</span>
                    {getSortIcon('last_name')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  UNIT NUMBER
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PHONE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EMAIL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RESIDENT CENTER STATUS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Loading tenants...</p>
                  </td>
                </tr>
              ) : filteredTenants.length > 0 ? (
                                 filteredTenants.map((tenant) => {
                   const [firstName, ...lastNameParts] = (tenant.name || '').split(' ');
                   const lastName = lastNameParts.join(' ');
                   
                   return (
                     <tr key={tenant.id} className="hover:bg-gray-50">
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div>
                           <Link to={`/tenants/${tenant.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                             {firstName || 'N/A'}
                           </Link>
                           <div className="text-xs text-gray-500">TENANT</div>
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                         {lastName || 'N/A'}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                         {tenant.property ? `${tenant.property.name || 'N/A'} - ${tenant.property.name || 'N/A'}` : 'N/A'}
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
                         <div className="flex items-center justify-between">
                           <span className="text-sm text-gray-900">Not invited</span>
                           <button className="p-1 rounded-full hover:bg-gray-100">
                             <MoreHorizontal className="h-4 w-4 text-gray-400" />
                           </button>
                         </div>
                       </td>
                     </tr>
                   );
                 })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
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