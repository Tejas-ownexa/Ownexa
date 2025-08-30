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