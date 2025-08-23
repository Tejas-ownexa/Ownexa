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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Financial;
