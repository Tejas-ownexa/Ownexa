import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  Download, 
  Upload,
  MoreHorizontal, 
  ChevronUp,
  ChevronDown,
  Filter,
  Search,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  UserPlus
} from 'lucide-react';
import toast from 'react-hot-toast';

const RentalOwners = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [owners, setOwners] = useState([]);
  const [showAddOwner, setShowAddOwner] = useState(false);
  const [newOwnerData, setNewOwnerData] = useState({
    company_name: '',
    contact_email: '',
    contact_phone: '',
    business_type: '',
    city: '',
    state: ''
  });
  const [sortField, setSortField] = useState('company_name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRentals, setFilterRentals] = useState('all');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmData, setDeleteConfirmData] = useState(null);

  // Fetch rental owners using useQuery
  const { data: ownersData, isLoading, error } = useQuery(
    ['rental-owners'],
    async () => {
      const response = await api.get('/api/rental-owners');
      return response.data.rental_owners || [];
    },
    {
      onError: (error) => {
        console.error('Error fetching owners:', error);
        toast.error('Failed to load rental owners');
      }
    }
  );

  // Update local state when data changes
  useEffect(() => {
    if (ownersData) {
      setOwners(Array.isArray(ownersData) ? ownersData : []);
    } else {
      setOwners([]);
    }
  }, [ownersData]);

  // Add owner handler
  const handleAddOwner = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newOwnerData.company_name || !newOwnerData.contact_email) {
      toast.error('Please fill in all required fields (Company Name and Contact Email)');
      return;
    }
    
    try {
      console.log('🔍 Sending rental owner data:', newOwnerData);
      console.log('🔍 API endpoint: /api/rental-owners');
      
        const response = await api.post('/api/rental-owners', newOwnerData);
      console.log('✅ Response received:', response);
      console.log('✅ Response status:', response.status);
      console.log('✅ Response data:', response.data);
      
      if (response.status === 201 || response.data.success) {
        toast.success('Rental owner added successfully!');
        setShowAddOwner(false);
        setNewOwnerData({ company_name: '', contact_email: '', contact_phone: '', business_type: '', city: '', state: '' });
        queryClient.invalidateQueries(['rental-owners']);
      } else {
        console.error('❌ Unexpected response:', response);
        toast.error('Failed to add rental owner: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Add owner error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error headers:', error.response?.headers);
      
      // More specific error messages
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 400) {
        toast.error('Invalid data: ' + (error.response.data?.error || 'Please check your input'));
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Failed to add rental owner. Please try again.');
      }
    }
  };

  // Delete owner handler
  const handleDeleteOwner = async (ownerId) => {
    try {
        const response = await api.delete(`/api/rental-owners/${ownerId}`);
      toast.success('Rental owner deleted successfully!');
      queryClient.invalidateQueries(['rental-owners']);
    } catch (error) {
      console.error('Delete error:', error);
      
      // Check if this is a confirmation required error
      if (error.response?.data?.error === 'confirmation_required') {
        setDeleteConfirmData({
          ...error.response.data,
          rental_owner_id: ownerId
        });
        setShowDeleteConfirm(true);
      } else {
        toast.error('Failed to delete rental owner. Please try again.');
      }
    }
  };

  // Force delete handler
  const handleForceDelete = async () => {
    if (!deleteConfirmData) return;
    
    try {
      const rentalOwnerId = deleteConfirmData.rental_owner_id;
        const response = await api.delete(`/api/rental-owners/${rentalOwnerId}/force-delete`);
      toast.success('Rental owner and all properties deleted successfully!');
      setShowDeleteConfirm(false);
      setDeleteConfirmData(null);
      queryClient.invalidateQueries(['rental-owners']);
    } catch (error) {
      console.error('Force delete error:', error);
      toast.error('Failed to delete rental owner. Please try again.');
    }
  };

  // Export owners to CSV
  const handleExport = () => {
    const csvContent = [
      ['COMPANY NAME', 'BUSINESS TYPE', 'LOCATION', 'PHONE', 'EMAIL', 'PROPERTY COUNT'],
      ...owners.map(owner => [
        owner.company_name || '',
        owner.business_type || '',
        owner.city && owner.state ? `${owner.city}, ${owner.state}` : '',
        owner.contact_phone || '',
        owner.contact_email || '',
        owner.property_count || 0
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rental_owners_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Rental owners exported successfully!');
  };

  // Import owners from CSV
  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a CSV file');
      return;
    }

    const formData = new FormData();
    formData.append('csv_file', selectedFile);

    try {
        const response = await api.post('/api/rental-owners/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success(`Successfully imported ${response.data.imported_count} rental owners!`);
        queryClient.invalidateQueries(['rental-owners']);
        setSelectedFile(null);
      } else {
        toast.error('Import failed: ' + response.data.error);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import rental owners. Please check your CSV format.');
    }
  };

  // Download CSV template
  const handleDownloadTemplate = () => {
    const csvTemplate = [
      ['COMPANY_NAME', 'BUSINESS_TYPE', 'CONTACT_EMAIL', 'CONTACT_PHONE', 'CITY', 'STATE', 'ZIP_CODE'],
      ['Sunshine Properties LLC', 'Real Estate Investment', 'john@sunshineproperties.com', '+1-555-0123', 'Miami', 'FL', '33101'],
      ['Golden State Real Estate Corp', 'Property Management', 'sarah@goldenstate.com', '+1-555-0124', 'Los Angeles', 'CA', '90210']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'rental_owners_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Template downloaded successfully!');
  };

  // Filter and sort owners
  const filteredOwners = React.useMemo(() => {
    let filtered = Array.isArray(owners) ? owners : [];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(owner => 
        owner.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.business_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.contact_phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'company_name':
          aValue = a.company_name || '';
          bValue = b.company_name || '';
          break;
        case 'business_type':
          aValue = a.business_type || '';
          bValue = b.business_type || '';
          break;
        case 'city':
          aValue = a.city || '';
          bValue = b.city || '';
          break;
        case 'contact_email':
          aValue = a.contact_email || '';
          bValue = b.contact_email || '';
          break;
        case 'contact_phone':
          aValue = a.contact_phone || '';
          bValue = b.contact_phone || '';
          break;
        default:
          aValue = a.company_name || '';
          bValue = b.company_name || '';
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
  }, [owners, searchTerm, sortField, sortDirection]);

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
      return <ChevronDown className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4 text-gray-600" /> : 
      <ChevronDown className="h-4 w-4 text-gray-600" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Rental owners</h1>
        
        {/* Top buttons */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowAddOwner(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add company
          </button>
          
          <div className="relative">
            <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Management fees</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          
          <div className="relative">
            <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Owner draw</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          
          <div className="relative">
            <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Owner contribution</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          
          <button className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            <Mail className="h-4 w-4 mr-2" />
            Compose email
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <select 
              value={filterRentals}
              onChange={(e) => setFilterRentals(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All rentals</option>
              <option value="active">Active rentals</option>
              <option value="inactive">Inactive rentals</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Filter className="h-4 w-4 mr-2" />
            Add filter option
            <ChevronDown className="h-4 w-4 ml-2" />
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">{filteredOwners.length} matches</span>
        
        <div className="flex items-center space-x-2">
          {/* Import Section */}
          <div className="flex items-center space-x-2">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </label>
            {selectedFile && (
              <button
                onClick={handleImport}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Import File
              </button>
            )}
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Template
            </button>
          </div>
          
          <button
            onClick={handleExport}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search rental owners..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('company_name')}
              >
                <div className="flex items-center space-x-1">
                  <span>COMPANY NAME</span>
                  {getSortIcon('company_name')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('business_type')}
              >
                <div className="flex items-center space-x-1">
                  <span>BUSINESS TYPE</span>
                  {getSortIcon('business_type')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('city')}
              >
                <div className="flex items-center space-x-1">
                  <span>LOCATION</span>
                  {getSortIcon('city')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('contact_phone')}
              >
                <div className="flex items-center space-x-1">
                  <span>PHONE</span>
                  {getSortIcon('contact_phone')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('contact_email')}
              >
                <div className="flex items-center space-x-1">
                  <span>EMAIL</span>
                  {getSortIcon('contact_email')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOwners.length > 0 ? (
              filteredOwners.map((owner) => (
                <tr key={owner.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div 
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                      onClick={() => navigate(`/rental-owners/${owner.id}`)}
                    >
                      {owner.company_name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {owner.business_type || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {owner.city && owner.state ? `${owner.city}, ${owner.state}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {owner.contact_phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {owner.contact_email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteOwner(owner.id)}
                        className="text-red-400 hover:text-red-600"
                        title="Delete owner"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                  No rental owners found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Owner Modal */}
      {showAddOwner && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Rental Owner</h3>
                             <form onSubmit={handleAddOwner}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={newOwnerData.company_name}
                      onChange={(e) => setNewOwnerData({...newOwnerData, company_name: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Business Type</label>
                    <input
                      type="text"
                      value={newOwnerData.business_type}
                      onChange={(e) => setNewOwnerData({...newOwnerData, business_type: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                    <input
                      type="email"
                      value={newOwnerData.contact_email}
                      onChange={(e) => setNewOwnerData({...newOwnerData, contact_email: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                    <input
                      type="tel"
                      value={newOwnerData.contact_phone}
                      onChange={(e) => setNewOwnerData({...newOwnerData, contact_phone: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">City</label>
                      <input
                        type="text"
                        value={newOwnerData.city}
                        onChange={(e) => setNewOwnerData({...newOwnerData, city: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">State</label>
                      <input
                        type="text"
                        value={newOwnerData.state}
                        onChange={(e) => setNewOwnerData({...newOwnerData, state: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddOwner(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Add Company
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deleteConfirmData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4 text-center">Delete Rental Owner</h3>
              <div className="mt-4">
                <p className="text-sm text-gray-500 text-center mb-4">
                  {deleteConfirmData.message}
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-red-800 mb-2">Properties that will be deleted:</h4>
                  <div className="space-y-2">
                    {deleteConfirmData.properties.map((property, index) => (
                      <div key={property.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">{property.title}</span>
                        <span className="text-gray-500">{property.address}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          property.status === 'occupied' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {property.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <p className="text-sm text-red-600 text-center font-medium">
                  ⚠️ This action cannot be undone. All properties and their associated data will be permanently deleted.
                </p>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmData(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleForceDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentalOwners;
