import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../utils/axios';
import { invalidateTenantCaches } from '../utils/cacheUtils';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Home, 
  Calendar, 
  DollarSign, 
  Edit, 
  X, 
  MapPin,
  Building2,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const TenantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  // Fetch tenant details
  const { data: tenant, isLoading, error } = useQuery(
    ['tenant', id],
    async () => {
      const response = await api.get(`/api/tenants/${id}`);
      return response.data;
    }
  );

  // Fetch tenant's maintenance requests
  const { data: maintenanceRequests = [], isLoading: maintenanceLoading } = useQuery(
    ['tenant-maintenance', id],
    async () => {
      const response = await api.get(`/api/maintenance/requests?tenant_id=${id}`);
      return response.data.items || [];
    },
    { enabled: !!id }
  );

  const handleEditClick = () => {
    if (tenant) {
      setEditFormData({
        full_name: tenant.name || tenant.full_name,
        email: tenant.email,
        phone_number: tenant.phone || tenant.phone_number,
        lease_start: tenant.leaseStartDate || tenant.lease_start,
        lease_end: tenant.leaseEndDate || tenant.lease_end,
        rent_payment_day: tenant.rent_payment_day || 1
      });
      setIsEditModalOpen(true);
    }
  };

  const handleInputChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateTenantMutation = useMutation(
    async (data) => {
      const response = await api.put(`/api/tenants/${id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        invalidateTenantCaches(queryClient);
        queryClient.invalidateQueries(['tenant', id]);
        toast.success('Tenant updated successfully');
        setIsEditModalOpen(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update tenant');
      }
    }
  );

  const handleSave = () => {
    updateTenantMutation.mutate(editFormData);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getLeaseStatus = () => {
    if (!tenant?.leaseEndDate && !tenant?.lease_end) return { status: 'No Lease', color: 'gray' };
    
    const leaseEnd = new Date(tenant.leaseEndDate || tenant.lease_end);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((leaseEnd - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'Expired', color: 'red' };
    if (daysUntilExpiry <= 30) return { status: `Expires in ${daysUntilExpiry} days`, color: 'yellow' };
    return { status: 'Active', color: 'green' };
  };

  const getMaintenanceStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading tenant details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        <div className="text-lg">Error loading tenant: {error.message}</div>
        <button 
          onClick={() => navigate('/tenants')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Tenants
        </button>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center">
        <div className="text-lg">Tenant not found</div>
        <button 
          onClick={() => navigate('/tenants')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Tenants
        </button>
      </div>
    );
  }

  const leaseStatus = getLeaseStatus();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/tenants')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Tenants
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {tenant.name || tenant.full_name}
          </h1>
        </div>
        <button
          onClick={handleEditClick}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Tenant
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tenant Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{tenant.email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{tenant.phone || tenant.phone_number || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Property Information */}
          {tenant.property && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Home className="h-5 w-5 mr-2 text-blue-600" />
                Property Details
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Building2 className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Property</p>
                    <p className="font-medium">{tenant.property.name || tenant.property.title}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{tenant.property.address || 'Address not available'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Maintenance Requests */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Maintenance Requests
            </h2>
            {maintenanceLoading ? (
              <p className="text-gray-500">Loading maintenance requests...</p>
            ) : maintenanceRequests.length > 0 ? (
              <div className="space-y-3">
                {maintenanceRequests.slice(0, 5).map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{request.request_title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{request.request_description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Created: {formatDate(request.created_at)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMaintenanceStatusColor(request.status)}`}>
                        {request.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
                {maintenanceRequests.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    And {maintenanceRequests.length - 5} more requests...
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No maintenance requests found.</p>
            )}
          </div>
        </div>

        {/* Right Column - Lease Info */}
        <div className="space-y-6">
          {/* Lease Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Lease Information
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  leaseStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                  leaseStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  leaseStatus.color === 'red' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {leaseStatus.color === 'green' ? <CheckCircle className="h-4 w-4 mr-1" /> :
                   leaseStatus.color === 'yellow' ? <AlertCircle className="h-4 w-4 mr-1" /> :
                   leaseStatus.color === 'red' ? <AlertCircle className="h-4 w-4 mr-1" /> :
                   <Clock className="h-4 w-4 mr-1" />}
                  {leaseStatus.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Lease Start</p>
                <p className="font-medium">{formatDate(tenant.leaseStartDate || tenant.lease_start)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Lease End</p>
                <p className="font-medium">{formatDate(tenant.leaseEndDate || tenant.lease_end)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Rent Payment Day</p>
                <p className="font-medium">{tenant.rent_payment_day || 1} of each month</p>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
              Financial Information
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Monthly Rent</p>
                <p className="text-2xl font-bold text-green-600">
                  ${tenant.rentAmount || tenant.rent_amount || '0'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Status</p>
                <p className="font-medium capitalize">{tenant.status || tenant.payment_status || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Edit Tenant</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editFormData.full_name || ''}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={editFormData.phone_number || ''}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lease Start Date
                  </label>
                  <input
                    type="date"
                    value={editFormData.lease_start || ''}
                    onChange={(e) => handleInputChange('lease_start', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lease End Date
                  </label>
                  <input
                    type="date"
                    value={editFormData.lease_end || ''}
                    onChange={(e) => handleInputChange('lease_end', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rent Payment Day
                </label>
                <select
                  value={editFormData.rent_payment_day || '1'}
                  onChange={(e) => handleInputChange('rent_payment_day', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>
                      {day === 1 ? '1st' : 
                       day === 2 ? '2nd' : 
                       day === 3 ? '3rd' : 
                       `${day}th`} of each month
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateTenantMutation.isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {updateTenantMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantDetail;
