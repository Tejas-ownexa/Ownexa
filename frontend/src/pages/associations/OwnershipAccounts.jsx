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
    { id: 'unit_owner', name: 'Unit or owner' },
    { id: 'start_end', name: 'Start - End' },
    { id: 'delinquency', name: 'Delinquency status' }
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
              placeholder="Unit or owner..."
              className="border border-gray-300 rounded px-3 py-2 w-[200px]"
              value={unitOwnerValue}
              onChange={(e) => setUnitOwnerValue(e.target.value)}
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
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="m/d/yyyy"
                  className="border border-gray-300 rounded px-3 py-2 w-[120px] pr-8"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </span>
              </div>
              <span className="text-gray-500">to</span>
              <div className="relative">
                <input
                  type="text"
                  placeholder="m/d/yyyy"
                  className="border border-gray-300 rounded px-3 py-2 w-[120px] pr-8"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </span>
              </div>
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
    <div className="p-6">
      {/* Update Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Go back
      </button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Ownership accounts</h1>
        <div className="flex gap-4">
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
            Add account
          </button>
          <button 
            className="border border-gray-300 px-4 py-2 rounded"
            onClick={handleReceivePayment}
          >
            Receive payment
          </button>
          <button 
            className="border border-gray-300 px-4 py-2 rounded"
            onClick={handleUpdateRecurringCharges}
          >
            Update recurring charges
          </button>
          <button className="border border-gray-300 px-4 py-2 rounded">
            •••
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        {/* Associations Dropdown */}
        <div className="relative">
          <button
            className="border border-gray-300 rounded px-3 py-2 flex items-center justify-between min-w-[200px]"
            onClick={() => setIsAssociationDropdownOpen(!isAssociationDropdownOpen)}
          >
            <span>{selectedAssociation}</span>
            <ChevronDown className="h-4 w-4 ml-2" />
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
            className="border border-gray-300 rounded px-3 py-2 flex items-center justify-between min-w-[200px]"
            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
          >
            <span>{getStatusDisplayText()}</span>
            <ChevronDown className="h-4 w-4 ml-2" />
          </button>

          {isStatusDropdownOpen && (
            <div className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <div className="py-1">
                {statusOptions.map((option) => (
                  <button
                    key={option.id}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between"
                    onClick={() => handleStatusToggle(option.id)}
                  >
                    <span>{option.name}</span>
                    {selectedStatuses.includes(option.id) && (
                      <span className="text-green-500">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add Filter Option Button */}
        <div className="relative">
          <button
            className="text-green-600 hover:text-green-700 px-3 py-2 flex items-center gap-2"
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
          >
            Add filter option
            <ChevronDown className="h-4 w-4" />
          </button>

          {isFilterDropdownOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <div className="py-1">
                {filterOptions.map((option) => (
                  <button
                    key={option.id}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between"
                    onClick={() => handleAddFilter(option.id)}
                  >
                    <span>{option.name}</span>
                    {selectedFilters.includes(option.id) && (
                      <span className="text-green-500">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
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

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">ACCOUNT</th>
              <th className="text-left p-4">STATUS</th>
              <th className="text-left p-4">START - END</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="3" className="p-4 text-center text-gray-500">
                We didn't find any accounts. Maybe you don't have any or maybe you need to{' '}
                <button 
                  className="text-blue-500 hover:underline"
                  onClick={() => {
                    setSelectedAssociation('All associations');
                    setSelectedStatuses(['active', 'future']);
                  }}
                >
                  clear your filters
                </button>.
              </td>
            </tr>
          </tbody>
        </table>
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



