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

  const handleManageCategories = () => {
    navigate('/maintenance/vendors/categories');
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Vendors</h1>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button 
              onClick={handleAddVendor}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Add vendor
            </button>
            <button 
              onClick={handleManageCategories}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Manage categories
            </button>
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
              Compose email
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Results */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        {/* Filter Section */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All categories</option>
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="hvac">HVAC</option>
              <option value="landscaping">Landscaping</option>
              <option value="cleaning">Cleaning</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filterOption}
              onChange={(e) => setFilterOption(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Add filter option</option>
              <option value="active">Active vendors</option>
              <option value="inactive">Inactive vendors</option>
              <option value="insurance-expiring">Insurance expiring soon</option>
              <option value="high-rated">High rated</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Results Count and Export */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-2 sm:space-y-0">
          <div className="text-sm text-gray-600">
            0 matches
          </div>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <span>FIRST NAME</span>
                    <ChevronDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LAST NAME
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PHONE
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EMAIL
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CATEGORY
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RENTAL OWNER
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  INSURANCE PROVIDER
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EXPIRES
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  WEBSITE
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="10" className="text-center py-12 text-gray-500">
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
                  <td colSpan="10" className="text-center py-12 text-gray-500">
                    <div className="space-y-2">
                      <p>We didn't find any vendors. Maybe you don't have any or maybe you need to{' '}
                        <button 
                          onClick={handleClearFilters}
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          clear your filters
                        </button>
                        .
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                vendors.map((vendor) => (
                  <tr key={vendor.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {vendor.first_name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {vendor.last_name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {vendor.phone_1 || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {vendor.primary_email}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {vendor.category ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {vendor.category.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {vendor.rental_owner ? (
                        <div>
                          <div className="font-medium text-gray-900">{vendor.rental_owner.company_name}</div>
                          {vendor.rental_owner.contact_person && (
                            <div className="text-xs text-gray-500">{vendor.rental_owner.contact_person}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {vendor.insurance_provider || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {vendor.insurance_expiration_date || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {vendor.website ? (
                        <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                          {vendor.website}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewVendor(vendor)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                          title="View vendor"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleEditVendor(vendor)}
                          className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                          title="Edit vendor"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteVendor(vendor)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
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
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Vendor Details</h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedVendor.first_name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedVendor.last_name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedVendor.primary_email || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedVendor.phone_1 || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedVendor.category ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {selectedVendor.category.name}
                      </span>
                    ) : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedVendor.company_name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rental Owner</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedVendor.rental_owner ? (
                      <div>
                        <div className="font-medium">{selectedVendor.rental_owner.company_name}</div>
                        {selectedVendor.rental_owner.contact_person && (
                          <div className="text-xs text-gray-500">{selectedVendor.rental_owner.contact_person}</div>
                        )}
                      </div>
                    ) : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Insurance Provider</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedVendor.insurance_provider || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Insurance Expires</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedVendor.insurance_expiration_date || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Website</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedVendor.website ? (
                      <a href={selectedVendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        {selectedVendor.website}
                      </a>
                    ) : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="mt-1 text-sm text-gray-900">
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
                  <label className="block text-sm font-medium text-gray-700">Comments</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedVendor.comments}</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Delete Vendor</h2>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{selectedVendor.first_name} {selectedVendor.last_name}</strong>? 
              This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
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
