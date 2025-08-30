import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import { 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  ChevronDown,
  X,
  CheckSquare,
  Plus
} from 'lucide-react';

const OutstandingBalances = () => {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    rentalType: 'All rentals',
    status: '(2) Future, Active',
    balanceFilter: '61 - 90 days'
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOutstandingBalances();
  }, []);

  const fetchOutstandingBalances = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/rentals/outstanding-balances');
      
      // Transform the data to match the expected format
      const transformedData = response.data.map(balance => ({
        id: balance.id,
        lease: `${balance.property_title} - ${balance.tenant_name}`,
        pastDueEmail: balance.tenant_email || 'No email address',
        days0_30: balance.days_overdue <= 30 ? balance.due_amount : 0,
        days31_60: balance.days_overdue > 30 && balance.days_overdue <= 60 ? balance.due_amount : 0,
        days61_90: balance.days_overdue > 60 && balance.days_overdue <= 90 ? balance.due_amount : 0,
        days90_plus: balance.days_overdue > 90 ? balance.due_amount : 0,
        balance: balance.due_amount,
        tenantEmail: balance.tenant_email,
        propertyTitle: balance.property_title,
        tenantName: balance.tenant_name,
        dueDate: balance.due_date
      }));
      
      setBalances(transformedData);
    } catch (error) {
      console.error('Error fetching outstanding balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    return balances.reduce((totals, balance) => ({
      days0_30: totals.days0_30 + (balance.days0_30 || 0),
      days31_60: totals.days31_60 + (balance.days31_60 || 0),
      days61_90: totals.days61_90 + (balance.days61_90 || 0),
      days90_plus: totals.days90_plus + (balance.days90_plus || 0),
      total: totals.total + (balance.balance || 0)
    }), {
      days0_30: 0,
      days31_60: 0,
      days61_90: 0,
      days90_plus: 0,
      total: 0
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting data...');
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const removeBalanceFilter = () => {
    setFilters(prev => ({
      ...prev,
      balanceFilter: null
    }));
  };

  const filteredBalances = balances.filter(balance => {
    if (searchTerm) {
      return balance.lease.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Outstanding lease balances</h1>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* All rentals dropdown */}
          <div className="relative">
            <select
              value={filters.rentalType}
              onChange={(e) => handleFilterChange('rentalType', e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option>All rentals</option>
              <option>Active rentals</option>
              <option>Future rentals</option>
            </select>
            <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Status dropdown */}
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option>(2) Future, Active</option>
              <option>(1) Active</option>
              <option>(1) Future</option>
            </select>
            <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Add filter option */}
          <div className="relative">
            <select className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>Add filter option</option>
              <option>Property</option>
              <option>Tenant</option>
              <option>Amount</option>
            </select>
            <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Balance Filter */}
          {filters.balanceFilter && (
            <div className="flex items-center bg-green-50 border border-green-200 rounded-md px-3 py-2">
              <div className="w-1 h-4 bg-green-500 rounded mr-2"></div>
              <span className="text-sm text-green-800 mr-2">BALANCE</span>
              <select
                value={filters.balanceFilter}
                onChange={(e) => handleFilterChange('balanceFilter', e.target.value)}
                className="bg-transparent border-none text-sm text-green-800 focus:outline-none"
              >
                <option>61 - 90 days</option>
                <option>0 - 30 days</option>
                <option>31 - 60 days</option>
                <option>90+ days</option>
              </select>
              <button
                onClick={() => handleFilterChange('balanceFilter', 'Apply filter')}
                className="ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
              >
                Apply filter
              </button>
              <button
                onClick={removeBalanceFilter}
                className="ml-2 text-green-600 hover:text-green-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results and Export */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-600">{filteredBalances.length} matches</span>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <CheckSquare className="h-4 w-4 text-gray-400" />
                </th>
                <th className="px-4 py-3 text-left">
                  <Plus className="h-4 w-4 text-gray-400" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LEASE
                  <ChevronDown className="inline ml-1 h-3 w-3" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PAST DUE EMAIL
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  0 - 30 DAYS
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  31 - 60 DAYS
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  61 - 90 DAYS
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  90+ DAYS
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BALANCE
                </th>
                <th className="px-4 py-3 text-left">
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBalances.map((balance) => (
                <tr key={balance.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <CheckSquare className="h-4 w-4 text-gray-400" />
                  </td>
                  <td className="px-4 py-3">
                    <Plus className="h-4 w-4 text-gray-400" />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {balance.lease}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {balance.pastDueEmail}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {balance.days0_30 > 0 ? formatCurrency(balance.days0_30) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {balance.days31_60 > 0 ? formatCurrency(balance.days31_60) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {balance.days61_90 > 0 ? formatCurrency(balance.days61_90) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {balance.days90_plus > 0 ? formatCurrency(balance.days90_plus) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {formatCurrency(balance.balance)}
                  </td>
                  <td className="px-4 py-3">
                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                  </td>
                </tr>
              ))}
              
              {/* Totals Row */}
              <tr className="bg-gray-50 font-medium">
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 text-sm text-gray-900">Total</td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {formatCurrency(totals.days0_30)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {formatCurrency(totals.days31_60)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {formatCurrency(totals.days61_90)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {formatCurrency(totals.days90_plus)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {formatCurrency(totals.total)}
                </td>
                <td className="px-4 py-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {filteredBalances.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No outstanding balances found</p>
        </div>
      )}
    </div>
  );
};

export default OutstandingBalances;
