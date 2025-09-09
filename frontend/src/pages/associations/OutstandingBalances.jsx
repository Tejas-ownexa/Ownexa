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

      {/* Dropdowns Row */}
      <div className="flex gap-4 mb-6">
        {/* Updated Associations Dropdown */}
        <div className="relative inline-block">
          <button
            className="border border-gray-300 rounded px-4 py-2 flex items-center gap-2 bg-white min-w-[200px]"
            onClick={() => setIsAssociationDropdownOpen(!isAssociationDropdownOpen)}
          >
            <span>{selectedAssociation}</span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
          {isAssociationDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <div
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSelectedAssociation('All associations');
                  setIsAssociationDropdownOpen(false);
                }}
              >
                All associations
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-blue-600 hover:text-blue-700"
                onClick={() => {
                  handleManageGroups();
                  setIsAssociationDropdownOpen(false);
                }}
              >
                Manage groups...
              </div>
            </div>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="relative inline-block" ref={statusDropdownRef}>
          <button
            className="border border-gray-300 rounded px-4 py-2 flex items-center gap-2 bg-white min-w-[200px]"
            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
          >
            <span>{getStatusDisplayText()}</span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
          {isStatusDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              {statusOptions.map(option => (
                <div
                  key={option.id}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleStatusToggle(option.id)}
                >
                  <div className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center bg-white">
                    {selectedStatuses.includes(option.id) && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filter Dropdown */}
        <div className="relative inline-block">
          <button
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            className="border border-gray-300 rounded px-4 py-2 flex items-center gap-2 bg-white text-green-600 hover:text-green-700"
          >
            <span>Add filter option</span>
            <ChevronDown className="h-4 w-4" />
          </button>
          {isFilterDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              {filterOptions.map(option => (
                <div
                  key={option.id}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleAddFilter(option.id)}
                >
                  <div className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center bg-white">
                    {activeFilters.includes(option.id) && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="mb-6 bg-white rounded-lg border p-4">
          <div className="grid grid-cols-5 gap-4">
            {activeFilters.map(filterId => {
              const option = filterOptions.find(opt => opt.id === filterId);
              return (
                <div key={filterId} className="relative">
                  <label className="block text-sm text-gray-600 mb-1">
                    {option.label.toUpperCase()}
                    <button
                      onClick={() => handleRemoveFilter(filterId)}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4 inline" />
                    </button>
                  </label>
                  {filterId === 'delinquency_status' ? (
                    <select
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      value={filterValues[filterId]}
                      onChange={(e) => handleFilterValueChange(filterId, e.target.value)}
                    >
                      <option value="">Select statuses to include...</option>
                      <option value="delinquent">Delinquent</option>
                      <option value="current">Current</option>
                    </select>
                  ) : filterId === 'past_due_email' ? (
                    <select
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      value={filterValues[filterId]}
                      onChange={(e) => handleFilterValueChange(filterId, e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="sent">Sent</option>
                      <option value="not_sent">Not Sent</option>
                    </select>
                  ) : filterId === 'balance' ? (
                    <select
                      className="w-full border border-gray-300 rounded px-3 py-2"
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
                      className="w-full border border-gray-300 rounded px-3 py-2"
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
      <div className="bg-white rounded-lg shadow">
        <div className="flex justify-between items-center px-4 py-2 border-b">
          <span className="text-gray-600">0 matches</span>
          <button className="text-gray-600 hover:text-gray-800">Export</button>
        </div>
        
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="w-8 p-4">
                <input type="checkbox" className="rounded border-gray-300" />
              </th>
              <th className="w-8 p-4">+</th>
              <th className="text-left p-4">
                ACCOUNT
                <button className="ml-1 text-gray-400">▲</button>
              </th>
              <th className="text-left p-4">PAST DUE EMAIL</th>
              <th className="text-left p-4">0 - 30 DAYS</th>
              <th className="text-left p-4">31 - 60 DAYS</th>
              <th className="text-left p-4">61 - 90 DAYS</th>
              <th className="text-left p-4">90+ DAYS</th>
              <th className="text-left p-4">BALANCE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="9" className="p-4 text-center text-gray-600">
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
                  className="text-blue-600 hover:text-blue-700 underline"
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
