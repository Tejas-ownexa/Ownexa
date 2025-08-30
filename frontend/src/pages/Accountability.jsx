import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  DollarSign, 
  BookOpen, 
  CreditCard, 
  Plus, 
  Search, 
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
  Building
} from 'lucide-react';
import AccountabilityFinancials from './accountability/AccountabilityFinancials';
import GeneralLedger from './accountability/GeneralLedger';
import Banking from './accountability/Banking';
import axios from '../utils/axios';

const Accountability = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('financials');
  const [summaryData, setSummaryData] = useState({
    totalProperties: 0,
    activeAccounts: 0
  });
  const [loading, setLoading] = useState(true);

  const tabs = [
    {
      id: 'financials',
      label: 'Financials',
      icon: DollarSign,
      description: 'Track income, expenses, and financial performance'
    },
    {
      id: 'general-ledger',
      label: 'General Ledger',
      icon: BookOpen,
      description: 'Manage detailed accounting entries and transactions'
    },
    {
      id: 'banking',
      label: 'Banking',
      icon: CreditCard,
      description: 'Monitor bank accounts and transactions'
    }
  ];

  useEffect(() => {
    fetchSummaryData();
  }, []);

  const fetchSummaryData = async () => {
    try {
      setLoading(true);
      console.log('=== ACCOUNTABILITY DEBUG ===');
      console.log('User object:', user);
      console.log('User ID:', user?.id);
      console.log('Token in localStorage:', localStorage.getItem('token') ? 'Present' : 'Missing');
      console.log('Fetching summary data for user:', user?.id);
      
      let totalProperties = 0;
      let activeAccounts = 0;
      
      // Fetch user's properties
      try {
        const propertiesResponse = await axios.get('/api/properties');
        console.log('Properties response:', propertiesResponse.data);
        totalProperties = propertiesResponse.data.length;
      } catch (error) {
        console.error('Error fetching properties:', error);
        totalProperties = 0;
      }
      
      // Fetch active banking accounts
      try {
        console.log('Making banking API call...');
        const bankingResponse = await axios.get('/api/accountability/banking');
        console.log('Banking response status:', bankingResponse.status);
        console.log('Banking response data:', bankingResponse.data);
        activeAccounts = bankingResponse.data.filter(account => account.is_active).length;
        console.log('Active accounts count:', activeAccounts);
      } catch (error) {
        console.error('Error fetching banking accounts:', error);
        console.error('Error status:', error.response?.status);
        console.error('Error data:', error.response?.data);
        activeAccounts = 0;
      }
      
      console.log('Setting summary data:', { totalProperties, activeAccounts });
      setSummaryData({
        totalProperties,
        activeAccounts
      });
    } catch (error) {
      console.error('Error in fetchSummaryData:', error);
      setSummaryData({
        totalProperties: 0,
        activeAccounts: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'financials':
        return <AccountabilityFinancials />;
      case 'general-ledger':
        return <GeneralLedger />;
      case 'banking':
        return <Banking />;
      default:
        return <AccountabilityFinancials />;
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="text-lg">Please log in to access accountability features.</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Accountability</h1>
            <p className="text-gray-600 mt-2">
              Comprehensive financial tracking and accounting for your properties
            </p>
          </div>
                      <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Total Properties</div>
              <div className="text-2xl font-bold text-gray-900">
                {loading ? '...' : summaryData.totalProperties}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Active Accounts</div>
              <div className="text-2xl font-bold text-green-600">
                {loading ? '...' : summaryData.activeAccounts}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Description */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            {(() => {
              const activeTabData = tabs.find(tab => tab.id === activeTab);
              const Icon = activeTabData.icon;
              return (
                <>
                  <Icon className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-600">{activeTabData.description}</span>
                </>
              );
            })()}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Accountability;
