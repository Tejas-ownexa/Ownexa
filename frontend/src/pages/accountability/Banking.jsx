import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Building,
  CreditCard,
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
  Lock,
  Download,
  Upload,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../../utils/axios';
import { AccountBalancesChart, TransactionActivityChart } from '../../components/charts/AccountabilityCharts';

const Banking = () => {
  const { user } = useAuth();
  const [bankingAccounts, setBankingAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [showCreateTransactionModal, setShowCreateTransactionModal] = useState(false);
  const [filters, setFilters] = useState({
    property_id: '',
    account_type: '',
    start_date: '',
    end_date: ''
  });

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    totalBalance: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingTransactions: 0,
    balanceTrend: 0,
    depositsTrend: 0,
    withdrawalsTrend: 0,
    pendingTrend: 0
  });

  // Chart data state
  const [chartData, setChartData] = useState({
    accountBalances: {
      labels: [],
      values: []
    },
    transactionActivity: {
      labels: [],
      deposits: [],
      withdrawals: []
    }
  });

  // Form state for creating new bank account
  const [accountFormData, setAccountFormData] = useState({
    property_id: '',
    bank_name: '',
    account_name: '',
    account_number: '',
    account_type: 'checking',
    routing_number: '',
    current_balance: 0,
    available_balance: 0,
    interest_rate: 0,
    monthly_fee: 0,
    notes: ''
  });

  // Form state for creating new transaction
  const [transactionFormData, setTransactionFormData] = useState({
    banking_account_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    posted_date: new Date().toISOString().split('T')[0],
    transaction_type: 'deposit',
    amount: 0,
    description: '',
    reference_number: '',
    payee: '',
    category: '',
    notes: ''
  });

  useEffect(() => {
    fetchProperties();
    fetchDashboardData();
    fetchBankingAccounts();
  }, [filters]);

  useEffect(() => {
    if (selectedAccount) {
      fetchTransactions(selectedAccount.id);
    }
  }, [selectedAccount]);

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
      const response = await axios.get('/api/accountability/dashboard/banking');
      setDashboardData(response.data);
      setChartData(response.data.chartData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const fetchBankingAccounts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.property_id) params.append('property_id', filters.property_id);
      if (filters.account_type) params.append('account_type', filters.account_type);

      const response = await axios.get(`/api/accountability/banking?${params}`);
      setBankingAccounts(response.data);
      if (response.data.length > 0 && !selectedAccount) {
        setSelectedAccount(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching banking accounts:', error);
      toast.error('Failed to load banking accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (accountId) => {
    try {
      const response = await axios.get(`/api/accountability/banking/${accountId}/transactions`);
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/accountability/banking', accountFormData);
      toast.success('Bank account created successfully');
      setShowCreateAccountModal(false);
      setAccountFormData({
        property_id: '',
        bank_name: '',
        account_name: '',
        account_number: '',
        account_type: 'checking',
        routing_number: '',
        current_balance: 0,
        available_balance: 0,
        interest_rate: 0,
        monthly_fee: 0,
        notes: ''
      });
      fetchBankingAccounts();
    } catch (error) {
      console.error('Error creating bank account:', error);
      toast.error(error.response?.data?.error || 'Failed to create bank account');
    }
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`/api/accountability/banking/${selectedAccount.id}/transactions`, transactionFormData);
      toast.success('Transaction created successfully');
      setShowCreateTransactionModal(false);
      setTransactionFormData({
        banking_account_id: '',
        transaction_date: new Date().toISOString().split('T')[0],
        posted_date: new Date().toISOString().split('T')[0],
        transaction_type: 'deposit',
        amount: 0,
        description: '',
        reference_number: '',
        payee: '',
        category: '',
        notes: ''
      });
      fetchTransactions(selectedAccount.id);
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error(error.response?.data?.error || 'Failed to create transaction');
    }
  };

  const handleAccountInputChange = (e) => {
    const { name, value } = e.target;
    setAccountFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAccountNumberInputChange = (e) => {
    const { name, value } = e.target;
    setAccountFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleTransactionInputChange = (e) => {
    const { name, value } = e.target;
    setTransactionFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTransactionNumberInputChange = (e) => {
    const { name, value } = e.target;
    setTransactionFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const accountTypes = [
    { value: 'checking', label: 'Checking' },
    { value: 'savings', label: 'Savings' },
    { value: 'escrow', label: 'Escrow' },
    { value: 'money_market', label: 'Money Market' }
  ];

  const transactionTypes = [
    { value: 'deposit', label: 'Deposit' },
    { value: 'withdrawal', label: 'Withdrawal' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'fee', label: 'Fee' },
    { value: 'interest', label: 'Interest' }
  ];

  const transactionCategories = [
    'Rent Payment',
    'Maintenance',
    'Utilities',
    'Insurance',
    'Property Tax',
    'Mortgage Payment',
    'Management Fee',
    'Other'
  ];

  const KPICard = ({ title, value, trend, trendValue, icon: Icon, iconColor, trendColor }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Banking</h1>
          <p className="text-gray-600 mt-1">Bank account management and transaction tracking</p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-secondary flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Import</span>
          </button>
          <button className="btn-secondary flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowCreateAccountModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add bank account</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Balance"
          value={`$${dashboardData.totalBalance.toLocaleString()}`}
          trend="up"
          trendValue={`+${dashboardData.balanceTrend}% vs last period`}
          icon={DollarSign}
          iconColor="text-green-500"
          trendColor="text-green-600"
        />
        <KPICard
          title="Total Deposits"
          value={`$${dashboardData.totalDeposits.toLocaleString()}`}
          trend="up"
          trendValue={`+${dashboardData.depositsTrend}% vs last period`}
          icon={ArrowUp}
          iconColor="text-blue-500"
          trendColor="text-blue-600"
        />
        <KPICard
          title="Total Withdrawals"
          value={`$${dashboardData.totalWithdrawals.toLocaleString()}`}
          trend="up"
          trendValue={`+${dashboardData.withdrawalsTrend}% vs last period`}
          icon={ArrowDown}
          iconColor="text-red-500"
          trendColor="text-red-600"
        />
        <KPICard
          title="Pending Transactions"
          value={dashboardData.pendingTransactions}
          trend="down"
          trendValue={`${dashboardData.pendingTrend} vs last period`}
          icon={AlertTriangle}
          iconColor="text-yellow-500"
          trendColor="text-orange-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Balances Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Account Balances</h3>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md">
              <BarChart3 className="h-5 w-5" />
            </button>
          </div>
          <div className="h-64">
            <AccountBalancesChart data={chartData.accountBalances} />
          </div>
        </div>

        {/* Transaction Activity Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Transaction Activity</h3>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md">
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
          <div className="h-64">
            <TransactionActivityChart data={chartData.transactionActivity} />
          </div>
        </div>
      </div>

      {/* Banking Accounts and Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Banking Accounts List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Bank Accounts</h3>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md">
                  <Settings className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading accounts...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bankingAccounts.map((account) => (
                    <div
                      key={account.id}
                      onClick={() => setSelectedAccount(account)}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedAccount?.id === account.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{account.bank_name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          account.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {account.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{account.account_name}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{account.account_type}</span>
                        <span className="font-medium text-gray-900">
                          ${account.current_balance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {bankingAccounts.length === 0 && (
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No bank accounts found</p>
                      <button
                        onClick={() => setShowCreateAccountModal(true)}
                        className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Add your first bank account
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedAccount ? `${selectedAccount.bank_name} - Transactions` : 'Transactions'}
                  </h3>
                  {selectedAccount && (
                    <p className="text-sm text-gray-600 mt-1">
                      Balance: ${selectedAccount.current_balance.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button className="btn-secondary flex items-center space-x-2">
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                  </button>
                  <button 
                    onClick={() => setShowCreateTransactionModal(true)}
                    disabled={!selectedAccount}
                    className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Transaction</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              {!selectedAccount ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a bank account to view transactions</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Balance
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
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{transaction.transaction_date}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {transaction.transaction_type === 'deposit' ? (
                                <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                              ) : (
                                <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                              )}
                              <span className={`text-sm font-medium ${
                                transaction.transaction_type === 'deposit' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transaction.transaction_type.toUpperCase()}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {transaction.description}
                            </div>
                            {transaction.payee && (
                              <div className="text-xs text-gray-500">Payee: {transaction.payee}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${
                              transaction.transaction_type === 'deposit' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ${transaction.amount.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              ${transaction.balance_after.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              transaction.status === 'cleared' 
                                ? 'bg-green-100 text-green-800'
                                : transaction.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-900">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="text-indigo-600 hover:text-indigo-900">
                                <Edit className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {transactions.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No transactions found</p>
                      <button
                        onClick={() => setShowCreateTransactionModal(true)}
                        className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Add your first transaction
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Bank Account Modal */}
      {showCreateAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Add Bank Account</h3>
              <button
                onClick={() => setShowCreateAccountModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
                  <select
                    name="property_id"
                    value={accountFormData.property_id}
                    onChange={handleAccountInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Property</option>
                    {properties.map(property => (
                      <option key={property.id} value={property.id}>{property.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    name="bank_name"
                    value={accountFormData.bank_name}
                    onChange={handleAccountInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Chase Bank"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                  <input
                    type="text"
                    name="account_name"
                    value={accountFormData.account_name}
                    onChange={handleAccountInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Main Checking"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    name="account_number"
                    value={accountFormData.account_number}
                    onChange={handleAccountInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Last 4 digits"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                  <select
                    name="account_type"
                    value={accountFormData.account_type}
                    onChange={handleAccountInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {accountTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Routing Number</label>
                  <input
                    type="text"
                    name="routing_number"
                    value={accountFormData.routing_number}
                    onChange={handleAccountInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Balance</label>
                  <input
                    type="number"
                    name="current_balance"
                    value={accountFormData.current_balance}
                    onChange={handleAccountNumberInputChange}
                    step="0.01"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available Balance</label>
                  <input
                    type="number"
                    name="available_balance"
                    value={accountFormData.available_balance}
                    onChange={handleAccountNumberInputChange}
                    step="0.01"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                  <input
                    type="number"
                    name="interest_rate"
                    value={accountFormData.interest_rate}
                    onChange={handleAccountNumberInputChange}
                    step="0.01"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Fee</label>
                  <input
                    type="number"
                    name="monthly_fee"
                    value={accountFormData.monthly_fee}
                    onChange={handleAccountNumberInputChange}
                    step="0.01"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={accountFormData.notes}
                  onChange={handleAccountInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes about this account..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateAccountModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Create Bank Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Transaction Modal */}
      {showCreateTransactionModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Add Transaction</h3>
              <button
                onClick={() => setShowCreateTransactionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Date</label>
                  <input
                    type="date"
                    name="transaction_date"
                    value={transactionFormData.transaction_date}
                    onChange={handleTransactionInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Posted Date</label>
                  <input
                    type="date"
                    name="posted_date"
                    value={transactionFormData.posted_date}
                    onChange={handleTransactionInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                  <select
                    name="transaction_type"
                    value={transactionFormData.transaction_type}
                    onChange={handleTransactionInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {transactionTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={transactionFormData.amount}
                    onChange={handleTransactionNumberInputChange}
                    step="0.01"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={transactionFormData.category}
                    onChange={handleTransactionInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Category</option>
                    {transactionCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                  <input
                    type="text"
                    name="reference_number"
                    value={transactionFormData.reference_number}
                    onChange={handleTransactionInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Check number, invoice number, etc."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={transactionFormData.description}
                  onChange={handleTransactionInputChange}
                  required
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detailed description of the transaction..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payee</label>
                <input
                  type="text"
                  name="payee"
                  value={transactionFormData.payee}
                  onChange={handleTransactionInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Who was paid or who made the payment"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={transactionFormData.notes}
                  onChange={handleTransactionInputChange}
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateTransactionModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Create Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Banking;
