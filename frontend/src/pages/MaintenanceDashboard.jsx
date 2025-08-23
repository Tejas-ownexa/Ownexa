import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/axios';
import { 
  Wrench, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  User, 
  Phone, 
  Calendar,
  DollarSign,
  Filter,
  Search,
  TrendingUp,
  FileText,
  MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';

const MaintenanceDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, assigned, recent, completed
  
  // Status update modal state
  const [statusUpdateModal, setStatusUpdateModal] = useState({
    isOpen: false,
    request: null,
    status: '',
    notes: '',
    actualCost: ''
  });

  // Fetch maintenance requests
  const { data: maintenanceRequests, isLoading } = useQuery(
    ['maintenance-requests'],
    async () => {
      const response = await api.get('/api/maintenance/requests');
      return response.data;
    },
    {
      onError: (error) => {
        toast.error('Failed to load maintenance requests');
      }
    }
  );

  // Fetch available vendors (for property owners)
  const { data: vendors } = useQuery(
    ['vendors'],
    async () => {
      const response = await api.get('/api/maintenance/vendors');
      return response.data;
    },
    {
      enabled: user?.role === 'OWNER' || user?.role === 'AGENT',
      onError: (error) => {
        console.error('Error fetching vendors:', error);
      }
    }
  );

  // Assign vendor mutation
  const assignVendorMutation = useMutation(
    async ({ requestId, vendorId, scheduledDate, estimatedCost, notes }) => {
      const response = await api.post(`/api/maintenance/requests/${requestId}/assign-vendor`, {
        vendor_id: vendorId,
        scheduled_date: scheduledDate,
        estimated_cost: estimatedCost,
        owner_notes: notes
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['maintenance-requests']);
        toast.success('Vendor assigned successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to assign vendor');
      }
    }
  );

  // Update status mutation
  const updateStatusMutation = useMutation(
    async ({ requestId, status, notes, actualCost }) => {
      const response = await api.put(`/api/maintenance/requests/${requestId}/update-status`, {
        status,
        notes,
        actual_cost: actualCost
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['maintenance-requests']);
        toast.success('Status updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update status');
      }
    }
  );

  // Self-assign mutation for vendors
  const selfAssignMutation = useMutation(
    async (requestId) => {
      const response = await api.post(`/api/maintenance/requests/${requestId}/self-assign`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['maintenance-requests']);
        toast.success('Successfully assigned to request');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to assign to request');
      }
    }
  );

  // Filter requests based on active tab and other filters
  const filteredRequests = maintenanceRequests?.filter(request => {
    // Tab filtering
    let tabMatch = true;
    if (activeTab === 'assigned') {
      tabMatch = request.assigned_vendor && request.status === 'assigned';
    } else if (activeTab === 'recent') {
      const requestDate = new Date(request.request_date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      tabMatch = requestDate >= thirtyDaysAgo;
    } else if (activeTab === 'completed') {
      tabMatch = request.status === 'completed';
    } else if (activeTab === 'pending') {
      tabMatch = request.status === 'pending' && !request.assigned_vendor;
    }

    // Other filters
    const matchesStatus = selectedStatus === 'all' || request.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || request.priority === selectedPriority;
    const matchesSearch = searchTerm === '' || 
      request.request_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.request_description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return tabMatch && matchesStatus && matchesPriority && matchesSearch;
  }) || [];

  // Get statistics for vendor dashboard
  const getVendorStats = () => {
    if (!maintenanceRequests) return {};
    
    const assignedRequests = maintenanceRequests.filter(req => req.assigned_vendor);
    const completedRequests = assignedRequests.filter(req => req.status === 'completed');
    const inProgressRequests = assignedRequests.filter(req => req.status === 'in_progress');
    const pendingRequests = assignedRequests.filter(req => req.status === 'assigned');
    
    return {
      total: assignedRequests.length,
      completed: completedRequests.length,
      inProgress: inProgressRequests.length,
      pending: pendingRequests.length,
      completionRate: assignedRequests.length > 0 ? Math.round((completedRequests.length / assignedRequests.length) * 100) : 0
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'assigned':
        return <User className="h-4 w-4" />;
      case 'in_progress':
        return <Wrench className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Open status update modal
  const openStatusUpdateModal = (request) => {
    setStatusUpdateModal({
      isOpen: true,
      request: request,
      status: request.status,
      notes: '',
      actualCost: request.actual_cost || ''
    });
  };

  // Close status update modal
  const closeStatusUpdateModal = () => {
    setStatusUpdateModal({
      isOpen: false,
      request: null,
      status: '',
      notes: '',
      actualCost: ''
    });
  };

  // Handle status update submission
  const handleStatusUpdate = () => {
    if (!statusUpdateModal.status) {
      toast.error('Please select a status');
      return;
    }

    updateStatusMutation.mutate({
      requestId: statusUpdateModal.request.id,
      status: statusUpdateModal.status,
      notes: statusUpdateModal.notes,
      actualCost: statusUpdateModal.actualCost ? parseFloat(statusUpdateModal.actualCost) : null
    });

    closeStatusUpdateModal();
  };

  // Get available status options based on user role and current status
  const getAvailableStatusOptions = (currentStatus) => {
    const allStatuses = [
      { value: 'pending', label: 'Pending' },
      { value: 'assigned', label: 'Assigned' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' }
    ];

    if (user?.role === 'VENDOR') {
      // Vendors can move from assigned -> in_progress -> completed
      if (currentStatus === 'assigned') {
        return allStatuses.filter(s => ['assigned', 'in_progress'].includes(s.value));
      } else if (currentStatus === 'in_progress') {
        return allStatuses.filter(s => ['in_progress', 'completed'].includes(s.value));
      } else if (currentStatus === 'completed') {
        return allStatuses.filter(s => s.value === 'completed');
      }
      return allStatuses.filter(s => ['assigned', 'in_progress', 'completed'].includes(s.value));
    } else if (user?.role === 'OWNER' || user?.role === 'AGENT') {
      // Property owners can change to any status
      return allStatuses;
    }
    
    return allStatuses;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading maintenance requests...</div>
      </div>
    );
  }

  const vendorStats = getVendorStats();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user?.role === 'VENDOR' ? 'Vendor Dashboard' : 'Maintenance Requests'}
              </h1>
              <p className="text-gray-600 mt-1">
                {user?.role === 'VENDOR' 
                  ? 'Manage your assigned maintenance requests and track work progress'
                  : 'Manage and track maintenance issues'
                }
              </p>
            </div>
            {(user?.role === 'TENANT') && (
              <button
                onClick={() => navigate('/maintenance/new')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </button>
            )}
          </div>
        </div>

        {/* Vendor Statistics Dashboard */}
        {user?.role === 'VENDOR' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Wrench className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Assigned</p>
                  <p className="text-2xl font-bold text-gray-900">{vendorStats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{vendorStats.completed}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{vendorStats.inProgress}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{vendorStats.completionRate}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs for Vendor Dashboard */}
        {user?.role === 'VENDOR' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'all', name: 'All Requests', count: maintenanceRequests?.length || 0 },
                  { id: 'assigned', name: 'Assigned to Me', count: vendorStats.total },
                  { id: 'pending', name: 'Pending (Available)', count: maintenanceRequests?.filter(req => req.status === 'pending' && !req.assigned_vendor).length || 0 },
                  { id: 'recent', name: 'Recent (30 days)', count: maintenanceRequests?.filter(req => {
                    const requestDate = new Date(req.request_date);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return requestDate >= thirtyDaysAgo;
                  }).length || 0 },
                  { id: 'completed', name: 'Completed', count: vendorStats.completed }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.name}
                    <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                      {tab.count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSelectedStatus('all');
                setSelectedPriority('all');
                setSearchTerm('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No maintenance requests found</h3>
              <p className="text-gray-600">
                {activeTab === 'assigned' 
                  ? 'No requests are currently assigned to you.'
                  : activeTab === 'pending'
                  ? 'No pending requests available for assignment.'
                  : activeTab === 'recent'
                  ? 'No recent requests found in the last 30 days.'
                  : activeTab === 'completed'
                  ? 'No completed requests found.'
                  : 'No requests match your current filters.'
                }
              </p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{request.request_title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                        {request.priority.toUpperCase()}
                      </span>
                      {user?.role === 'VENDOR' && !request.assigned_vendor && request.status === 'pending' && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          AVAILABLE
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{request.request_description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {request.property?.title}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(request.request_date)}
                      </span>
                      {request.scheduled_date && (
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Scheduled: {formatDate(request.scheduled_date)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Status Icon */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                    {getStatusIcon(request.status)}
                  </div>
                </div>

                {/* Tenant Information */}
                {request.tenant && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Tenant Information</h4>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-700">
                        <strong>{request.tenant.full_name}</strong>
                      </span>
                      <span className="text-gray-600">
                        <Phone className="h-3 w-3 inline mr-1" />
                        {request.tenant.phone_number}
                      </span>
                      <span className="text-gray-600">{request.tenant.email}</span>
                    </div>
                  </div>
                )}

                {/* Vendor Information */}
                {request.assigned_vendor && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-blue-900 mb-2">Assigned Vendor</h4>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-blue-800">
                        <strong>{request.assigned_vendor.business_name}</strong> ({request.assigned_vendor.vendor_type})
                      </span>
                      <span className="text-blue-700">
                        <Phone className="h-3 w-3 inline mr-1" />
                        {request.assigned_vendor.phone_number}
                      </span>
                      <span className="text-blue-700">{request.assigned_vendor.email}</span>
                    </div>
                  </div>
                )}

                {/* Cost Information */}
                {(request.estimated_cost || request.actual_cost) && (
                  <div className="flex gap-4 text-sm mb-4">
                    {request.estimated_cost && (
                      <span className="text-gray-600">
                        <DollarSign className="h-3 w-3 inline mr-1" />
                        Estimated: {formatCurrency(request.estimated_cost)}
                      </span>
                    )}
                    {request.actual_cost && (
                      <span className="text-gray-600">
                        <DollarSign className="h-3 w-3 inline mr-1" />
                        Actual: {formatCurrency(request.actual_cost)}
                      </span>
                    )}
                  </div>
                )}

                {/* Notes */}
                {(request.tenant_notes || request.vendor_notes || request.owner_notes) && (
                  <div className="space-y-2 mb-4">
                    {request.tenant_notes && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Tenant Notes:</span>
                        <p className="text-gray-600 mt-1">{request.tenant_notes}</p>
                      </div>
                    )}
                    {request.vendor_notes && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Vendor Notes:</span>
                        <p className="text-gray-600 mt-1">{request.vendor_notes}</p>
                      </div>
                    )}
                    {request.owner_notes && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Owner Notes:</span>
                        <p className="text-gray-600 mt-1">{request.owner_notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-2">
                  {(user?.role === 'VENDOR' && !request.assigned_vendor) && (
                    <button
                      onClick={() => selfAssignMutation.mutate(request.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Self-Assign
                    </button>
                  )}
                  
                  {(user?.role === 'OWNER' || user?.role === 'AGENT') && !request.assigned_vendor && (
                    <button
                      onClick={() => {
                        // Open vendor assignment modal
                        console.log('Assign vendor to request:', request.id);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Assign Vendor
                    </button>
                  )}
                  
                  {/* Show Update Status button based on role and assignment */}
                  {((user?.role === 'VENDOR' && request.assigned_vendor && request.assigned_vendor.email === user.email) ||
                    (user?.role === 'OWNER' || user?.role === 'AGENT')) && (
                    <button
                      onClick={() => openStatusUpdateModal(request)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Update Status
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Status Update Modal */}
        {statusUpdateModal.isOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Update Status: {statusUpdateModal.request?.request_title}
              </h3>
              
              <div className="space-y-4">
                {/* Current Status Display */}
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Current Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(statusUpdateModal.request?.status)}`}>
                    {statusUpdateModal.request?.status?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                {/* New Status Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Status
                  </label>
                  <select
                    value={statusUpdateModal.status}
                    onChange={(e) => setStatusUpdateModal({
                      ...statusUpdateModal,
                      status: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {getAvailableStatusOptions(statusUpdateModal.request?.status).map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actual Cost (for completed requests) */}
                {statusUpdateModal.status === 'completed' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Actual Cost ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={statusUpdateModal.actualCost}
                      onChange={(e) => setStatusUpdateModal({
                        ...statusUpdateModal,
                        actualCost: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter actual cost"
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {user?.role === 'VENDOR' ? 'Vendor Notes' : 
                     user?.role === 'OWNER' || user?.role === 'AGENT' ? 'Owner Notes' : 
                     'Notes'}
                  </label>
                  <textarea
                    value={statusUpdateModal.notes}
                    onChange={(e) => setStatusUpdateModal({
                      ...statusUpdateModal,
                      notes: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Add notes about this status update..."
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={closeStatusUpdateModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={updateStatusMutation.isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateStatusMutation.isLoading ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceDashboard;
