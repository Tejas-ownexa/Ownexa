import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/axios';

const FinancialManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rentRoll, setRentRoll] = useState([]);
  const [outstandingBalances, setOutstandingBalances] = useState([]);
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rent-roll');
  const [showRentForm, setShowRentForm] = useState(false);
  const [showBalanceForm, setShowBalanceForm] = useState(false);
  const [rentFormData, setRentFormData] = useState({
    property_id: '',
    tenant_id: '',
    amount_paid: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'check',
    status: 'completed',
    remarks: ''
  });
  const [balanceFormData, setBalanceFormData] = useState({
    property_id: '',
    tenant_id: '',
    due_amount: '',
    due_date: new Date().toISOString().split('T')[0],
    is_resolved: false
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [rentResponse, balanceResponse, propertiesResponse, tenantsResponse] = await Promise.all([
        api.get('/api/financial/rent-roll'),
        api.get('/api/financial/outstanding-balances'),
        api.get('/api/properties/'),
        api.get('/api/tenants/')
      ]);
      
      setRentRoll(rentResponse.data);
      setOutstandingBalances(balanceResponse.data);
      setProperties(propertiesResponse.data);
      setTenants(tenantsResponse.data);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRentSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedData = {
        ...rentFormData,
        tenant_id: parseInt(rentFormData.tenant_id),
        property_id: parseInt(rentFormData.property_id),
        amount_paid: parseFloat(rentFormData.amount_paid)
      };
      
      await api.post('/api/financial/rent-roll', formattedData);
      setShowRentForm(false);
      setRentFormData({
        property_id: '',
        tenant_id: '',
        amount_paid: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'check',
        status: 'completed',
        remarks: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error creating rent payment:', error);
      alert('Error creating rent payment. Please check the console for details.');
    }
  };

  const handleBalanceSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedData = {
        ...balanceFormData,
        tenant_id: parseInt(balanceFormData.tenant_id),
        property_id: parseInt(balanceFormData.property_id),
        due_amount: parseFloat(balanceFormData.due_amount)
      };
      
      await api.post('/api/financial/outstanding-balances', formattedData);
      setShowBalanceForm(false);
      setBalanceFormData({
        property_id: '',
        tenant_id: '',
        due_amount: '',
        due_date: new Date().toISOString().split('T')[0],
        is_resolved: false
      });
      fetchData();
    } catch (error) {
      console.error('Error creating outstanding balance:', error);
      alert('Error creating outstanding balance. Please check the console for details.');
    }
  };

  const handleDeleteRent = async (rentId) => {
    if (window.confirm('Are you sure you want to delete this rent payment record?')) {
      try {
        await api.delete(`/api/financial/rent-roll/${rentId}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting rent payment:', error);
        alert('Error deleting rent payment. Please check the console for details.');
      }
    }
  };

  const handleDeleteBalance = async (balanceId) => {
    if (window.confirm('Are you sure you want to delete this outstanding balance?')) {
      try {
        await api.delete(`/api/financial/outstanding-balances/${balanceId}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting outstanding balance:', error);
        alert('Error deleting outstanding balance. Please check the console for details.');
      }
    }
  };

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? `${property.title} - ${property.street_address_1}, ${property.city}` : 'Unknown Property';
  };

  const getTenantName = (tenantId) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? tenant.full_name : 'Unknown Tenant';
  };

  const calculateTotalRent = () => {
    return rentRoll.reduce((total, rent) => total + parseFloat(rent.amount_paid || 0), 0);
  };

  const calculateTotalOutstanding = () => {
    return outstandingBalances.reduce((total, balance) => total + parseFloat(balance.due_amount || 0), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Financial Management</h1>
          <p className="mt-2 text-gray-600">Track rent payments, outstanding balances, and financial records</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Rent Collected</p>
                <p className="text-2xl font-semibold text-gray-900">${calculateTotalRent().toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
                <p className="text-2xl font-semibold text-gray-900">${calculateTotalOutstanding().toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Properties</p>
                <p className="text-2xl font-semibold text-gray-900">{properties.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('rent-roll')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'rent-roll'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Rent Roll
              </button>
              <button
                onClick={() => setActiveTab('outstanding')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'outstanding'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Outstanding Balances
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Rent Roll Tab */}
            {activeTab === 'rent-roll' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Rent Roll</h3>
                  <button
                    onClick={() => setShowRentForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Add Payment
                  </button>
                </div>

                {showRentForm && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Record Rent Payment</h4>
                    <form onSubmit={handleRentSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Property</label>
                          <select
                            required
                            value={rentFormData.property_id}
                            onChange={(e) => setRentFormData({...rentFormData, property_id: e.target.value})}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Property</option>
                            {properties.map(property => (
                              <option key={property.id} value={property.id}>
                                {property.title} - {property.street_address_1}, {property.city}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tenant</label>
                          <select
                            required
                            value={rentFormData.tenant_id}
                            onChange={(e) => setRentFormData({...rentFormData, tenant_id: e.target.value})}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Tenant</option>
                            {tenants.map(tenant => (
                              <option key={tenant.id} value={tenant.id}>
                                {tenant.full_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={rentFormData.amount_paid}
                            onChange={(e) => setRentFormData({...rentFormData, amount_paid: e.target.value})}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                          <input
                            type="date"
                            required
                            value={rentFormData.payment_date}
                            onChange={(e) => setRentFormData({...rentFormData, payment_date: e.target.value})}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                          <select
                            value={rentFormData.payment_method}
                            onChange={(e) => setRentFormData({...rentFormData, payment_method: e.target.value})}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="check">Check</option>
                            <option value="cash">Cash</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="online">Online Payment</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                          <select
                            value={rentFormData.status}
                            onChange={(e) => setRentFormData({...rentFormData, status: e.target.value})}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                        <textarea
                          rows={2}
                          value={rentFormData.remarks}
                          onChange={(e) => setRentFormData({...rentFormData, remarks: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Optional remarks about the payment..."
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Record Payment
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowRentForm(false)}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rentRoll.map((rent) => (
                        <tr key={rent.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {getPropertyName(rent.property_id)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getTenantName(rent.tenant_id)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${parseFloat(rent.amount_paid || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(rent.payment_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {rent.payment_method ? rent.payment_method.replace('_', ' ') : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              rent.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : rent.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {rent.status || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleDeleteRent(rent.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rentRoll.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No rent payments recorded yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Outstanding Balances Tab */}
            {activeTab === 'outstanding' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Outstanding Balances</h3>
                  <button
                    onClick={() => setShowBalanceForm(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Add Balance
                  </button>
                </div>

                {showBalanceForm && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Record Outstanding Balance</h4>
                    <form onSubmit={handleBalanceSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Property</label>
                          <select
                            required
                            value={balanceFormData.property_id}
                            onChange={(e) => setBalanceFormData({...balanceFormData, property_id: e.target.value})}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Property</option>
                            {properties.map(property => (
                              <option key={property.id} value={property.id}>
                                {property.title} - {property.street_address_1}, {property.city}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tenant</label>
                          <select
                            required
                            value={balanceFormData.tenant_id}
                            onChange={(e) => setBalanceFormData({...balanceFormData, tenant_id: e.target.value})}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Tenant</option>
                            {tenants.map(tenant => (
                              <option key={tenant.id} value={tenant.id}>
                                {tenant.full_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={balanceFormData.due_amount}
                            onChange={(e) => setBalanceFormData({...balanceFormData, due_amount: e.target.value})}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                          <input
                            type="date"
                            required
                            value={balanceFormData.due_date}
                            onChange={(e) => setBalanceFormData({...balanceFormData, due_date: e.target.value})}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          Record Balance
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowBalanceForm(false)}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {outstandingBalances.map((balance) => (
                        <tr key={balance.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {getPropertyName(balance.property_id)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getTenantName(balance.tenant_id)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${parseFloat(balance.due_amount || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(balance.due_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              balance.is_resolved 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {balance.is_resolved ? 'Resolved' : 'Outstanding'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleDeleteBalance(balance.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {outstandingBalances.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No outstanding balances recorded yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialManagement;
