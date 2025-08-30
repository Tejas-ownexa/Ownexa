import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Building,
  DollarSign,
  FileText,
  Edit,
  Eye,
  ArrowUp,
  ArrowDown,
  BarChart3,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Calculator,
  Receipt,
  PiggyBank,
  AlertCircle,
  Home
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from '../../utils/axios';
import { RevenueExpenseTrendChart, ExpenseBreakdownChart } from '../../components/charts/AccountabilityCharts';

const AccountabilityFinancials = () => {
  const { user } = useAuth();
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showDetails, setShowDetails] = useState({});
  const [financials, setFinancials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    property_id: '',
    financial_year: '',
    financial_period: ''
  });

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    properties: 0,
    revenueTrend: 0,
    expensesTrend: 0,
    profitTrend: 0,
    propertiesTrend: 0
  });

  // Chart data state
  const [chartData, setChartData] = useState({
    revenueExpense: {
      labels: [],
      revenue: [],
      expenses: []
    },
    expenseBreakdown: {
      labels: [],
      values: []
    }
  });

  // Form state for creating new financial record
  const [formData, setFormData] = useState({
    property_id: '',
    financial_year: new Date().getFullYear(),
    financial_period: 'monthly',
    period_start_date: '',
    period_end_date: '',
    total_rental_income: 0,
    other_income: 0,
    mortgage_payments: 0,
    property_taxes: 0,
    insurance_costs: 0,
    maintenance_costs: 0,
    utilities: 0,
    hoa_fees: 0,
    property_management_fees: 0,
    other_expenses: 0,
    notes: ''
  });

  // Fetch user's properties
  const { data: properties, isLoading: propertiesLoading } = useQuery(
    ['properties', user?.id],
    async () => {
      const response = await axios.get(`/api/properties?owner_id=${user?.id}`);
      return response.data;
    },
    {
      enabled: !!user?.id,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch financial data for all properties
  const { data: financialData, isLoading: financialLoading } = useQuery(
    ['financial-data', properties],
    async () => {
      if (!properties || properties.length === 0) return [];
      
      const financialPromises = properties.map(async (property) => {
        try {
          const [summaryRes, financialRes, transactionsRes] = await Promise.all([
            axios.get(`/api/financial/summary/${property.id}`),
            axios.get(`/api/financial/property/${property.id}/financial`),
            axios.get(`/api/financial/property/${property.id}/transactions`)
          ]);
          
          return {
            property,
            summary: summaryRes.data,
            financial: financialRes.data,
            transactions: transactionsRes.data || []
          };
        } catch (error) {
          console.error(`Error fetching financial data for property ${property.id}:`, error);
          return {
            property,
            summary: null,
            financial: null,
            transactions: []
          };
        }
      });
      
      return Promise.all(financialPromises);
    },
    {
      enabled: !!properties && properties.length > 0,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );

  useEffect(() => {
    fetchDashboardData();
    fetchFinancials();
  }, [filters]);

  const fetchFinancials = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.property_id) params.append('property_id', filters.property_id);
      if (filters.financial_year) params.append('financial_year', filters.financial_year);
      if (filters.financial_period) params.append('financial_period', filters.financial_period);

      const response = await axios.get(`/api/accountability/financials?${params}`);
      setFinancials(response.data);
    } catch (error) {
      console.error('Error fetching financials:', error);
      toast.error('Failed to load financial records');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setDashboardLoading(true);
      const response = await axios.get('/api/accountability/dashboard/financials');
      setDashboardData(response.data);
      setChartData(response.data.chartData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setDashboardLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value) => {
    if (!value) return '0.00%';
    return `${parseFloat(value).toFixed(2)}%`;
  };

  const calculateNetProfit = (propertyData) => {
    if (!propertyData) return 0;
    
    const monthlyRent = propertyData.property?.rent_amount || 0;
    const monthlyExpenses = propertyData.summary?.total_monthly_expenses || 0;
    
    return monthlyRent - monthlyExpenses;
  };

  const calculateAnnualNetProfit = (propertyData) => {
    return calculateNetProfit(propertyData) * 12;
  };

  const getTotalIncome = () => {
    if (!financialData) return 0;
    return financialData.reduce((total, data) => {
      return total + (data.property?.rent_amount || 0);
    }, 0);
  };

  const getTotalExpenses = () => {
    if (!financialData) return 0;
    return financialData.reduce((total, data) => {
      return total + (data.summary?.total_monthly_expenses || 0);
    }, 0);
  };

  const getTotalNetProfit = () => {
    return getTotalIncome() - getTotalExpenses();
  };

  const togglePropertyDetails = (propertyId) => {
    setShowDetails(prev => ({
      ...prev,
      [propertyId]: !prev[propertyId]
    }));
  };

  const handleCreateFinancial = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/accountability/financials', formData);
      toast.success('Financial record created successfully');
      setShowCreateModal(false);
      setFormData({
        property_id: '',
        financial_year: new Date().getFullYear(),
        financial_period: 'monthly',
        period_start_date: '',
        period_end_date: '',
        total_rental_income: 0,
        other_income: 0,
        mortgage_payments: 0,
        property_taxes: 0,
        insurance_costs: 0,
        maintenance_costs: 0,
        utilities: 0,
        hoa_fees: 0,
        property_management_fees: 0,
        other_expenses: 0,
        notes: ''
      });
      fetchFinancials();
      fetchDashboardData();
    } catch (error) {
      console.error('Error creating financial record:', error);
      toast.error(error.response?.data?.error || 'Failed to create financial record');
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

  if (propertiesLoading || financialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <div className="text-center py-12">
        <Home className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No properties found</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by adding your first property.</p>
        <div className="mt-6">
          <Link
            to="/add-property"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Add Property
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Ledger</h1>
            <p className="text-gray-600">Complete financial overview of all properties</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Properties</p>
              <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              New Financial Record
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Monthly Income</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(getTotalIncome())}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Receipt className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Monthly Expenses</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(getTotalExpenses())}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <PiggyBank className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Net Monthly Profit</p>
              <p className={`text-2xl font-bold ${getTotalNetProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(getTotalNetProfit())}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue & Expense Trend</h3>
          <div className="h-64">
            <RevenueExpenseTrendChart data={chartData.revenueExpense} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
          <div className="h-64">
            <ExpenseBreakdownChart data={chartData.expenseBreakdown} />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Property Ledger</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monthly Rent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monthly Expenses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Monthly Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Annual Net Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ROI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {financialData?.map((data, index) => {
                const netMonthlyProfit = calculateNetProfit(data);
                const annualNetProfit = calculateAnnualNetProfit(data);
                const roi = data.summary?.annual_roi || 0;
                
                return (
                  <React.Fragment key={data.property.id}>
                    <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {data.property.image_url ? (
                              <img
                                className="h-10 w-10 rounded-lg object-cover"
                                src={`http://localhost:5002/uploads/${data.property.image_url}`}
                                alt={data.property.title}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                }}
                              />
                            ) : null}
                            {(!data.property.image_url || data.property.image_url === '') && (
                              <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                <Home className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {data.property.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {data.property.address?.street_1}, {data.property.address?.city}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(data.property.rent_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(data.summary?.total_monthly_expenses || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${netMonthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(netMonthlyProfit)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${annualNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(annualNetProfit)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPercentage(roi)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => togglePropertyDetails(data.property.id)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          {showDetails[data.property.id] ? (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded Details Row */}
                    {showDetails[data.property.id] && (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="bg-white p-4 rounded-lg border">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Mortgage Details</h4>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Monthly Payment:</span>
                                    <span className="font-medium">{formatCurrency(data.financial?.monthly_loan_payment || 0)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">APR:</span>
                                    <span className="font-medium">{formatPercentage(data.financial?.current_apr || 0)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Loan Term:</span>
                                    <span className="font-medium">{data.financial?.loan_term_years || 0} years</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-white p-4 rounded-lg border">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Property Taxes & Insurance</h4>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Annual Taxes:</span>
                                    <span className="font-medium">{formatCurrency(data.financial?.property_tax_annual || 0)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Annual Insurance:</span>
                                    <span className="font-medium">{formatCurrency(data.financial?.insurance_annual || 0)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">HOA Fees:</span>
                                    <span className="font-medium">{formatCurrency(data.financial?.hoa_fees_monthly || 0)}/mo</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-white p-4 rounded-lg border">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Property Value</h4>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Total Value:</span>
                                    <span className="font-medium">{formatCurrency(data.financial?.total_value || 0)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Purchase Price:</span>
                                    <span className="font-medium">{formatCurrency(data.financial?.purchase_price || 0)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Down Payment:</span>
                                    <span className="font-medium">{formatCurrency(data.financial?.down_payment || 0)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-white p-4 rounded-lg border">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Transactions</h4>
                                <div className="space-y-1 text-sm">
                                  {data.transactions?.slice(0, 3).map((transaction, idx) => (
                                    <div key={idx} className="flex justify-between">
                                      <span className="text-gray-500 truncate">{transaction.description}</span>
                                      <span className={`font-medium ${transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                        {transaction.transaction_type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                      </span>
                                    </div>
                                  ))}
                                  {(!data.transactions || data.transactions.length === 0) && (
                                    <span className="text-gray-400">No recent transactions</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Annual Income</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(getTotalIncome() * 12)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Annual Expenses</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(getTotalExpenses() * 12)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Annual Net Profit</p>
            <p className={`text-xl font-bold ${getTotalNetProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(getTotalNetProfit() * 12)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Average ROI</p>
            <p className="text-xl font-bold text-blue-600">
              {financialData && financialData.length > 0 
                ? formatPercentage(
                    financialData.reduce((sum, data) => sum + (data.summary?.annual_roi || 0), 0) / financialData.length
                  )
                : '0.00%'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Create Financial Record Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">New Financial Record</h3>
              <form onSubmit={handleCreateFinancial} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Property</label>
                  <select
                    name="property_id"
                    value={formData.property_id}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Property</option>
                    {properties.map(property => (
                      <option key={property.id} value={property.id}>
                        {property.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Financial Year</label>
                    <input
                      type="number"
                      name="financial_year"
                      value={formData.financial_year}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Period</label>
                    <select
                      name="financial_period"
                      value={formData.financial_period}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annually">Annually</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      name="period_start_date"
                      value={formData.period_start_date}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <input
                      type="date"
                      name="period_end_date"
                      value={formData.period_end_date}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rental Income</label>
                    <input
                      type="number"
                      step="0.01"
                      name="total_rental_income"
                      value={formData.total_rental_income}
                      onChange={handleNumberInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Other Income</label>
                    <input
                      type="number"
                      step="0.01"
                      name="other_income"
                      value={formData.other_income}
                      onChange={handleNumberInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mortgage Payments</label>
                    <input
                      type="number"
                      step="0.01"
                      name="mortgage_payments"
                      value={formData.mortgage_payments}
                      onChange={handleNumberInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Property Taxes</label>
                    <input
                      type="number"
                      step="0.01"
                      name="property_taxes"
                      value={formData.property_taxes}
                      onChange={handleNumberInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Insurance Costs</label>
                    <input
                      type="number"
                      step="0.01"
                      name="insurance_costs"
                      value={formData.insurance_costs}
                      onChange={handleNumberInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Maintenance Costs</label>
                    <input
                      type="number"
                      step="0.01"
                      name="maintenance_costs"
                      value={formData.maintenance_costs}
                      onChange={handleNumberInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Utilities</label>
                    <input
                      type="number"
                      step="0.01"
                      name="utilities"
                      value={formData.utilities}
                      onChange={handleNumberInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">HOA Fees</label>
                    <input
                      type="number"
                      step="0.01"
                      name="hoa_fees"
                      value={formData.hoa_fees}
                      onChange={handleNumberInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Management Fees</label>
                    <input
                      type="number"
                      step="0.01"
                      name="property_management_fees"
                      value={formData.property_management_fees}
                      onChange={handleNumberInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Other Expenses</label>
                    <input
                      type="number"
                      step="0.01"
                      name="other_expenses"
                      value={formData.other_expenses}
                      onChange={handleNumberInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Create Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountabilityFinancials;
