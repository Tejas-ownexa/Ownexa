import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  Building, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Plus,
  Eye,
  Edit,
  FileText,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

const Rentals = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProperty, setSelectedProperty] = useState(null);

  // Handle URL parameters to set initial tab
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      const tabMapping = {
        'payments': 'payments',
        'leases': 'leases',
        'balances': 'balances'
      };
      if (tabMapping[tab]) {
        setActiveTab(tabMapping[tab]);
      }
    }
  }, [searchParams]);

  // Fetch rental data
  const { data: rentalData, isLoading: rentalLoading } = useQuery(
    ['rental-data'],
    async () => {
      const response = await api.get('/api/rentals/');
      return response.data;
    },
    { enabled: !!user?.id }
  );

  // Fetch properties for filtering
  const { data: properties, isLoading: propertiesLoading } = useQuery(
    ['properties'],
    async () => {
      const response = await api.get('/api/properties/');
      return response.data;
    },
    { enabled: !!user?.id }
  );

  // Fetch tenants
  const { data: tenants, isLoading: tenantsLoading } = useQuery(
    ['tenants'],
    async () => {
      const response = await api.get('/api/tenants/');
      return response.data;
    },
    { enabled: !!user?.id }
  );

  // Fetch rent roll (payment history)
  const { data: rentRoll, isLoading: rentRollLoading } = useQuery(
    ['rent-roll'],
    async () => {
      const response = await api.get('/api/rentals/rent-roll');
      return response.data;
    },
    { enabled: !!user?.id }
  );

  // Fetch outstanding balances
  const { data: outstandingBalances, isLoading: balancesLoading } = useQuery(
    ['outstanding-balances'],
    async () => {
      const response = await api.get('/api/rentals/outstanding-balances');
      return response.data;
    },
    { enabled: !!user?.id }
  );

  // Calculate summary statistics
  const calculateStats = () => {
    // Ensure all data is available and is an array
    if (!rentalData || !Array.isArray(tenants) || !Array.isArray(rentRoll)) {
      return {
        totalRent: 0,
        totalCollected: 0,
        totalOutstanding: 0,
        occupancyRate: 0,
        activeTenants: 0,
        totalProperties: 0
      };
    }

    const totalRent = tenants.reduce((sum, tenant) => sum + parseFloat(tenant.rent_amount || 0), 0);
    const totalCollected = rentRoll.reduce((sum, payment) => sum + parseFloat(payment.amount_paid || 0), 0);
    const totalOutstanding = Array.isArray(outstandingBalances) 
      ? outstandingBalances.reduce((sum, balance) => sum + parseFloat(balance.due_amount || 0), 0)
      : 0;
    const occupancyRate = Array.isArray(properties) && properties.length > 0 
      ? (tenants.length / properties.length) * 100 
      : 0;

    return {
      totalRent,
      totalCollected,
      totalOutstanding,
      occupancyRate,
      activeTenants: tenants.length,
      totalProperties: Array.isArray(properties) ? properties.length : 0
    };
  };

  const stats = calculateStats();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'paid':
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
      case 'overdue':
        return 'text-red-600 bg-red-100';
      case 'partial':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (rentalLoading || propertiesLoading || tenantsLoading || rentRollLoading || balancesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rentals</h1>
          <p className="text-gray-600 mt-1">Manage your rental properties and tenant information</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Tenant</span>
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Monthly Rent</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRent)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Collected</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalCollected)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalOutstanding)}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.occupancyRate.toFixed(1)}%</p>
            </div>
            <Building className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: Eye },
              { id: 'tenants', name: 'Tenants', icon: Users },
              { id: 'payments', name: 'Payments', icon: DollarSign },
              { id: 'leases', name: 'Leases', icon: FileText },
              { id: 'balances', name: 'Outstanding Balances', icon: AlertTriangle }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Payments */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h3>
                  <div className="space-y-3">
                                         {Array.isArray(rentRoll) && rentRoll.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                                                     <p className="font-medium text-gray-900">
                             {Array.isArray(tenants) && tenants.find(t => t.id === payment.tenant_id)?.full_name || 'Unknown Tenant'}
                           </p>
                          <p className="text-sm text-gray-600">{formatDate(payment.payment_date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(payment.amount_paid)}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lease Expirations */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Lease Expirations</h3>
                  <div className="space-y-3">
                                         {Array.isArray(tenants) && tenants.filter(tenant => {
                       const leaseEnd = new Date(tenant.lease_end);
                       const now = new Date();
                       const diffTime = leaseEnd - now;
                       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                       return diffDays <= 90 && diffDays > 0;
                     }).slice(0, 5).map((tenant) => {
                      const leaseEnd = new Date(tenant.lease_end);
                      const now = new Date();
                      const diffTime = leaseEnd - now;
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      return (
                        <div key={tenant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{tenant.full_name}</p>
                            <p className="text-sm text-gray-600">
                              {Array.isArray(properties) && properties.find(p => p.id === tenant.property_id)?.title || 'Unknown Property'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">{formatDate(tenant.lease_end)}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              diffDays <= 30 ? 'text-red-600 bg-red-100' : 'text-yellow-600 bg-yellow-100'
                            }`}>
                              {diffDays} days left
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tenants Tab */}
          {activeTab === 'tenants' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">All Tenants</h3>
                <Link
                  to="/tenants"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View All Tenants
                </Link>
              </div>
              
              <div className="overflow-x-auto">
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
                        Monthly Rent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lease End
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.isArray(tenants) && tenants.map((tenant) => (
                      <tr key={tenant.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{tenant.full_name}</div>
                            <div className="text-sm text-gray-500">{tenant.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {Array.isArray(properties) && properties.find(p => p.id === tenant.property_id)?.title || 'Unknown Property'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(tenant.rent_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(tenant.lease_end)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tenant.payment_status)}`}>
                            {tenant.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-900">
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                <div className="flex space-x-2">
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option>All Properties</option>
                    {Array.isArray(properties) && properties.map(property => (
                      <option key={property.id} value={property.id}>{property.title}</option>
                    ))}
                  </select>
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option>All Status</option>
                    <option>Paid</option>
                    <option>Pending</option>
                    <option>Overdue</option>
                  </select>
                </div>
              </div>
              
              <div className="overflow-x-auto">
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
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.isArray(rentRoll) && rentRoll.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {Array.isArray(tenants) && tenants.find(t => t.id === payment.tenant_id)?.full_name || 'Unknown Tenant'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {Array.isArray(properties) && properties.find(p => p.id === payment.property_id)?.title || 'Unknown Property'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(payment.payment_date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(payment.amount_paid)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{payment.payment_method}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Leases Tab */}
          {activeTab === 'leases' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Lease Management</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Create New Lease
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.isArray(tenants) && tenants.map((tenant) => {
                  const leaseEnd = new Date(tenant.lease_end);
                  const now = new Date();
                  const diffTime = leaseEnd - now;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const isExpiringSoon = diffDays <= 90 && diffDays > 0;
                  const isExpired = diffDays < 0;
                  
                  return (
                    <div key={tenant.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{tenant.full_name}</h4>
                          <p className="text-sm text-gray-600">
                            {Array.isArray(properties) && properties.find(p => p.id === tenant.property_id)?.title || 'Unknown Property'}
                          </p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          isExpired ? 'text-red-600 bg-red-100' :
                          isExpiringSoon ? 'text-yellow-600 bg-yellow-100' :
                          'text-green-600 bg-green-100'
                        }`}>
                          {isExpired ? 'Expired' : isExpiringSoon ? `${diffDays} days left` : 'Active'}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Monthly Rent:</span>
                          <span className="font-medium">{formatCurrency(tenant.rent_amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Lease Start:</span>
                          <span>{formatDate(tenant.lease_start)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Lease End:</span>
                          <span>{formatDate(tenant.lease_end)}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                          View Details
                        </button>
                        <button className="text-green-600 hover:text-green-900 text-sm font-medium">
                          Renew Lease
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Outstanding Balances Tab */}
          {activeTab === 'balances' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Outstanding Balances</h3>
                <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                  Send Reminders
                </button>
              </div>
              
              <div className="overflow-x-auto">
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
                        Due Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Days Overdue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.isArray(outstandingBalances) && outstandingBalances.map((balance) => {
                      const dueDate = new Date(balance.due_date);
                      const now = new Date();
                      const diffTime = now - dueDate;
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      return (
                        <tr key={balance.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {Array.isArray(tenants) && tenants.find(t => t.id === balance.tenant_id)?.full_name || 'Unknown Tenant'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                                                      <div className="text-sm text-gray-900">
                            {Array.isArray(properties) && properties.find(p => p.id === balance.property_id)?.title || 'Unknown Property'}
                          </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-red-600">
                              {formatCurrency(balance.due_amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(balance.due_date)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${
                              diffDays > 0 ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {diffDays > 0 ? `${diffDays} days` : 'Not due yet'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              balance.is_resolved ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                            }`}>
                              {balance.is_resolved ? 'Resolved' : 'Outstanding'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-900">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="text-green-600 hover:text-green-900">
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Rentals;
