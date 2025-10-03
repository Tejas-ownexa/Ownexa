import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Building,
  BookOpen,
  FileText,
  Edit,
  Eye,
  ArrowUp,
  ArrowDown,
  BarChart3,
  RefreshCw,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../../utils/axios';
import { AccountCategoryBalancesChart, MonthlyDebitCreditChart } from '../../components/charts/AccountabilityCharts';

const GeneralLedger = () => {
  const { user } = useAuth();
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [filters, setFilters] = useState({
    property_id: '',
    account_category: '',
    start_date: '',
    end_date: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    totalAssets: 0,
    totalLiabilities: 0,
    totalEquity: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    netWorth: 0,
    monthlyActivity: 0,
    unreconciled: 0,
    assetsTrend: 0,
    netWorthTrend: 0,
    activityTrend: 0,
    unreconciledTrend: 0
  });

  // Chart data state
  const [chartData, setChartData] = useState({
    accountCategories: {
      labels: [],
      values: []
    },
    monthlyActivity: {
      labels: [],
      credits: [],
      debits: []
    }
  });

  // Form state for creating new ledger entry
  const [formData, setFormData] = useState({
    property_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    transaction_type: 'debit',
    account_category: 'assets',
    account_subcategory: '',
    amount: 0,
    reference_number: '',
    description: '',
    notes: ''
  });

  useEffect(() => {
    fetchProperties();
    fetchDashboardData();
    fetchLedgerEntries();
  }, [filters]);

  const fetchProperties = async () => {
    try {
      const response = await axios.get('/api/properties');
      setProperties(response.data);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/accountability/dashboard/general-ledger');
      setDashboardData(response.data);
      setChartData(response.data.chartData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const fetchLedgerEntries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.property_id) params.append('property_id', filters.property_id);
      if (filters.account_category) params.append('account_category', filters.account_category);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);

      const response = await axios.get(`/api/accountability/general-ledger?${params}`);
      setLedgerEntries(response.data);
    } catch (error) {
      console.error('Error fetching ledger entries:', error);
      toast.error('Failed to load ledger entries');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      property_id: '',
      account_category: '',
      start_date: '',
      end_date: ''
    });
    setSearchTerm('');
  };

  const filteredEntries = ledgerEntries.filter(entry => {
    const matchesSearch = searchTerm === '' || 
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.property_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.account_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.account_subcategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.reference_number && entry.reference_number.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const handleCreateLedgerEntry = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.property_id) {
      toast.error('Please select a property');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    if (formData.amount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }
    if (!formData.account_subcategory) {
      toast.error('Please select an account subcategory');
      return;
    }
    
    try {
      const response = await axios.post('/api/accountability/general-ledger', formData);
      toast.success('Ledger entry created successfully');
      setShowCreateModal(false);
      setFormData({
        property_id: '',
        transaction_date: new Date().toISOString().split('T')[0],
        transaction_type: 'debit',
        account_category: 'assets',
        account_subcategory: '',
        amount: 0,
        reference_number: '',
        description: '',
        notes: ''
      });
      fetchLedgerEntries();
      fetchDashboardData();
    } catch (error) {
      console.error('Error creating ledger entry:', error);
      toast.error(error.response?.data?.error || 'Failed to create ledger entry');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleViewEntry = async (entryId) => {
    try {
      const response = await axios.get(`/api/accountability/general-ledger/${entryId}`);
      setSelectedEntry(response.data);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error fetching ledger entry:', error);
      toast.error('Failed to load ledger entry details');
    }
  };

  const handleEditEntry = async (entryId) => {
    try {
      const response = await axios.get(`/api/accountability/general-ledger/${entryId}`);
      setSelectedEntry(response.data);
      setFormData({
        property_id: response.data.property_id,
        transaction_date: response.data.transaction_date,
        transaction_type: response.data.transaction_type,
        account_category: response.data.account_category,
        account_subcategory: response.data.account_subcategory,
        amount: response.data.amount,
        reference_number: response.data.reference_number,
        description: response.data.description,
        notes: response.data.notes
      });
      setShowEditModal(true);
    } catch (error) {
      console.error('Error fetching ledger entry:', error);
      toast.error('Failed to load ledger entry for editing');
    }
  };

  const handleUpdateLedgerEntry = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.property_id) {
      toast.error('Please select a property');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    if (formData.amount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }
    if (!formData.account_subcategory) {
      toast.error('Please select an account subcategory');
      return;
    }
    
    try {
      await axios.put(`/api/accountability/general-ledger/${selectedEntry.id}`, formData);
      toast.success('Ledger entry updated successfully');
      setShowEditModal(false);
      setSelectedEntry(null);
      setFormData({
        property_id: '',
        transaction_date: new Date().toISOString().split('T')[0],
        transaction_type: 'debit',
        account_category: 'assets',
        account_subcategory: '',
        amount: 0,
        reference_number: '',
        description: '',
        notes: ''
      });
      fetchLedgerEntries();
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating ledger entry:', error);
      toast.error(error.response?.data?.error || 'Failed to update ledger entry');
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (window.confirm('Are you sure you want to delete this ledger entry? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/accountability/general-ledger/${entryId}`);
        toast.success('Ledger entry deleted successfully');
        fetchLedgerEntries();
      } catch (error) {
        console.error('Error deleting ledger entry:', error);
        toast.error(error.response?.data?.error || 'Failed to delete ledger entry');
      }
    }
  };

  const accountCategories = [
    { value: 'assets', label: 'Assets' },
    { value: 'liabilities', label: 'Liabilities' },
    { value: 'equity', label: 'Equity' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'expenses', label: 'Expenses' }
  ];

  const accountSubcategories = {
    assets: [
      { value: 'cash', label: 'Cash' },
      { value: 'accounts_receivable', label: 'Accounts Receivable' },
      { value: 'prepaid_expenses', label: 'Prepaid Expenses' },
      { value: 'property_equipment', label: 'Property & Equipment' }
    ],
    liabilities: [
      { value: 'accounts_payable', label: 'Accounts Payable' },
      { value: 'mortgage_payable', label: 'Mortgage Payable' },
      { value: 'accrued_expenses', label: 'Accrued Expenses' }
    ],
    equity: [
      { value: 'owner_equity', label: 'Owner Equity' },
      { value: 'retained_earnings', label: 'Retained Earnings' }
    ],
    revenue: [
      { value: 'rental_income', label: 'Rental Income' },
      { value: 'other_income', label: 'Other Income' }
    ],
    expenses: [
      { value: 'maintenance_expense', label: 'Maintenance Expense' },
      { value: 'utilities_expense', label: 'Utilities Expense' },
      { value: 'insurance_expense', label: 'Insurance Expense' },
      { value: 'property_tax_expense', label: 'Property Tax Expense' },
      { value: 'mortgage_expense', label: 'Mortgage Expense' }
    ]
  };

  const getSubcategories = () => {
    return accountSubcategories[formData.account_category] || [];
  };

  const KPICard = ({ title, value, trend, trendValue, icon: Icon, iconColor, trendColor }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{value}</p>
          <div className={`flex items-center text-sm ${trendColor}`}>
            {trend === 'up' ? (
              <ArrowUp className="h-4 w-4 mr-1" />
            ) : trend === 'down' ? (
              <ArrowDown className="h-4 w-4 mr-1" />
            ) : (
              <span className="mr-1">—</span>
            )}
            <span>{trendValue}</span>
          </div>
        </div>
        <div className={`p-3 rounded-full ${iconColor} bg-opacity-10`}>
          <Icon className={`h-8 w-8 ${iconColor.replace('text-', 'text-').replace('bg-', 'text-')}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">General ledger</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Comprehensive account activity and balance analysis</p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-secondary flex items-center space-x-2">
            <Lock className="h-5 w-5" />
            <span>View locked periods</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Record general journal entry</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Assets"
          value={`$${dashboardData.totalAssets.toLocaleString()}`}
          trend={dashboardData.assetsTrend >= 0 ? "up" : "down"}
          trendValue={`${dashboardData.assetsTrend >= 0 ? '+' : ''}${dashboardData.assetsTrend}% vs last period`}
          icon={DollarSign}
          iconColor="text-green-500"
          trendColor={dashboardData.assetsTrend >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
        />
        <KPICard
          title="Net Worth"
          value={`$${dashboardData.netWorth.toLocaleString()}`}
          trend={dashboardData.netWorthTrend >= 0 ? "up" : "down"}
          trendValue={`${dashboardData.netWorthTrend >= 0 ? '+' : ''}${dashboardData.netWorthTrend}% vs last period`}
          icon={DollarSign}
          iconColor="text-blue-500"
          trendColor={dashboardData.netWorthTrend >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}
        />
        <KPICard
          title="Net Income"
          value={`$${dashboardData.netIncome.toLocaleString()}`}
          trend={dashboardData.netIncome >= 0 ? "up" : "down"}
          trendValue={`${dashboardData.netIncome >= 0 ? 'Profitable' : 'Loss'}`}
          icon={TrendingUp}
          iconColor={dashboardData.netIncome >= 0 ? "text-green-500" : "text-red-500"}
          trendColor={dashboardData.netIncome >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
        />
        <KPICard
          title="Monthly Activity"
          value={dashboardData.monthlyActivity}
          trend={dashboardData.activityTrend >= 0 ? "up" : "down"}
          trendValue={`${dashboardData.activityTrend >= 0 ? '+' : ''}${dashboardData.activityTrend}% vs last period`}
          icon={TrendingUp}
          iconColor="text-purple-500"
          trendColor={dashboardData.activityTrend >= 0 ? "text-purple-600" : "text-red-600"}
        />
      </div>

      {/* Additional Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Liabilities"
          value={`$${dashboardData.totalLiabilities.toLocaleString()}`}
          trend="neutral"
          trendValue="Current"
          icon={AlertTriangle}
          iconColor="text-orange-500"
          trendColor="text-orange-600 dark:text-orange-400"
        />
        <KPICard
          title="Total Revenue"
          value={`$${dashboardData.totalRevenue.toLocaleString()}`}
          trend="up"
          trendValue="YTD"
          icon={DollarSign}
          iconColor="text-green-500"
          trendColor="text-green-600 dark:text-green-400"
        />
        <KPICard
          title="Total Expenses"
          value={`$${dashboardData.totalExpenses.toLocaleString()}`}
          trend="neutral"
          trendValue="YTD"
          icon={AlertTriangle}
          iconColor="text-red-500"
          trendColor="text-red-600 dark:text-red-400"
        />
        <KPICard
          title="Unreconciled"
          value={dashboardData.unreconciled}
          trend="down"
          trendValue={`${dashboardData.unreconciledTrend} vs last period`}
          icon={AlertTriangle}
          iconColor="text-yellow-500"
          trendColor="text-orange-600 dark:text-orange-400"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Category Balances Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Account Category Balances</h3>
            <button className="p-2 text-gray-400 dark:text-gray-500 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-300 rounded-md">
              <BarChart3 className="h-5 w-5" />
            </button>
          </div>
          <div className="h-64">
            <AccountCategoryBalancesChart data={chartData.accountCategories} />
          </div>
        </div>

        {/* Monthly Debit/Credit Activity Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Debit/Credit Activity</h3>
            <button className="p-2 text-gray-400 dark:text-gray-500 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-300 rounded-md">
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
          <div className="h-64">
            <MonthlyDebitCreditChart data={chartData.monthlyActivity} />
          </div>
        </div>
      </div>

      {/* Ledger Entries Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
        <div className="p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ledger Entries</h3>
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-secondary flex items-center space-x-2 ${showFilters ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
              >
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </button>
              <button 
                onClick={() => {
                  fetchLedgerEntries();
                  fetchDashboardData();
                }}
                className="btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by description, property, account, or reference number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Property</label>
                  <select
                    name="property_id"
                    value={filters.property_id}
                    onChange={handleFilterChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                  >
                    <option value="">All Properties</option>
                    {properties.map(property => (
                      <option key={property.id} value={property.id}>{property.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Category</label>
                  <select
                    name="account_category"
                    value={filters.account_category}
                    onChange={handleFilterChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                  >
                    <option value="">All Categories</option>
                    {accountCategories.map(category => (
                      <option key={category.value} value={category.value}>{category.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    name="start_date"
                    value={filters.start_date}
                    onChange={handleFilterChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={filters.end_date}
                    onChange={handleFilterChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={clearFilters}
                  className="btn-secondary text-sm"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Loading ledger entries...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{entry.transaction_date}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{entry.property_title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {entry.transaction_type === 'debit' ? (
                            <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                          ) : (
                            <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                          )}
                          <span className={`text-sm font-medium ${
                            entry.transaction_type === 'debit' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                          }`}>
                            {entry.transaction_type.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div className="font-medium">{entry.account_category}</div>
                          <div className="text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300">{entry.account_subcategory}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                          {entry.description}
                        </div>
                        {entry.reference_number && (
                          <div className="text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300">Ref: {entry.reference_number}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          entry.transaction_type === 'debit' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                        }`}>
                          ${entry.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          ${entry.running_balance.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleViewEntry(entry.id)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleEditEntry(entry.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit Entry"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Entry"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredEntries.length === 0 && (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 dark:text-gray-500 dark:text-gray-300 mx-auto mb-4" />
                  {searchTerm || Object.values(filters).some(filter => filter !== '') ? (
                    <>
                      <p className="text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300">No ledger entries match your search criteria</p>
                      <button
                        onClick={clearFilters}
                        className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200 font-medium"
                      >
                        Clear filters and search
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300">No ledger entries found</p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200 font-medium"
                      >
                        Create your first ledger entry
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Ledger Entry Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Create Ledger Entry</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 dark:text-gray-500 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-300"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateLedgerEntry} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Property</label>
                  <select
                    name="property_id"
                    value={formData.property_id}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Property</option>
                    {properties.map(property => (
                      <option key={property.id} value={property.id}>{property.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transaction Date</label>
                  <input
                    type="date"
                    name="transaction_date"
                    value={formData.transaction_date}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transaction Type</label>
                  <select
                    name="transaction_type"
                    value={formData.transaction_type}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="debit">Debit</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleNumberInputChange}
                    step="0.01"
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Category</label>
                  <select
                    name="account_category"
                    value={formData.account_category}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {accountCategories.map(category => (
                      <option key={category.value} value={category.value}>{category.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Subcategory</label>
                  <select
                    name="account_subcategory"
                    value={formData.account_subcategory}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Subcategory</option>
                    {getSubcategories().map(subcategory => (
                      <option key={subcategory.value} value={subcategory.value}>{subcategory.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reference Number</label>
                <input
                  type="text"
                  name="reference_number"
                  value={formData.reference_number}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Invoice number, check number, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detailed description of the transaction..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Create Ledger Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Ledger Entry Modal */}
      {showViewModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Ledger Entry Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 dark:text-gray-500 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-300"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Property</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedEntry.property_title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transaction Date</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedEntry.transaction_date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transaction Type</label>
                  <p className={`text-sm font-medium ${
                    selectedEntry.transaction_type === 'debit' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                  }`}>
                    {selectedEntry.transaction_type.toUpperCase()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                  <p className={`text-sm font-medium ${
                    selectedEntry.transaction_type === 'debit' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                  }`}>
                    ${selectedEntry.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Category</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedEntry.account_category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Subcategory</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedEntry.account_subcategory}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Running Balance</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">${selectedEntry.running_balance.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reference Number</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedEntry.reference_number || 'N/A'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedEntry.description}</p>
              </div>

              {selectedEntry.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedEntry.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Posted By</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedEntry.posted_by || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Created At</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedEntry.created_at ? new Date(selectedEntry.created_at).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="btn-secondary"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditEntry(selectedEntry.id);
                }}
                className="btn-primary"
              >
                Edit Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Ledger Entry Modal */}
      {showEditModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Edit Ledger Entry</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 dark:text-gray-500 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-300"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateLedgerEntry} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Property</label>
                  <select
                    name="property_id"
                    value={formData.property_id}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Property</option>
                    {properties.map(property => (
                      <option key={property.id} value={property.id}>{property.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transaction Date</label>
                  <input
                    type="date"
                    name="transaction_date"
                    value={formData.transaction_date}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transaction Type</label>
                  <select
                    name="transaction_type"
                    value={formData.transaction_type}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="debit">Debit</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleNumberInputChange}
                    step="0.01"
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Category</label>
                  <select
                    name="account_category"
                    value={formData.account_category}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {accountCategories.map(category => (
                      <option key={category.value} value={category.value}>{category.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Subcategory</label>
                  <select
                    name="account_subcategory"
                    value={formData.account_subcategory}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Subcategory</option>
                    {getSubcategories().map(subcategory => (
                      <option key={subcategory.value} value={subcategory.value}>{subcategory.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reference Number</label>
                <input
                  type="text"
                  name="reference_number"
                  value={formData.reference_number}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Invoice number, check number, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detailed description of the transaction..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Update Ledger Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralLedger;
