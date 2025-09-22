<<<<<<< HEAD
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Calendar, 
  Calculator,
  Plus,
  Eye,
  FileText,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Home,
  Receipt,
  PiggyBank,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const Financial = () => {
  const { user } = useAuth();
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showDetails, setShowDetails] = useState({});

  // Fetch user's properties
  const { data: properties, isLoading: propertiesLoading } = useQuery(
    ['properties', user?.id],
    async () => {
      const response = await api.get(`/api/properties/?owner_id=${user?.id}`);
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
            api.get(`/api/financial/summary/${property.id}`),
            api.get(`/api/financial/property/${property.id}/financial`),
            api.get(`/api/financial/property/${property.id}/transactions`)
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
    if (!propertyData || !propertyData.property) return 0;
    
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
=======
import React, { useState, useEffect } from 'react';
import { ChevronDown, Search, TrendingUp, TrendingDown, BarChart3, PieChart, DollarSign, Building2, Loader } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie,
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { accountsAPI } from '../api/database';

const Financial = () => {
  const [propertyFilter, setPropertyFilter] = useState('All');
  const [unitFilter, setUnitFilter] = useState('All (2)');
  const [periodFilter, setPeriodFilter] = useState('Three months to date');
  const [basisType, setBasisType] = useState('cash');
  
  // State for API data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [financialData, setFinancialData] = useState([]);
  const [monthlyTrendData, setMonthlyTrendData] = useState([]);
  const [propertyPerformanceData, setPropertyPerformanceData] = useState([]);
  const [expenseBreakdownData, setExpenseBreakdownData] = useState([]);
  const [kpiData, setKpiData] = useState([]);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Use real API endpoints to fetch data from database
        const [summaryRes, trendsRes, expensesRes, performanceRes, financialsRes] = await Promise.all([
          accountsAPI.getFinancialSummary(),
          accountsAPI.getFinancialTrends(),
          accountsAPI.getExpenseBreakdown(),
          accountsAPI.getPropertyPerformance(),
          accountsAPI.getFinancialsByProperty()
        ]);
        
        setKpiData(summaryRes.kpiData);
        setMonthlyTrendData(trendsRes);
        setPropertyPerformanceData(performanceRes);
        setExpenseBreakdownData(expensesRes);
        setFinancialData(financialsRes);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching financial data:', err);
        setError('Failed to load financial data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter handlers
  const handleSearch = async () => {
    try {
      setLoading(true);
      
      // Get filtered data from API with filter parameters
      const [financialsRes, trendsRes] = await Promise.all([
        accountsAPI.getFinancialsByProperty({ 
          property: propertyFilter, 
          unit: unitFilter, 
          period: periodFilter,
          basis: basisType 
        }),
        accountsAPI.getFinancialTrends({ 
          period: periodFilter,
          basis: basisType 
        })
      ]);
      
      // Update state with filtered data
      setFinancialData(financialsRes);
      setMonthlyTrendData(trendsRes);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching filtered data:', err);
      setError('Failed to apply filters. Please try again later.');
      setLoading(false);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading financial data...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="bg-red-100 p-4 rounded-lg">
            <p className="text-red-600">{error}</p>
            <button 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
>>>>>>> c4000e91ef9e66dfad67d379435355dc7c1a0112
        </div>
      </div>
    );
  }

  return (
<<<<<<< HEAD
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
              {financialData?.filter(data => data && data.property)?.map((data, index) => {
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
                                src={`http://localhost:5000/uploads/${data.property.image_url}`}
                                alt={data.property.title}
                                onError={(e) => {
                                  if (e.target) {
                                    e.target.style.display = 'none';
                                  }
                                  if (e.target && e.target.nextSibling) {
                                    e.target.nextSibling.style.display = 'block';
                                  }
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
                              {data.property.street_address_1}, {data.property.city}
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
                                  {data.transactions?.filter(transaction => transaction)?.slice(0, 3).map((transaction, idx) => (
                                    <div key={idx} className="flex justify-between">
                                      <span className="text-gray-500 truncate">{transaction.description || 'Unknown'}</span>
                                      <span className={`font-medium ${transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                        {transaction.transaction_type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount || 0)}
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
                    financialData
                      .filter(data => data && data.summary)
                      .reduce((sum, data) => sum + (data.summary?.annual_roi || 0), 0) / 
                    financialData.filter(data => data && data.summary).length
                  )
                : '0.00%'
              }
            </p>
=======
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Financials</h1>
          <p className="text-gray-600 mt-1">Financial performance analytics and insights</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {kpiData.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                    <div className={`flex items-center mt-2 text-sm ${
                      kpi.color === 'green' ? 'text-green-600' : 
                      kpi.color === 'red' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {kpi.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : kpi.trend === 'down' ? (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      ) : null}
                      <span>{kpi.change} vs last period</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full ${
                    kpi.color === 'green' ? 'bg-green-100' :
                    kpi.color === 'red' ? 'bg-red-100' :
                    kpi.color === 'blue' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`h-6 w-6 ${
                      kpi.color === 'green' ? 'text-green-600' :
                      kpi.color === 'red' ? 'text-red-600' :
                      kpi.color === 'blue' ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Trend Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Revenue & Expense Trend</h3>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, '']} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stackId="1"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.8}
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stackId="2"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.8}
                  name="Expenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Expense Breakdown Pie Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Expense Breakdown</h3>
              <PieChart className="h-5 w-5 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={expenseBreakdownData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {expenseBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, '']} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Property Performance Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Property Performance</h3>
            <Building2 className="h-5 w-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={propertyPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" fill="#3B82F6" name="Revenue ($)" />
              <Line yAxisId="right" type="monotone" dataKey="occupancy" stroke="#10B981" name="Occupancy (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Property or Company Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PROPERTY OR COMPANY
              </label>
              <div className="relative">
                <select
                  value={propertyFilter}
                  onChange={(e) => setPropertyFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                  <option value="All">All</option>
                  <option value="ATK 20">ATK 20 - VERANO AT MIRAMAR</option>
                  <option value="ATK 34">ATK 34 - VILLA BELLINI</option>
                  <option value="KT 4">KT 4 - SUNSET VILLAS COND</option>
                  <option value="RAS 1">RAS 1 - COURTSYARDS AT NAUTICA</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Unit Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UNIT
              </label>
              <div className="relative">
                <select
                  value={unitFilter}
                  onChange={(e) => setUnitFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                  <option value="All (2)">All (2)</option>
                  <option value="Unit 1">Unit 1</option>
                  <option value="Unit 2">Unit 2</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Period Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PERIOD
              </label>
              <div className="relative">
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                  <option value="Three months to date">Three months to date</option>
                  <option value="Last month">Last month</option>
                  <option value="Last quarter">Last quarter</option>
                  <option value="Year to date">Year to date</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button 
                onClick={handleSearch}
                className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {/* Basis Type Radio Buttons */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <input
                id="cash-basis"
                name="basis-type"
                type="radio"
                value="cash"
                checked={basisType === 'cash'}
                onChange={(e) => setBasisType(e.target.value)}
                className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <label htmlFor="cash-basis" className="ml-2 text-sm font-medium text-gray-700">
                Cash basis
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="accrual-basis"
                name="basis-type"
                type="radio"
                value="accrual"
                checked={basisType === 'accrual'}
                onChange={(e) => setBasisType(e.target.value)}
                className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <label htmlFor="accrual-basis" className="ml-2 text-sm font-medium text-gray-700">
                Accrual basis
              </label>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">4 matches</p>
          </div>
        </div>

        {/* Financial Data Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PROPERTY OR COMPANY ACCOUNT (CASH BASIS)
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    JUNE 2025
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    JULY 2025
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AUGUST 1 TO DATE
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TOTAL AS OF<br />8/25/2025
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {financialData.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                          + {row.property}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {row.june2025}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {row.july2025}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {row.august2025}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
>>>>>>> c4000e91ef9e66dfad67d379435355dc7c1a0112
          </div>
        </div>
      </div>
    </div>
  );
};

export default Financial;
