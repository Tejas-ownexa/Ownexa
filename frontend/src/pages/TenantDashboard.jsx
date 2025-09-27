import React from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/axios';
import { Home, Calendar, DollarSign, Wrench, User, AlertCircle } from 'lucide-react';

const StatCard = ({ title, value, description, icon, color = 'blue' }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`text-${color}-600`}>
            {icon}
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
              {title}
            </dt>
            <dd className="text-lg font-medium text-gray-900">
              {value}
            </dd>
            <dd className="text-sm text-gray-500 dark:text-gray-300">
              {description}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

const TenantDashboard = () => {
  const { user } = useAuth();

  // Fetch tenant unit information
  const { data: tenantData, isLoading: tenantLoading } = useQuery(
    ['tenant-unit'],
    async () => {
      const response = await api.get('/api/tenants/my-unit');
      return response.data;
    },
    { enabled: !!user?.id }
  );

  // Fetch tenant's maintenance requests
  const { data: maintenanceData, isLoading: maintenanceLoading } = useQuery(
    ['tenant-maintenance'],
    async () => {
      const response = await api.get('/api/tenants/my-maintenance-requests');
      return response.data;
    },
    { enabled: !!user?.id }
  );

  const maintenanceRequests = maintenanceData?.maintenance_requests || [];

  // Calculate lease status
  const getLeaseStatus = () => {
    if (!tenantData?.lease_end) return 'Unknown';
    
    const leaseEnd = new Date(tenantData.lease_end);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((leaseEnd - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'Expired';
    if (daysUntilExpiry <= 30) return `Expires in ${daysUntilExpiry} days`;
    return 'Active';
  };

  // Calculate rent due status
  const getRentDueStatus = () => {
    if (!tenantData?.rent_due_date) return 'Unknown';
    
    const dueDate = new Date(tenantData.rent_due_date);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) return 'Overdue';
    if (daysUntilDue <= 5) return `Due in ${daysUntilDue} days`;
    return 'Upcoming';
  };

  if (tenantLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {tenantData?.full_name || user?.full_name || 'Tenant'}!
        </h1>
        <p className="text-gray-600 dark:text-gray-300">Here's an overview of your rental information</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard
          title="Monthly Rent"
          value={`$${tenantData?.rent_amount || 0}`}
          description="Your monthly rent amount"
          icon={<DollarSign className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Rent Due"
          value={getRentDueStatus()}
          description={tenantData?.rent_due_date ? new Date(tenantData.rent_due_date).toLocaleDateString() : 'Unknown'}
          icon={<Calendar className="h-6 w-6" />}
          color="orange"
        />
        <StatCard
          title="Lease Status"
          value={getLeaseStatus()}
          description={tenantData?.lease_end ? `Until ${new Date(tenantData.lease_end).toLocaleDateString()}` : 'Unknown'}
          icon={<Home className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Maintenance Requests"
          value={maintenanceRequests.filter(req => req.status === 'pending').length}
          description="Pending requests"
          icon={<Wrench className="h-6 w-6" />}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Property Information */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-600 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Your Property</h2>
          </div>
          <div className="p-4 sm:p-6">
            {tenantData?.property ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {tenantData.property.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    {tenantData.property.street_address_1}
                    {tenantData.property.street_address_2 && `, ${tenantData.property.street_address_2}`}
                    {tenantData.property.apt_number && `, Apt ${tenantData.property.apt_number}`}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    {tenantData.property.city}, {tenantData.property.state} {tenantData.property.zip_code}
                  </p>
                </div>
                {tenantData.property.description && (
                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300">Description</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                      {tenantData.property.description}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">No property information available</p>
            )}
          </div>
        </div>

        {/* Lease Information */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-600 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Lease Information</h2>
          </div>
          <div className="p-4 sm:p-6">
            {tenantData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300">Lease Start</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      {tenantData.lease_start ? new Date(tenantData.lease_start).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300">Lease End</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      {tenantData.lease_end ? new Date(tenantData.lease_end).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300">Monthly Rent</h4>
                    <p className="text-gray-600 dark:text-gray-300">${tenantData.rent_amount || 0}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-gray-300">Payment Status</h4>
                    <p className={`font-medium ${
                      tenantData.payment_status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {tenantData.payment_status || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">No lease information available</p>
            )}
          </div>
        </div>

        {/* Recent Maintenance Requests */}
        <div className="bg-white shadow rounded-lg lg:col-span-2">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-600 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Maintenance Requests</h2>
          </div>
          <div className="p-4 sm:p-6">
            {maintenanceLoading ? (
              <p className="text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">Loading maintenance requests...</p>
            ) : maintenanceRequests.length > 0 ? (
              <div className="space-y-4">
                {maintenanceRequests.slice(0, 5).map((request) => (
                  <div key={request.id} className="border border-gray-200 dark:border-gray-600 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Request #{request.id}</h4>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{request.request_description}</p>
                        <p className="text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 text-xs mt-1">
                          Submitted: {request.request_date ? new Date(request.request_date).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          request.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:text-yellow-200'
                            : request.status === 'in_progress'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                        }`}
                      >
                        {request.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">No maintenance requests found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantDashboard;
