import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, MoreHorizontal } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ComposeEmailModal from '../../components/ComposeEmailModal';

const OwnersAndTenants = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const previousPage = location.state?.from || '/associations';
  const { logout } = useAuth();
  const statusDropdownRef = useRef(null);
  const typeDropdownRef = useRef(null);
  const [selectedAssociation, setSelectedAssociation] = useState('All associations');
  const [isAssociationDropdownOpen, setIsAssociationDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef(null);
  const [selectedStatuses, setSelectedStatuses] = useState(['future', 'active', 'former']);
  const [selectedTypes, setSelectedTypes] = useState(['owners', 'tenants', 'residents']);
  const [activeFilters, setActiveFilters] = useState([]);
  const [filterValues, setFilterValues] = useState({
    name: '',
    unit_number: '',
    phone: '',
    email: '',
    delinquency_status: ''
  });
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const statusOptions = [
    { id: 'future', label: 'Future' },
    { id: 'active', label: 'Active' },
    { id: 'former', label: 'Former' }
  ];

  const typeOptions = [
    { id: 'owners', label: 'Owners' },
    { id: 'tenants', label: 'Tenants' },
    { id: 'residents', label: 'Residents' }
  ];

  const filterOptions = [
    { id: 'name', label: 'Name' },
    { id: 'unit_number', label: 'Unit number' },
    { id: 'phone', label: 'Phone' },
    { id: 'email', label: 'Email' },
    { id: 'delinquency_status', label: 'Delinquency status' }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
        setIsTypeDropdownOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setIsMoreMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddOwner = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleAddTenant = () => {
    navigate('/associations/add-tenant');
  };

  const handleReceivePayment = () => {
    navigate('/associations/receive-payment');
  };

  const handleStatusToggle = (statusId) => {
    setSelectedStatuses(prev => {
      if (prev.includes(statusId)) {
        return prev.filter(id => id !== statusId);
      }
      return [...prev, statusId];
    });
  };

  const handleTypeToggle = (typeId) => {
    setSelectedTypes(prev => {
      if (prev.includes(typeId)) {
        return prev.filter(id => id !== typeId);
      }
      return [...prev, typeId];
    });
  };

  const getStatusDisplayText = () => {
    if (selectedStatuses.length === statusOptions.length) {
      return `(${selectedStatuses.length}) Future, Active, Former`;
    }
    return `(${selectedStatuses.length}) ${selectedStatuses
      .map(id => statusOptions.find(opt => opt.id === id)?.label)
      .filter(Boolean)
      .join(', ')}`;
  };

  const getTypeDisplayText = () => {
    if (selectedTypes.length === typeOptions.length) {
      return `(${selectedTypes.length}) Owners, Tenants, Residents`;
    }
    return `(${selectedTypes.length}) ${selectedTypes
      .map(id => typeOptions.find(opt => opt.id === id)?.label)
      .filter(Boolean)
      .join(', ')}`;
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
      state: { from: '/associations/owners-tenants' }
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Association owners and tenants</h1>
        <div className="flex gap-4 items-center">
          <button
            onClick={handleAddOwner}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Add owner
          </button>
          <button
            onClick={handleAddTenant}
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900"
          >
            Add tenant
          </button>
          <button
            onClick={handleReceivePayment}
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900"
          >
            Receive payment
          </button>
          
          {/* More Options Menu */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 h-[40px] w-[40px] flex items-center justify-center"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>

            {isMoreMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50">
                <div 
                  className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 cursor-pointer"
                  onClick={() => {
                    setIsEmailModalOpen(true);
                    setIsMoreMenuOpen(false);
                  }}
                >
                  Compose email
                </div>
                <div 
                  className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 cursor-pointer"
                  onClick={() => {
                    // Handle resident center users
                    setIsMoreMenuOpen(false);
                  }}
                >
                  Resident Center users
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        {/* Updated Associations Dropdown */}
        <div className="relative inline-block">
          <button
            className="border border-gray-300 dark:border-gray-600 rounded px-4 py-2 flex items-center gap-2 bg-white dark:bg-gray-800 min-w-[200px]"
            onClick={() => setIsAssociationDropdownOpen(!isAssociationDropdownOpen)}
          >
            <span>{selectedAssociation}</span>
            <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300" />
          </button>
          {isAssociationDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50">
              <div
                className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 cursor-pointer"
                onClick={() => {
                  setSelectedAssociation('All associations');
                  setIsAssociationDropdownOpen(false);
                }}
              >
                All associations
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-700"
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

        <div className="relative inline-block" ref={typeDropdownRef}>
          <button
            className="border border-gray-300 dark:border-gray-600 rounded px-4 py-2 flex items-center gap-2 bg-white dark:bg-gray-800 min-w-[200px]"
            onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
          >
            <span>{getTypeDisplayText()}</span>
            <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300" />
          </button>
          {isTypeDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50">
              {typeOptions.map(option => (
                <div
                  key={option.id}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 cursor-pointer"
                  onClick={() => handleTypeToggle(option.id)}
                >
                  <div className="w-6 h-6 border border-gray-300 dark:border-gray-600 rounded flex items-center justify-center bg-white dark:bg-gray-800">
                    {selectedTypes.includes(option.id) && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative inline-block" ref={statusDropdownRef}>
          <button
            className="border border-gray-300 dark:border-gray-600 rounded px-4 py-2 flex items-center gap-2 bg-white dark:bg-gray-800 min-w-[200px]"
            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
          >
            <span>{getStatusDisplayText()}</span>
            <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300" />
          </button>
          {isStatusDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50">
              {statusOptions.map(option => (
                <div
                  key={option.id}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 cursor-pointer"
                  onClick={() => handleStatusToggle(option.id)}
                >
                  <div className="w-6 h-6 border border-gray-300 dark:border-gray-600 rounded flex items-center justify-center bg-white dark:bg-gray-800">
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

        <div className="relative inline-block">
          <button
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            className="border border-gray-300 dark:border-gray-600 rounded px-4 py-2 flex items-center gap-2 bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 hover:text-green-700"
          >
            <span>Add filter option</span>
            <ChevronDown className="h-4 w-4" />
          </button>
          {isFilterDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50">
              {filterOptions.map(option => (
                <div
                  key={option.id}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 cursor-pointer"
                  onClick={() => handleAddFilter(option.id)}
                >
                  <div className="w-6 h-6 border border-gray-300 dark:border-gray-600 rounded flex items-center justify-center bg-white dark:bg-gray-800">
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
                  ) : (
                    <input
                      type={filterId === 'email' ? 'email' : 'text'}
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

      {/* Add Table Structure */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="flex justify-between items-center px-4 py-2 border-b">
          <span className="text-gray-600 dark:text-gray-300">0 matches</span>
          <button className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:text-gray-200">Export</button>
        </div>
        
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">FIRST NAME</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                LAST NAME
                <button className="ml-1 text-gray-400 dark:text-gray-500 dark:text-gray-300">▲</button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">UNIT NUMBER</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">PHONE</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">EMAIL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">RESIDENT CENTER STATUS</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
            <tr>
              <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300">
                We didn't find any association owners or tenants. Maybe you don't have any or maybe you need to{' '}
                <button 
                  onClick={() => {
                    setActiveFilters([]);
                    setFilterValues({
                      name: '',
                      unit_number: '',
                      phone: '',
                      email: '',
                      delinquency_status: ''
                    });
                    setSelectedStatuses(['future', 'active', 'former']);
                    setSelectedTypes(['owners', 'tenants', 'residents']);
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

      <ComposeEmailModal 
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />
    </div>
  );
};

export default OwnersAndTenants;



