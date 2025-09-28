import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import { useAdminBot } from '../contexts/AdminBotContext';
import { Plus, Heart, Home, Settings, User, DollarSign, AlertTriangle, CheckCircle, Wrench, TrendingUp, TrendingDown, Calendar, PieChart, BarChart3, Activity, MessageCircle } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import DashboardWidget from '../components/DashboardWidget';
import toast from 'react-hot-toast';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement } from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

const Dashboard = () => {
  const { user } = useAuth();
  const { openAdminBot } = useAdminBot();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [maintenanceList, setMaintenanceList] = useState([]);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);
  const [animationTrigger, setAnimationTrigger] = useState(false);
  
  useEffect(() => {
    setAnimationTrigger(true);
  }, []);

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
    { enabled: !!user?.id }
  );

  // Fetch dashboard statistics
  const { data: dashboardStats, isLoading: statsLoading } = useQuery(
    ['dashboard-stats'],
    async () => {
      const response = await api.get('/api/dashboard/stats');
      return response.data.stats;
    },
    { enabled: !!user?.id }
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
    { enabled: !!user?.id }
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
    { enabled: !!user?.id }
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
    { enabled: !!user?.id }
  );

  useQuery(
    ['maintenance-requests'],
    async () => {
      if (!user?.id) {
        throw new Error('User ID not available');
      }
      try {
        setMaintenanceLoading(true);
        const response = await api.get('/api/maintenance/requests');
        console.log('Maintenance response:', response.data);
        if (response.data && Array.isArray(response.data.items)) {
          setMaintenanceList(response.data.items);
        } else {
          setMaintenanceList([]);
        }
      } catch (error) {
        console.error('Error fetching maintenance requests:', error);
        setMaintenanceList([]);
      } finally {
        setMaintenanceLoading(false);
      }
    },
    { 
      enabled: !!user?.id,
      refetchOnWindowFocus: false,
      onSettled: () => setMaintenanceLoading(false)
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
    { enabled: !!user?.id }
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'properties', label: 'Properties', icon: Home },
    { id: 'tenants', label: 'Tenants', icon: User },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  // Chart data configurations
  const revenueChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Monthly Revenue',
        data: dashboardStats?.revenue_chart_data || [0, 0, 0, 0, 0, 0],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const propertyStatusData = {
    labels: ['Occupied', 'Vacant', 'Maintenance'],
    datasets: [
      {
        data: [75, 20, 5],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(245, 158, 11, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const maintenanceStatusData = {
    labels: ['Pending', 'In Progress', 'Completed'],
    datasets: [
      {
        label: 'Maintenance Requests',
        data: [12, 8, 25],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(34, 197, 94, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Revenue Trend',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };



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

  return (
    <div className="dashboard-container w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-4">
      {/* Enhanced Header */}
      <div className="glass-card p-4 sm:p-6 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className={`transform transition-all duration-700 ${animationTrigger ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Property Dashboard</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">Welcome back, {user?.full_name || 'User'}!</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <Activity className="h-4 w-4" />
                <span>System Active</span>
              </div>
            </div>
          </div>
          <div className={`flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto transform transition-all duration-700 delay-300 ${animationTrigger ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
            <button
              onClick={openAdminBot}
              className="btn-primary flex items-center justify-center sm:justify-start space-x-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              <MessageCircle className="h-4 w-4" />
              <span>AI Assistant</span>
            </button>
            <Link
              to="/tenants"
              className="btn-primary flex items-center justify-center sm:justify-start space-x-2"
            >
              <User className="h-4 w-4" />
              <span>Manage Tenants</span>
            </Link>
            <Link
              to="/add-property"
              className="btn-success flex items-center justify-center sm:justify-start space-x-2 hover-glow"
            >
              <Plus className="h-4 w-4" />
              <span>Add Property</span>
            </Link>
          </div>
        </div>
        
        {/* Quick Actions */}
        {userProperties && userProperties.length === 0 && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Get Started with Property Management
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Add your first property to start managing tenants and tracking rent payments.
                  </p>
                </div>
              </div>
              <Link
                to="/add-property"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 dark:text-blue-200 bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Property
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Dashboard Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className={`transform transition-all duration-500 delay-100 ${animationTrigger ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl p-4 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 dark:text-blue-200 text-sm font-medium">Total Properties</p>
                <p className="text-3xl font-bold mt-1">{userProperties?.length || 0}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-sm">+12% this month</span>
                </div>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Home className="h-8 w-8" />
              </div>
            </div>
            <Link to="/properties" className="block mt-4 text-sm font-medium hover:underline">
              View all properties →
            </Link>
          </div>
        </div>
        
        <div className={`transform transition-all duration-500 delay-200 ${animationTrigger ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Active Tenants</p>
                <p className="text-3xl font-bold mt-1">{tenants?.items?.length || 0}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-sm">95% occupancy</span>
                </div>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <User className="h-8 w-8" />
              </div>
            </div>
            <Link to="/tenants" className="block mt-4 text-sm font-medium hover:underline">
              Manage tenants →
            </Link>
          </div>
        </div>
        
        <div className={`transform transition-all duration-500 delay-300 ${animationTrigger ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-4 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Maintenance</p>
                <p className="text-3xl font-bold mt-1">{maintenanceList.filter(req => req.status === 'pending').length}</p>
                <div className="flex items-center mt-2">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  <span className="text-sm">Requires attention</span>
                </div>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Wrench className="h-8 w-8" />
              </div>
            </div>
            <Link to="/maintenance" className="block mt-4 text-sm font-medium hover:underline">
              View requests →
            </Link>
          </div>
        </div>
        
        <div className={`transform transition-all duration-500 delay-400 ${animationTrigger ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Monthly Revenue</p>
                <p className="text-3xl font-bold mt-1">
                  ${dashboardStats?.monthly_revenue?.toLocaleString() || '0'}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-sm">+8% this month</span>
                </div>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <DollarSign className="h-8 w-8" />
              </div>
            </div>
            <Link to="/financial" className="block mt-4 text-sm font-medium hover:underline">
              View finances →
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Home className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">My Properties</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {userProperties?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <User className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Total Tenants</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {tenantStatsLoading ? '...' : (tenantStats?.total_tenants || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Current Tenants</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {tenantStatsLoading ? '...' : (tenantStats?.current_tenants || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Overdue</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {tenantStatsLoading ? '...' : (tenantStats?.overdue_tenants || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Outstanding Balance</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                ${tenantStatsLoading ? '...' : (tenantStats?.total_outstanding_balance || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Heart className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Favorites</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {favorites?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <User className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Account Type</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {user.is_agent ? 'Agent' : 'User'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700">
          <nav className="flex space-x-1 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative py-4 px-4 font-medium text-sm flex items-center space-x-2 rounded-t-lg transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-lg transform -translate-y-1'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className={`h-4 w-4 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : ''}`} />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-gradient-to-br from-indigo-50 to-white p-4 sm:p-6 rounded-xl border border-indigo-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Occupancy Rate</h3>
                    <PieChart className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="text-3xl font-bold text-indigo-600 mb-2">
                    {dashboardStats?.occupancy_rate || 0}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {dashboardStats?.active_tenants || 0} of {dashboardStats?.total_properties || 0} properties occupied
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-white p-4 sm:p-6 rounded-xl border border-green-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Collection Rate</h3>
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {dashboardStats?.collection_rate || 0}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">On-time rent collection</p>
                </div>
                
                <div className="bg-gradient-to-br from-yellow-50 to-white p-4 sm:p-6 rounded-xl border border-yellow-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Avg Response Time</h3>
                    <Activity className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="text-3xl font-bold text-yellow-600 mb-2">
                    {dashboardStats?.avg_response_time || '0h'}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">For maintenance requests</p>
                </div>
              </div>
              
              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Trend</h3>
                  <div className="chart-container">
                    <Line data={revenueChartData} options={chartOptions} />
                  </div>
                </div>
                
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Property Status</h3>
                  <div className="chart-container">
                    <Pie data={propertyStatusData} options={pieChartOptions} />
                  </div>
                </div>
              </div>
              
              {/* Maintenance Chart */}
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Maintenance Overview</h3>
                <div className="chart-container">
                  <Bar data={maintenanceStatusData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                    },
                  }} />
                </div>
              </div>
              
              {/* Recent Activity */}
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="bg-blue-100 dark:bg-blue-800/50 p-2 rounded-full mr-3">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">New tenant moved in</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">John Doe at 123 Main St - 2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full mr-3">
                      <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Rent payment received</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">$1,800 from Sarah Johnson - 1 day ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                    <div className="bg-yellow-100 p-2 rounded-full mr-3">
                      <Wrench className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Maintenance request submitted</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">HVAC repair at 456 Oak Ave - 2 days ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Properties Tab */}
          {activeTab === 'properties' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Properties</h2>
                <Link to="/add-property" className="btn-primary">
                  Add New Property
                </Link>
              </div>

              {propertiesLoading ? (
                <div className="text-center py-8">
                  <div className="text-lg text-gray-900 dark:text-white">Loading properties...</div>
                </div>
              ) : userProperties && userProperties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userProperties.map((property) => (
                    <PropertyCard 
                      key={property.id} 
                      property={property} 
                      isFavorite={isPropertyFavorited(property.id)}
                      onDelete={async (propertyId) => {
                        if (window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
                          try {
                            await api.delete(`/api/properties/${propertyId}`);
                            toast.success('Property deleted successfully!');
                            // Refresh the properties list
                            queryClient.invalidateQueries(['user-properties']);
                          } catch (error) {
                            console.error('Delete error:', error);
                            const errorMessage = error.response?.data?.error || 'Failed to delete property. Please try again.';
                            toast.error(errorMessage);
                          }
                        }
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Home className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No properties yet</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">Start by adding your first property listing.</p>
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
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Current Tenants</h2>
                <div className="flex space-x-3">
                  <Link to="/tenants" className="btn-primary flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Manage All Tenants</span>
                  </Link>
                </div>
              </div>

              {tenantsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">Loading tenants...</p>
                </div>
              ) : tenants?.items && tenants.items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tenants.items.map((tenant) => (
                    <div key={tenant.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">{tenant.name}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          tenant.status === 'active' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                        }`}>
                          {tenant.status}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium w-20">Email:</span>
                          {tenant.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium w-20">Phone:</span>
                          {tenant.phone}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium w-20">Property:</span>
                          {tenant.property ? tenant.property.name : 'Not assigned'}
                        </div>
                      </div>

                      <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="font-medium text-gray-900 dark:text-white">${tenant.rentAmount}</span>
                            <span className="text-gray-600 dark:text-gray-300">/month</span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            Lease: {new Date(tenant.leaseStartDate).toLocaleDateString()} - {new Date(tenant.leaseEndDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <User className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Tenants Yet</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">Start adding tenants to your properties to see them here.</p>
                  <Link to="/tenants" className="btn-primary">
                    Add Your First Tenant
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Advanced Analytics</h2>
              
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 p-4 rounded-lg text-white">
                  <div className="text-2xl font-bold">
                    ${dashboardStats?.ytd_revenue?.toLocaleString() || '0'}
                  </div>
                  <div className="text-blue-100 dark:text-blue-200">Total Revenue (YTD)</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-lg text-white">
                  <div className="text-2xl font-bold">{dashboardStats?.roi || 0}%</div>
                  <div className="text-green-100">ROI This Year</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-lg text-white">
                  <div className="text-2xl font-bold">{dashboardStats?.avg_vacancy_days || 0}</div>
                  <div className="text-purple-100">Days Avg Vacancy</div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-lg text-white">
                  <div className="text-2xl font-bold">
                    ${dashboardStats?.avg_maintenance_cost?.toLocaleString() || '0'}
                  </div>
                  <div className="text-orange-100">Avg Maintenance Cost</div>
                </div>
              </div>
              
              {/* Performance Comparison */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Property Performance Comparison</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">123 Main Street</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Single Family Home</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600 dark:text-green-400">ROI: 5.2%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Revenue: $2,400/mo</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">456 Oak Avenue</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Apartment Complex</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600 dark:text-green-400">ROI: 4.6%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Revenue: $1,800/mo</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">789 Pine Street</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Condo</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600 dark:text-blue-400">ROI: 4.1%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Revenue: $1,200/mo</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Market Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Market Trends</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">Average Rent (Local)</span>
                      <span className="font-medium text-gray-900 dark:text-white">$1,850/mo</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">Your Average</span>
                      <span className="font-medium text-green-600 dark:text-green-400">$1,933/mo</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">Market Growth</span>
                      <span className="font-medium text-green-600 dark:text-green-400">+3.2% YoY</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recommendations</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="font-medium text-blue-900 dark:text-blue-200">Rent Optimization</div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">Consider 4% increase at Oak Ave renewal</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="font-medium text-green-900">Energy Efficiency</div>
                      <div className="text-sm text-green-700">Install smart thermostats to reduce costs</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* Maintenance Tab */}
          {activeTab === 'maintenance' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Maintenance Requests</h2>
              </div>

              {maintenanceLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">Loading maintenance requests...</p>
                </div>
              ) : maintenanceList && maintenanceList.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    {maintenanceList.map((request) => (
                      <div key={request.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                        {/* Header */}
                        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Maintenance Request #{request.id}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                Submitted on {request.request_date ? new Date(request.request_date).toLocaleDateString() : 'Unknown'}
                              </p>
                            </div>
                            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                              request.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800 dark:text-yellow-200'
                                : request.status === 'in_progress'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                                : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
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
                              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
                                <div>
                                  <span className="text-sm font-medium text-gray-500 dark:text-gray-300">Property Name:</span>
                                  <p className="text-sm text-gray-900">{request.property?.name || 'Unknown Property'}</p>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-500 dark:text-gray-300">Address:</span>
                                  <p className="text-sm text-gray-900">{request.property?.address || 'Unknown Address'}</p>
                                </div>
                              </div>
                            </div>

                            {/* Tenant Details */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-3">Tenant Details</h4>
                              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
                                <div>
                                  <span className="text-sm font-medium text-gray-500 dark:text-gray-300">Name:</span>
                                  <p className="text-sm text-gray-900">{request.tenant?.name || 'Unknown Tenant'}</p>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-500 dark:text-gray-300">Contact:</span>
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
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                              <div className="prose prose-sm max-w-none text-gray-900">
                                {request.request_description}
                              </div>
                            </div>
                          </div>

                          {/* Timeline */}
                          <div className="mt-6">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Timeline</h4>
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                              <div className="space-y-3">
                                <div className="flex items-center text-sm">
                                  <div className="w-24 flex-shrink-0 font-medium text-gray-500 dark:text-gray-300">Submitted:</div>
                                  <div className="text-gray-900">
                                    {request.request_date ? new Date(request.request_date).toLocaleString() : 'Unknown'}
                                  </div>
                                </div>
                                {request.resolution_date && (
                                  <div className="flex items-center text-sm">
                                    <div className="w-24 flex-shrink-0 font-medium text-gray-500 dark:text-gray-300">Resolved:</div>
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
                        <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-t border-gray-200">
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
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <Wrench className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Maintenance Requests</h3>
                  <p className="text-gray-600 mb-4">There are no maintenance requests at this time.</p>
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Profile Information</h2>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <p className="text-gray-900 dark:text-white">{user.full_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Username
                    </label>
                    <p className="text-gray-900 dark:text-white">{user.username}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <p className="text-gray-900 dark:text-white">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone
                    </label>
                    <p className="text-gray-900 dark:text-white">{user.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Account Type
                    </label>
                    <p className="text-gray-900 dark:text-white">{user.is_agent ? 'Real Estate Agent' : 'Regular User'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Member Since
                    </label>
                    <p className="text-gray-900 dark:text-white">
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