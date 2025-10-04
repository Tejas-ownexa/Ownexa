import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import api from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  Download, 
  MoreHorizontal, 
  ChevronUp,
  ChevronDown,
  Filter,
  Search,
  RefreshCw,
  DollarSign,
  Calendar,
  UserPlus
} from 'lucide-react';
import toast from 'react-hot-toast';

const RentRoll = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [leases, setLeases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rentroll');
  const [sortField, setSortField] = useState('lease');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRentals, setFilterRentals] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch rent roll data
  const fetchRentRoll = useCallback(async () => {
    try {
      const response = await api.get('/api/rentals/rent-roll');
      setLeases(response.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching rent roll:', error);
      toast.error('Failed to load rent roll data');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRentRoll();
  }, [fetchRentRoll]);

  // Export rent roll to CSV
  const handleExport = () => {
    const csvContent = [
      ['LEASE', 'STATUS', 'TYPE', 'NEXT PAYMENT', 'NEXT AMOUNT', 'MONTHLY RENT'],
      ...leases.map(lease => [
        lease.lease || '',
        lease.status || '',
        lease.type || '',
        lease.daysLeft || '',
        lease.rent || '',
        lease.monthlyRent || lease.rent || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rent_roll_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Rent roll exported successfully!');
  };

  // Filter and sort leases
  const filteredLeases = React.useMemo(() => {
    let filtered = leases;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(lease => 
        lease.lease?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lease.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lease.property_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lease.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply rental type filter (active/future/all)
    if (filterRentals !== 'all') {
      filtered = filtered.filter(lease => {
        const status = lease.status?.toLowerCase();
        if (filterRentals === 'active') {
          return status === 'active';
        } else if (filterRentals === 'future') {
          return status === 'future';
        }
        return true;
      });
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(lease => {
        const status = lease.status?.toLowerCase();
        if (filterStatus === 'active') {
          return status === 'active';
        } else if (filterStatus === 'future') {
          return status === 'future';
        } else if (filterStatus === 'expired') {
          return status === 'expired';
        }
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'lease':
          aValue = a.lease || '';
          bValue = b.lease || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'type':
          aValue = a.type || '';
          bValue = b.type || '';
          break;
        case 'daysLeft':
          aValue = parseInt(a.daysLeft) || 0;
          bValue = parseInt(b.daysLeft) || 0;
          break;
        case 'rent':
          aValue = parseFloat(a.rent?.replace(/[$,]/g, '')) || 0;
          bValue = parseFloat(b.rent?.replace(/[$,]/g, '')) || 0;
          break;
        default:
          aValue = a.lease || '';
          bValue = b.lease || '';
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? -1 : 1;
      }
    });

    return filtered;
  }, [leases, searchTerm, filterRentals, filterStatus, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500 dark:text-gray-300" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-300" /> : 
      <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-300" />;
  };

  const getDaysLeftBadge = (daysLeft) => {
    if (!daysLeft) return null;
    
    // Handle payment due statuses
    if (daysLeft === 'DUE TODAY') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">DUE TODAY</span>;
    } else if (daysLeft === 'DUE TOMORROW') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">DUE TOMORROW</span>;
    } else if (daysLeft.includes('DUE IN') && daysLeft.includes('DAYS')) {
      const days = parseInt(daysLeft.match(/\d+/)[0]);
      if (days <= 3) {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:text-yellow-200">{daysLeft}</span>;
      } else if (days <= 7) {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">{daysLeft}</span>;
      } else {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">{daysLeft}</span>;
      }
    }
    
    // Handle legacy lease expiration statuses
    else if (daysLeft === 'EXPIRED' || daysLeft === 'LEASE EXPIRED') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">LEASE EXPIRED</span>;
    } else if (daysLeft.includes('DAYS LEFT')) {
      const days = parseInt(daysLeft);
      if (days <= 30) {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:text-yellow-200">{daysLeft}</span>;
      } else {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">{daysLeft}</span>;
      }
    } else if (daysLeft.includes('DAYS')) {
      // Legacy format for backwards compatibility
      const days = parseInt(daysLeft);
      if (days <= 30) {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:text-yellow-200">{daysLeft}</span>;
      } else {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">{daysLeft}</span>;
      }
    }
    
    return <span className="text-sm text-gray-900 dark:text-white">{daysLeft}</span>;
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === '---') return '---';
    const num = parseFloat(amount.toString().replace(/[$,]/g, ''));
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(num);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rent roll</h1>
        
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-600">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('rentroll')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rentroll'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:border-gray-600'
            }`}
          >
            Rent roll
          </button>
          <button
            onClick={() => setActiveTab('liability')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'liability'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:border-gray-600'
            }`}
          >
            Liability management
          </button>
        </nav>
      </div>

      {activeTab === 'rentroll' && (
        <>
          {/* Filters */}
          <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <select 
                  value={filterRentals}
                  onChange={(e) => setFilterRentals(e.target.value)}
                  className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All rentals</option>
                  <option value="active">Active rentals</option>
                  <option value="future">Future rentals</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 dark:text-gray-300 pointer-events-none" />
              </div>
              
              <div className="relative">
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Leases</option>
                  <option value="future">Future Leases</option>
                  <option value="expired">Expired Leases</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 dark:text-gray-300 pointer-events-none" />
              </div>
              
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterRentals('all');
                  setFilterStatus('all');
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Filters
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {filteredLeases.length} of {leases.length} leases
                {(searchTerm || filterRentals !== 'all' || filterStatus !== 'all') && (
                  <span className="text-blue-600 dark:text-blue-400 font-medium"> (filtered)</span>
                )}
              </span>
              <button
                onClick={handleExport}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 dark:text-gray-300" />
            <input
              type="text"
              placeholder="Search leases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700"
                    onClick={() => handleSort('lease')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>LEASE</span>
                      {getSortIcon('lease')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>STATUS</span>
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>TYPE</span>
                      {getSortIcon('type')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700"
                    onClick={() => handleSort('daysLeft')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>NEXT PAYMENT</span>
                      {getSortIcon('daysLeft')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700"
                    onClick={() => handleSort('rent')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>RENT</span>
                      {getSortIcon('rent')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                {filteredLeases.length > 0 ? (
                  filteredLeases.map((lease, index) => (
                    <tr key={lease.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200 cursor-pointer">
                            {lease.lease || 'ATK 50 - THE ELSER II - ATK 50 | Daniela Herrera'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300">
                            {lease.leaseId || '00086342'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                          {lease.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {lease.type || 'Fixed w/rollover'}
                        <br />
                        <span className="text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300">
                          {lease.leaseDates || '10/31/2023 - 10/30/2024'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getDaysLeftBadge(lease.daysLeft)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        <div>
                          <div className="font-medium">
                            {formatCurrency(lease.rent)}
                            {lease.monthlyRent && lease.rent !== lease.monthlyRent && (
                              <span className="text-xs text-blue-600 dark:text-blue-400 ml-1">(Next)</span>
                            )}
                          </div>
                          {lease.monthlyRent && lease.rent !== lease.monthlyRent && (
                            <div className="text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300">
                              Monthly: {formatCurrency(lease.monthlyRent)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-gray-400 dark:text-gray-500 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-300">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300">
                      No leases found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'liability' && (
        <div className="space-y-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Liability Management</h3>
            <p className="text-gray-600 dark:text-gray-300">This section is under development.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentRoll;
