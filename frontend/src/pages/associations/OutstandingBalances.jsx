import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OutstandingBalances = () => {
  const navigate = useNavigate();
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [filterValues, setFilterValues] = useState({
    account: '',
    past_due_email: '',
    balance: '',
    delinquency_status: ''
  });

  const [selectedAssociation, setSelectedAssociation] = useState('All associations');
  const [isAssociationDropdownOpen, setIsAssociationDropdownOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState(['future', 'active', 'past']);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);

  // Add associations data
  const associations = [
    { id: 'kt11', name: 'KT 11 - CYPRESS H...' },
    { id: 'kt12', name: 'KT 12 - MAPLE GROVE' },
    { id: 'kt13', name: 'KT 13 - OAKWOOD COMMONS' }
  ];

  const filterOptions = [
    { id: 'account', label: 'Account' },
    { id: 'past_due_email', label: 'Past due email' },
    { id: 'balance', label: 'Balance' },
    { id: 'delinquency_status', label: 'Delinquency status' }
  ];

  const statusOptions = [
    { id: 'future', label: 'Future' },
    { id: 'active', label: 'Active' },
    { id: 'past', label: 'Past' }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusDisplayText = () => {
    if (selectedStatuses.length === statusOptions.length) {
      return `(${selectedStatuses.length}) Future, Active, Past`;
    }
    return `(${selectedStatuses.length}) ${selectedStatuses
      .map(id => statusOptions.find(opt => opt.id === id)?.label)
      .filter(Boolean)
      .join(', ')}`;
  };

  const handleStatusToggle = (statusId) => {
    setSelectedStatuses(prev => {
      if (prev.includes(statusId)) {
        return prev.filter(id => id !== statusId);
      }
      return [...prev, statusId];
    });
  };

  const handleAddFilter = (filterId) => {
    if (activeFilters.includes(filterId)) {
      handleRemoveFilter(filterId);
    } else {
      setActiveFilters([...activeFilters, filterId]);
    }
  };

  const handleRemoveFilter = (filterId) => {
    setActiveFilters(activeFilters.filter(id => id !== filterId));
    setFilterValues({ ...filterValues, [filterId]: '' });
    setIsFilterDropdownOpen(false);
  };

  const handleFilterValueChange = (filterId, value) => {
    setFilterValues({ ...filterValues, [filterId]: value });
  };

  const handleApplyFilter = () => {
    console.log('Applying filters:', filterValues);
  };

  const handleManageGroups = () => {
    navigate('/associations/property-groups', {
      state: { from: '/associations/outstanding-balances' }
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Outstanding account balances</h1>


      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="grid grid-cols-5 gap-4">
            {activeFilters.map(filterId => {
              const option = filterOptions.find(opt => opt.id === filterId);
              return (
                <div key={filterId} className="relative">
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                    {option.label.toUpperCase()}
                    <button
                      onClick={() => handleRemoveFilter(filterId)}
                      className="ml-2 text-gray-400 dark:text-gray-500 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-300"
                    >
                      <X className="h-4 w-4 inline" />
                    </button>
                  </label>
                  {filterId === 'delinquency_status' ? (
                    <select
                      className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2"
                      value={filterValues[filterId]}
                      onChange={(e) => handleFilterValueChange(filterId, e.target.value)}
                    >
                      <option value="">Select statuses to include...</option>
                      <option value="delinquent">Delinquent</option>
                      <option value="current">Current</option>
                    </select>
                  ) : filterId === 'past_due_email' ? (
                    <select
                      className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2"
                      value={filterValues[filterId]}
                      onChange={(e) => handleFilterValueChange(filterId, e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="sent">Sent</option>
                      <option value="not_sent">Not Sent</option>
                    </select>
                  ) : filterId === 'balance' ? (
                    <select
                      className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2"
                      value={filterValues[filterId]}
                      onChange={(e) => handleFilterValueChange(filterId, e.target.value)}
                    >
                      <option value="">Total balance</option>
                      <option value="positive">Positive</option>
                      <option value="negative">Negative</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2"
                      placeholder={`${option.label} contains...`}
                      value={filterValues[filterId]}
                      onChange={(e) => handleFilterValueChange(filterId, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
            <div className="flex items-end">
              <button
                onClick={handleApplyFilter}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Apply filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Structure */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="flex justify-between items-center px-4 py-2 border-b">
          <span className="text-gray-600 dark:text-gray-300">0 matches</span>
          <button className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:text-gray-200">Export</button>
        </div>
        
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="w-8 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600" />
              </th>
              <th className="w-8 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">+</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                ACCOUNT
                <button className="ml-1 text-gray-400 dark:text-gray-500 dark:text-gray-300">▲</button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">PAST DUE EMAIL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">0 - 30 DAYS</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">31 - 60 DAYS</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">61 - 90 DAYS</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">90+ DAYS</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">BALANCE</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
            <tr>
              <td colSpan="9" className="px-6 py-12 text-center text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300">
                We didn't find any ownership accounts with outstanding balances. Maybe you don't have any or maybe you need to{' '}
                <button 
                  onClick={() => {
                    setActiveFilters([]);
                    setFilterValues({
                      account: '',
                      past_due_email: '',
                      balance: '',
                      delinquency_status: ''
                    });
                    setSelectedStatuses(['future', 'active', 'past']);
                    setSelectedAssociation('All associations');
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 underline"
                >
                  clear your filters
                </button>
                .
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OutstandingBalances;
