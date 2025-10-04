import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { ChevronDown, Download, Eye, Edit, Trash2, X } from 'lucide-react';
import api from '../utils/axios';
import EditVendorModal from '../components/EditVendorModal';

const Vendors = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterOption, setFilterOption] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch vendors
  const { data: vendors, isLoading, error } = useQuery(
    'vendors',
    async () => {
      try {
        const response = await api.get('/api/vendors');
        return response.data;
      } catch (error) {
        console.error('Error fetching vendors:', error);
        throw error;
      }
    },
    { 
      retry: 1
    }
  );

  // Fetch vendor categories
  const { data: categories = [] } = useQuery(
    'vendor-categories',
    async () => {
      try {
        const response = await api.get('/api/vendors/categories');
        return response.data;
      } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
    },
    { 
      retry: 1
    }
  );

  // Fetch rental owners
  const { data: rentalOwners = [] } = useQuery(
    'rental-owners',
    async () => {
      try {
        const response = await api.get('/api/rental-owners/rental-owners');
        const data = response.data?.rental_owners || response.data || [];
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching rental owners:', error);
        return [];
      }
    },
    { 
      retry: 1
    }
  );

  // Delete vendor mutation
  const deleteVendorMutation = useMutation(
    async (vendorId) => {
      const response = await api.delete(`/api/vendors/${vendorId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vendors');
        setIsDeleteModalOpen(false);
        setSelectedVendor(null);
      },
      onError: (error) => {
        console.error('Error deleting vendor:', error);
        alert('Failed to delete vendor. Please try again.');
      }
    }
  );

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export vendors');
  };

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setFilterOption('');
  };

  const handleAddVendor = () => {
    navigate('/maintenance/vendors/add');
  };


  const handleViewVendor = (vendor) => {
    setSelectedVendor(vendor);
    setIsViewModalOpen(true);
  };

  const handleEditVendor = (vendor) => {
    setSelectedVendor(vendor);
    setIsEditModalOpen(true);
  };

  const handleDeleteVendor = (vendor) => {
    setSelectedVendor(vendor);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteVendor = () => {
    if (selectedVendor) {
      deleteVendorMutation.mutate(selectedVendor.id);
    }
  };

  const handleVendorUpdated = () => {
    queryClient.invalidateQueries('vendors');
    setIsEditModalOpen(false);
    setSelectedVendor(null);
  };

  // Filter vendors based on selected filters
  const filteredVendors = React.useMemo(() => {
    if (!vendors) return [];
    
    let filtered = vendors;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(vendor => 
        vendor.category && vendor.category.name.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    
    // Filter by rental owner
    if (filterOption && filterOption !== '') {
      filtered = filtered.filter(vendor => 
        vendor.rental_owner && vendor.rental_owner.company_name === filterOption
      );
    }
    
    return filtered;
  }, [vendors, selectedCategory, filterOption]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Enhanced Header */}
      <div className="glass-card p-6 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <span className="text-white text-xl">🔧</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Vendors</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">Manage your vendor network and service providers</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300">
              <span>Total: {vendors?.length || 0}</span>
              <span>•</span>
              <span>Categories: {categories?.length || 0}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button 
              onClick={handleAddVendor}
              className="btn-success flex items-center justify-center sm:justify-start space-x-2 hover-glow"
            >
              <span>+</span>
              <span>Add Vendor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Results */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
        {/* Filter Section */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 dark:text-gray-300 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filterOption}
              onChange={(e) => setFilterOption(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All rental owners</option>
              {Array.isArray(rentalOwners) && rentalOwners.map((owner) => (
                <option key={owner.id} value={owner.company_name}>
                  {owner.company_name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 dark:text-gray-300 pointer-events-none" />
          </div>
        </div>

        {/* Results Count and Export */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-2 sm:space-y-0">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {filteredVendors.length} matches
          </div>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:text-gray-200 transition-colors text-sm"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <span>FIRST NAME</span>
                    <ChevronDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  LAST NAME
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  PHONE
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  EMAIL
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  CATEGORY
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  RENTAL OWNER
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  INSURANCE PROVIDER
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  EXPIRES
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  WEBSITE
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="10" className="text-center py-12 text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300">
                    Loading vendors...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="10" className="text-center py-12 text-red-500">
                    Failed to load vendors. Please try again.
                  </td>
                </tr>
              ) : !vendors || vendors.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-12 text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300">
                    <div className="space-y-2">
                      <p>We didn't find any vendors. Maybe you don't have any or maybe you need to{' '}
                        <button 
                          onClick={handleClearFilters}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200 underline"
                        >
                          clear your filters
                        </button>
                        .
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-12 text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300">
                    <div className="space-y-2">
                      <p>No vendors match your current filters. Try{' '}
                        <button 
                          onClick={handleClearFilters}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200 underline"
                        >
                          clearing your filters
                        </button>
                        {' '}to see all vendors.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900">
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {vendor.first_name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {vendor.last_name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {vendor.phone_1 || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {vendor.primary_email}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {vendor.category ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                          {vendor.category.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 dark:text-gray-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {vendor.rental_owner ? (
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{vendor.rental_owner.company_name}</div>
                          {vendor.rental_owner.contact_person && (
                            <div className="text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300">{vendor.rental_owner.contact_person}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 dark:text-gray-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {vendor.insurance_provider || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {vendor.insurance_expiration_date || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {vendor.website ? (
                        <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200">
                          {vendor.website}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewVendor(vendor)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200 p-1 rounded hover:bg-blue-50"
                          title="View vendor"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleEditVendor(vendor)}
                          className="text-green-600 dark:text-green-400 hover:text-green-800 dark:text-green-200 p-1 rounded hover:bg-green-50"
                          title="Edit vendor"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteVendor(vendor)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:text-red-200 p-1 rounded hover:bg-red-50"
                          title="Delete vendor"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Vendor Modal */}
      {isViewModalOpen && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Vendor Details</h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 dark:text-gray-500 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedVendor.first_name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedVendor.last_name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedVendor.primary_email || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedVendor.phone_1 || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedVendor.category ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                        {selectedVendor.category.name}
                      </span>
                    ) : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedVendor.company_name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rental Owner</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedVendor.rental_owner ? (
                      <div>
                        <div className="font-medium">{selectedVendor.rental_owner.company_name}</div>
                        {selectedVendor.rental_owner.contact_person && (
                          <div className="text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300">{selectedVendor.rental_owner.contact_person}</div>
                        )}
                      </div>
                    ) : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Insurance Provider</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedVendor.insurance_provider || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Insurance Expires</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedVendor.insurance_expiration_date || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Website</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedVendor.website ? (
                      <a href={selectedVendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200">
                        {selectedVendor.website}
                      </a>
                    ) : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedVendor.street_address ? (
                      <>
                        {selectedVendor.street_address}<br />
                        {selectedVendor.city}, {selectedVendor.state} {selectedVendor.zip_code}
                      </>
                    ) : '-'}
                  </p>
                </div>
              </div>
              
              {selectedVendor.comments && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Comments</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedVendor.comments}</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEditVendor(selectedVendor);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Edit Vendor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete Vendor</h2>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-400 dark:text-gray-500 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete <strong>{selectedVendor.first_name} {selectedVendor.last_name}</strong>? 
              This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteVendor}
                disabled={deleteVendorMutation.isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteVendorMutation.isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Vendor Modal */}
      <EditVendorModal
        vendor={selectedVendor}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedVendor(null);
        }}
        onVendorUpdated={handleVendorUpdated}
      />
    </div>
  );
};

export default Vendors;
