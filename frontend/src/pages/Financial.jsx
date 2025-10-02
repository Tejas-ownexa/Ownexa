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
          <Loader className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading financial data...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Financials</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Financial performance analytics and insights</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {kpiData.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{kpi.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{kpi.value}</p>
                    <div className={`flex items-center mt-2 text-sm ${
                      kpi.color === 'green' ? 'text-green-600 dark:text-green-400' : 
                      kpi.color === 'red' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'
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
                    kpi.color === 'green' ? 'bg-green-100 dark:bg-green-900/30' :
                    kpi.color === 'red' ? 'bg-red-100 dark:bg-red-900/30' :
                    kpi.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <Icon className={`h-6 w-6 ${
                      kpi.color === 'green' ? 'text-green-600 dark:text-green-400' :
                      kpi.color === 'red' ? 'text-red-600 dark:text-red-400' :
                      kpi.color === 'blue' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue & Expense Trend</h3>
              <BarChart3 className="h-5 w-5 text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300" />
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Expense Breakdown</h3>
              <PieChart className="h-5 w-5 text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300" />
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Property Performance</h3>
            <Building2 className="h-5 w-5 text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300" />
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Property or Company Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                PROPERTY OR COMPANY
              </label>
              <div className="relative">
                <select
                  value={propertyFilter}
                  onChange={(e) => setPropertyFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                  <option value="All">All</option>
                  <option value="ATK 20">ATK 20 - VERANO AT MIRAMAR</option>
                  <option value="ATK 34">ATK 34 - VILLA BELLINI</option>
                  <option value="KT 4">KT 4 - SUNSET VILLAS COND</option>
                  <option value="RAS 1">RAS 1 - COURTSYARDS AT NAUTICA</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 pointer-events-none" />
              </div>
            </div>

            {/* Unit Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                UNIT
              </label>
              <div className="relative">
                <select
                  value={unitFilter}
                  onChange={(e) => setUnitFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                  <option value="All (2)">All (2)</option>
                  <option value="Unit 1">Unit 1</option>
                  <option value="Unit 2">Unit 2</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 pointer-events-none" />
              </div>
            </div>

            {/* Period Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                PERIOD
              </label>
              <div className="relative">
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                  <option value="Three months to date">Three months to date</option>
                  <option value="Last month">Last month</option>
                  <option value="Last quarter">Last quarter</option>
                  <option value="Year to date">Year to date</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 pointer-events-none" />
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
                className="h-4 w-4 text-green-600 dark:text-green-400 border-gray-300 dark:border-gray-600 focus:ring-green-500"
              />
              <label htmlFor="cash-basis" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
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
                className="h-4 w-4 text-green-600 dark:text-green-400 border-gray-300 dark:border-gray-600 focus:ring-green-500"
              />
              <label htmlFor="accrual-basis" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Accrual basis
              </label>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-300">4 matches</p>
          </div>
        </div>

        {/* Financial Data Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    PROPERTY OR COMPANY ACCOUNT (CASH BASIS)
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    JUNE 2025
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    JULY 2025
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    AUGUST 1 TO DATE
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    TOTAL AS OF<br />8/25/2025
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                {financialData.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200 cursor-pointer">
                          + {row.property}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                      {row.june2025}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                      {row.july2025}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                      {row.august2025}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                      {row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Financial;
