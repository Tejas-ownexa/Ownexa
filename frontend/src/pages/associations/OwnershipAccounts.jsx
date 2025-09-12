import React, { useState } from 'react';
import { ChevronDown, X, Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import UpdateRecurringChargesModal from '../../components/UpdateRecurringChargesModal';

const OwnershipAccounts = () => {
  const navigate = useNavigate();
  // Add missing state variables
  const [selectedAssociation, setSelectedAssociation] = useState('All associations');
  const [isAssociationDropdownOpen, setIsAssociationDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState(['active', 'future']);
  
  // Existing state variables
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [unitOwnerValue, setUnitOwnerValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [delinquencyStatus, setDelinquencyStatus] = useState('');
  const [isDelinquencyDropdownOpen, setIsDelinquencyDropdownOpen] = useState(false);

  // Add status options
  const statusOptions = [
    { id: 'active', name: 'Active' },
    { id: 'past', name: 'Past' },
    { id: 'future', name: 'Future' }
  ];

  // Add missing functions
  const handleManageGroups = () => {
    navigate('/associations/property-groups', {
      state: { from: '/associations/ownership-accounts' }
    });
  };

  const getStatusDisplayText = () => {
    const count = selectedStatuses.length;
    if (count === 0) return 'Select status';
    return `(${count}) ${selectedStatuses.map(status => 
      status.charAt(0).toUpperCase() + status.slice(1)
    ).join(', ')}`;
  };

  const handleStatusToggle = (statusId) => {
    setSelectedStatuses(prev => {
      if (prev.includes(statusId)) {
        return prev.filter(id => id !== statusId);
      } else {
        return [...prev, statusId];
      }
    });
  };

  const filterOptions = [
    { id: 'unit_owner', name: 'Unit or Owner' },
    { id: 'start_end', name: 'Start - End' },
    { id: 'delinquency', name: 'Delinquency Status' }
  ];

  const handleAddFilter = (filterId) => {
    if (selectedFilters.includes(filterId)) {
      // If filter exists, remove it
      handleRemoveFilter(filterId);
    } else {
      // If filter doesn't exist, add it
      setSelectedFilters([...selectedFilters, filterId]);
    }
    setIsFilterDropdownOpen(false);
  };

  const handleRemoveFilter = (filterId) => {
    setSelectedFilters(selectedFilters.filter(id => id !== filterId));
    if (filterId === 'unit_owner') setUnitOwnerValue('');
    if (filterId === 'start_end') {
      setStartDate('');
      setEndDate('');
    }
    if (filterId === 'delinquency') setDelinquencyStatus('');
  };

  const renderFilter = (filterId) => {
    switch (filterId) {
      case 'unit_owner':
        return (
          <div>
            <div className="uppercase text-gray-500 text-sm font-medium mb-2">
              UNIT OR OWNER
              <button 
                onClick={() => handleRemoveFilter('unit_owner')}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4 inline" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Enter unit or owner..."
              value={unitOwnerValue}
              onChange={(e) => setUnitOwnerValue(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-[200px]"
            />
          </div>
        );

      case 'start_end':
        return (
          <div>
            <div className="uppercase text-gray-500 text-sm font-medium mb-2">
              START - END
              <button 
                onClick={() => handleRemoveFilter('start_end')}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4 inline" />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2"
              />
            </div>
          </div>
        );

      case 'delinquency':
        return (
          <div>
            <div className="uppercase text-gray-500 text-sm font-medium mb-2">
              DELINQUENCY STATUS
              <button 
                onClick={() => handleRemoveFilter('delinquency')}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4 inline" />
              </button>
            </div>
            <div className="relative">
              <button
                className="border border-gray-300 rounded px-3 py-2 w-[200px] text-left flex items-center justify-between"
                onClick={() => setIsDelinquencyDropdownOpen(!isDelinquencyDropdownOpen)}
              >
                <span>{delinquencyStatus || 'Select statuses to include...'}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {isDelinquencyDropdownOpen && (
                <div className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <button 
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      onClick={() => {
                        setDelinquencyStatus('Current');
                        setIsDelinquencyDropdownOpen(false);
                      }}
                    >
                      Current
                    </button>
                    <button 
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      onClick={() => {
                        setDelinquencyStatus('Past Due');
                        setIsDelinquencyDropdownOpen(false);
                      }}
                    >
                      Past Due
                    </button>
                    <button 
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      onClick={() => {
                        setDelinquencyStatus('Collections');
                        setIsDelinquencyDropdownOpen(false);
                      }}
                    >
                      Collections
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleReceivePayment = () => {
    navigate('/associations/receive-payment');
  };

  const handleUpdateRecurringCharges = () => {
    setIsUpdateChargesModalOpen(true);
  };

  // Add this state
  const [isUpdateChargesModalOpen, setIsUpdateChargesModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Ownership Accounts</h1>
            <p className="text-gray-600">Manage ownership accounts and recurring charges</p>
          </div>
          <div className="flex gap-4">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Add Account
            </button>
            <button 
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={handleReceivePayment}
            >
              Receive Payment
            </button>
            <button 
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={handleUpdateRecurringCharges}
            >
              Update Recurring Charges
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex gap-4">
          {/* Associations Dropdown */}
          <div className="relative">
            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-w-[200px] justify-between"
              onClick={() => setIsAssociationDropdownOpen(!isAssociationDropdownOpen)}
            >
              <span>{selectedAssociation}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          
            {isAssociationDropdownOpen && (
              <div className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <div className="py-1">
                  <button 
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => {
                      setSelectedAssociation('All associations');
                      setIsAssociationDropdownOpen(false);
                    }}
                  >
                    All associations
                  </button>
                  <button 
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-blue-600"
                    onClick={() => {
                      setIsAssociationDropdownOpen(false);
                      handleManageGroups();
                    }}
                  >
                    Manage groups...
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-w-[200px] justify-between"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
            >
              <span>{getStatusDisplayText()}</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {isStatusDropdownOpen && (
              <div className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <div className="py-1">
                  {statusOptions.map((option) => (
                    <button
                      key={option.id}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                      onClick={() => handleStatusToggle(option.id)}
                    >
                      <span className={`mr-2 ${selectedStatuses.includes(option.id) ? 'text-blue-600' : 'text-gray-400'}`}>
                        {selectedStatuses.includes(option.id) ? '✓' : '○'}
                      </span>
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Add Filter Dropdown */}
          <div className="relative">
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-600 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            >
              Add Filter Option
              <ChevronDown className="ml-2 h-4 w-4" />
            </button>
            {isFilterDropdownOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <div className="py-1">
                  {filterOptions.map((option) => (
                    <button
                      key={option.id}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      onClick={() => handleAddFilter(option.id)}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {selectedFilters.length > 0 && (
        <div className="bg-white rounded-lg border-l-4 border-green-500 p-4 mb-4">
          <div className="flex items-end gap-4">
            {selectedFilters.map((filterId) => renderFilter(filterId))}
            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded h-[38px]">
              Apply filter
            </button>
          </div>
        </div>
      )}

      {/* Accounts Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACCOUNT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  START - END
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td colSpan="3" className="px-6 py-12 text-center">
                  <div className="text-gray-500">
                    <p className="text-lg font-medium mb-2">No accounts found</p>
                    <p className="text-sm">
                      We didn't find any accounts. Maybe you don't have any or maybe you need to{' '}
                      <button 
                        className="text-blue-600 hover:text-blue-800 font-medium"
                        onClick={() => {
                          setSelectedAssociation('All associations');
                          setSelectedStatuses(['active', 'future']);
                        }}
                      >
                        clear your filters
                      </button>.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add the modal */}
      <UpdateRecurringChargesModal 
        isOpen={isUpdateChargesModalOpen}
        onClose={() => setIsUpdateChargesModalOpen(false)}
      />
    </div>
  );
};

export default OwnershipAccounts;