import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Heart, Home, Settings, User, DollarSign, AlertTriangle, CheckCircle, Wrench, Clock, TrendingUp } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import DashboardWidget from '../components/DashboardWidget';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('properties');
  const [maintenanceList, setMaintenanceList] = useState([]);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);

  // Only fetch data relevant to the user's role
  const { data: userProperties, isLoading: propertiesLoading } = useQuery(
    ['user-properties'],
    async () => {
      if (!user?.id) {
        throw new Error('User ID not available');
      }
      const response = await api.get('/api/properties/', {
        params: { owner_id: user.id }
      });
      return response.data;
    },
    { enabled: !!user?.id && (user?.role === 'OWNER' || user?.role === 'AGENT') }
  );

  const { data: favorites, isLoading: favoritesLoading } = useQuery(
    ['user-favorites'],
    async () => {
      if (!user?.id) {
        throw new Error('User ID not available');
      }
      const response = await api.get('/api/properties/user/favorites');
      return response.data;
    },
    { enabled: !!user?.id && (user?.role === 'OWNER' || user?.role === 'AGENT') }
  );

  // Create a set of favorited property IDs for quick lookup
  const favoritedPropertyIds = new Set(
    favorites?.map(fav => fav.property?.id) || []
  );

  // Helper function to check if a property is favorited
  const isPropertyFavorited = (propertyId) => {
    return favoritedPropertyIds.has(propertyId);
  };

  const { data: tenantStats, isLoading: tenantStatsLoading } = useQuery(
    ['tenant-statistics'],
    async () => {
      if (!user?.id) {
        throw new Error('User ID not available');
      }
      const response = await api.get('/api/tenants/statistics/summary');
      return response.data;
    },
    { enabled: !!user?.id && (user?.role === 'OWNER' || user?.role === 'AGENT') }
  );

  const { data: tenants, isLoading: tenantsLoading } = useQuery(
    ['tenants'],
    async () => {
      if (!user?.id) {
        throw new Error('User ID not available');
      }
      const response = await api.get('/api/tenants/');
      return response.data;
    },
    { enabled: !!user?.id && (user?.role === 'OWNER' || user?.role === 'AGENT') }
  );

  // Fetch maintenance requests for all users
  const { data: maintenanceRequests } = useQuery(
    ['maintenance-requests'],
    async () => {
      const response = await api.get('/api/maintenance/requests');
      return response.data;
    },
    {
      onSuccess: (data) => {
        setMaintenanceList(data || []);
        setMaintenanceLoading(false);
      },
      onError: () => setMaintenanceLoading(false),
    }
  );

  const { data: financialData, isLoading: financialLoading } = useQuery(
    ['financial-data'],
    async () => {
      if (!user?.id) {
        throw new Error('User ID not available');
      }
      const [rentResponse, balanceResponse] = await Promise.all([
        api.get('/api/financial/rent-roll'),
        api.get('/api/financial/outstanding-balances')
      ]);
      return {
        rentRoll: rentResponse.data,
        outstandingBalances: balanceResponse.data
      };
    },
    { enabled: !!user?.id && (user?.role === 'OWNER' || user?.role === 'AGENT') }
  );

  // Vendor-specific maintenance statistics
  const getVendorMaintenanceStats = () => {
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

  const vendorStats = getVendorMaintenanceStats();
  const tabs = [
    { id: 'properties', label: 'My Properties', icon: Home },
    { id: 'tenants', label: 'Tenants', icon: User },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'profile', label: 'Profile', icon: User },
  ];
  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="text-lg">Please log in to access your dashboard.</div>
        <Link to="/login" className="btn-primary mt-4 inline-block">
          Login
        </Link>
      </div>
    );
  }

  // Ensure user has required properties
  if (!user.id || !user.full_name) {
    return (
      <div className="text-center py-12">
        <div className="text-lg">User data is incomplete. Please log in again.</div>
        <Link to="/login" className="btn-primary mt-4 inline-block">
          Login
        </Link>
      </div>
    );
  }

  // Vendor Dashboard - Show only maintenance-related information
  if (user.role === 'VENDOR') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your assigned maintenance requests and track work progress</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Welcome back, {user.full_name}</span>
            </div>
          </div>
        </div>

        {/* Vendor Maintenance Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <DashboardWidget
            title="Total Assigned"
            value={vendorStats.total}
            description="Requests assigned to you"
            icon={Wrench}
            color="blue"
            link="/maintenance"
          />
          <DashboardWidget
            title="Completed"
            value={vendorStats.completed}
            description="Successfully completed"
            icon={CheckCircle}
            color="green"
            link="/maintenance"
          />
          <DashboardWidget
            title="In Progress"
            value={vendorStats.inProgress}
            description="Currently working on"
            icon={Clock}
            color="orange"
            link="/maintenance"
          />
          <DashboardWidget
            title="Completion Rate"
            value={`${vendorStats.completionRate}%`}
            description="Your success rate"
            icon={TrendingUp}
            color="yellow"
            link="/maintenance"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/maintenance"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Wrench className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <h3 className="font-medium text-gray-900">View Maintenance Requests</h3>
                <p className="text-sm text-gray-600">Check your assigned requests and update status</p>
              </div>
            </Link>
            <Link
              to="/vendor-profile"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <User className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <h3 className="font-medium text-gray-900">Update Profile</h3>
                <p className="text-sm text-gray-600">Manage your vendor information and services</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Maintenance Requests */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Maintenance Requests</h2>
            <Link
              to="/maintenance"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
          {maintenanceList.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No maintenance requests assigned yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {maintenanceList.slice(0, 5).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{request.request_title}</h3>
                    <p className="text-sm text-gray-600">{request.property?.title}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      request.status === 'completed' ? 'bg-green-100 text-green-800' :
                      request.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Regular Dashboard for OWNER and AGENT roles
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.full_name || 'User'}!</p>
          </div>
          <div className="flex space-x-3">
            <Link
              to="/tenants"
              className="btn-secondary flex items-center space-x-2"
            >
              <User className="h-4 w-4" />
              <span>Manage Tenants</span>
            </Link>
            <Link
              to="/add-property"
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Property</span>
            </Link>
          </div>
        </div>
        
        {/* Quick Actions */}
        {userProperties && userProperties.length === 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Home className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Get Started with Property Management
                  </h3>
                  <p className="text-sm text-blue-700">
                    Add your first property to start managing tenants and tracking rent payments.
                  </p>
                </div>
              </div>
              <Link
                to="/add-property"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Property
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Dashboard Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardWidget
          title="Total Properties"
          value={userProperties?.length || 0}
          description="Properties you own"
          icon={Home}
          color="blue"
          link="/properties"
        />
        <DashboardWidget
          title="Active Tenants"
          value={tenants?.items?.length || 0}
          description="Current tenants"
          icon={User}
          color="green"
          link="/tenants"
        />
        <DashboardWidget
          title="Pending Maintenance"
          value={maintenanceList.filter(req => req.status === 'pending').length}
          description="Requests awaiting action"
          icon={Wrench}
          color="yellow"
          link="/maintenance"
        />
        <DashboardWidget
          title="Outstanding Balances"
          value={`$${(financialData?.outstandingBalances?.reduce((total, balance) => total + parseFloat(balance.amount), 0) || 0).toFixed(2)}`}
          description="Total outstanding amounts"
          icon={DollarSign}
          color="red"
          link="/financial"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Home className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">My Properties</p>
              <p className="text-2xl font-semibold text-gray-900">
                {userProperties?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tenants</p>
              <p className="text-2xl font-semibold text-gray-900">
                {tenantStatsLoading ? '...' : (tenantStats?.total_tenants || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Current Tenants</p>
              <p className="text-2xl font-semibold text-gray-900">
                {tenantStatsLoading ? '...' : (tenantStats?.current_tenants || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {tenantStatsLoading ? '...' : (tenantStats?.overdue_tenants || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Outstanding Balance</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${tenantStatsLoading ? '...' : (tenantStats?.total_outstanding_balance || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Heart className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Favorites</p>
              <p className="text-2xl font-semibold text-gray-900">
                {favorites?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <User className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Account Type</p>
              <p className="text-2xl font-semibold text-gray-900">
                {user.is_agent ? 'Agent' : 'User'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Properties Tab */}
          {activeTab === 'properties' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">My Properties</h2>
                <Link to="/add-property" className="btn-primary">
                  Add New Property
                </Link>
              </div>

              {propertiesLoading ? (
                <div className="text-center py-8">
                  <div className="text-lg">Loading properties...</div>
                </div>
              ) : userProperties && userProperties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} isFavorite={isPropertyFavorited(property.id)} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h3>
                  <p className="text-gray-600 mb-4">Start by adding your first property listing.</p>
                  <Link to="/add-property" className="btn-primary">
                    Add Your First Property
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Tenants Tab */}
          {activeTab === 'tenants' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Current Tenants</h2>
                <div className="flex space-x-3">
                  <Link to="/tenants" className="btn-primary flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Manage All Tenants</span>
                  </Link>
                </div>
              </div>

              {tenantsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading tenants...</p>
                </div>
              ) : tenants?.items && tenants.items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tenants.items.map((tenant) => (
                    <div key={tenant.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{tenant.name}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          tenant.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {tenant.status}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium w-20">Email:</span>
                          {tenant.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium w-20">Phone:</span>
                          {tenant.phone}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium w-20">Property:</span>
                          {tenant.property ? tenant.property.name : 'Not assigned'}
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">${tenant.rentAmount}</span>
                            <span className="text-gray-600">/month</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Lease: {new Date(tenant.leaseStartDate).toLocaleDateString()} - {new Date(tenant.leaseEndDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Tenants Yet</h3>
                  <p className="text-gray-600 mb-4">Start adding tenants to your properties to see them here.</p>
                  <Link to="/tenants" className="btn-primary">
                    Add Your First Tenant
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Favorites Tab */}
          {activeTab === 'favorites' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">My Favorites</h2>

              {favoritesLoading ? (
                <div className="text-center py-8">
                  <div className="text-lg">Loading favorites...</div>
                </div>
              ) : favorites && favorites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((favorite) => (
                    <PropertyCard key={favorite.property.id} property={favorite.property} isFavorite={true} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
                  <p className="text-gray-600 mb-4">Start browsing properties and add them to your favorites.</p>
                  <Link to="/properties" className="btn-primary">
                    Browse Properties
                  </Link>
                </div>
              )}
            </div>
          )}


          {/* Maintenance Tab */}
          {activeTab === 'maintenance' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Maintenance Requests</h2>
              </div>

              {maintenanceLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading maintenance requests...</p>
                </div>
              ) : maintenanceList && maintenanceList.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    {maintenanceList.map((request) => (
                      <div key={request.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                        {/* Header */}
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                Maintenance Request #{request.id}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                Submitted on {request.request_date ? new Date(request.request_date).toLocaleDateString() : 'Unknown'}
                              </p>
                            </div>
                            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                              request.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800'
                                : request.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Property Details */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-3">Property Details</h4>
                              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <div>
                                  <span className="text-sm font-medium text-gray-500">Property Name:</span>
                                  <p className="text-sm text-gray-900">{request.property?.name || 'Unknown Property'}</p>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-500">Address:</span>
                                  <p className="text-sm text-gray-900">{request.property?.address || 'Unknown Address'}</p>
                                </div>
                              </div>
                            </div>

                            {/* Tenant Details */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-3">Tenant Details</h4>
                              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <div>
                                  <span className="text-sm font-medium text-gray-500">Name:</span>
                                  <p className="text-sm text-gray-900">{request.tenant?.name || 'Unknown Tenant'}</p>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-500">Contact:</span>
                                  <p className="text-sm text-gray-900">
                                    {request.tenant?.email && (
                                      <span className="block">Email: {request.tenant.email}</span>
                                    )}
                                    {request.tenant?.phone && (
                                      <span className="block">Phone: {request.tenant.phone}</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Request Details */}
                          <div className="mt-6">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Request Details</h4>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="prose prose-sm max-w-none text-gray-900">
                                {request.request_description}
                              </div>
                            </div>
                          </div>

                          {/* Timeline */}
                          <div className="mt-6">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Timeline</h4>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="space-y-3">
                                <div className="flex items-center text-sm">
                                  <div className="w-24 flex-shrink-0 font-medium text-gray-500">Submitted:</div>
                                  <div className="text-gray-900">
                                    {request.request_date ? new Date(request.request_date).toLocaleString() : 'Unknown'}
                                  </div>
                                </div>
                                {request.resolution_date && (
                                  <div className="flex items-center text-sm">
                                    <div className="w-24 flex-shrink-0 font-medium text-gray-500">Resolved:</div>
                                    <div className="text-gray-900">
                                      {new Date(request.resolution_date).toLocaleString()}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                          <div className="flex justify-end space-x-3">
                            {request.status === 'pending' && (
                              <>
                                <button className="btn-secondary">Mark In Progress</button>
                                <button className="btn-primary">Mark Complete</button>
                              </>
                            )}
                            {request.status === 'in_progress' && (
                              <button className="btn-primary">Mark Complete</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Maintenance Requests</h3>
                  <p className="text-gray-600 mb-4">There are no maintenance requests at this time.</p>
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <p className="text-gray-900">{user.full_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <p className="text-gray-900">{user.username}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <p className="text-gray-900">{user.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Type
                    </label>
                    <p className="text-gray-900">{user.is_agent ? 'Real Estate Agent' : 'Regular User'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Member Since
                    </label>
                    <p className="text-gray-900">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 