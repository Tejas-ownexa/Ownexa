import React, { useState } from 'react';
import { ChevronDown, ArrowLeft, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import AddGroupModal from '../../components/AddGroupModal';

const PropertyGroups = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const previousPage = location.state?.from || '/associations';

  const handleGoBack = () => {
    navigate(previousPage);
  };

  const [activeTab, setActiveTab] = useState('All groups');
  const [selectedProperties, setSelectedProperties] = useState('KT 11 - CYPRESS H...');
  const [searchText, setSearchText] = useState('');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]); // Start with no filters active
  const [creatorValue, setCreatorValue] = useState('ADRIANA COLMENARES');
  const [privacyValue, setPrivacyValue] = useState('(2) Private, Public');
  const [isPrivacyDropdownOpen, setIsPrivacyDropdownOpen] = useState(false);
  const [selectedPrivacyOptions, setSelectedPrivacyOptions] = useState(['private', 'public']);
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);

  const filterOptions = [
    { id: 'creator', name: 'Creator', checked: activeFilters.includes('creator') },
    { id: 'privacy', name: 'Privacy', checked: activeFilters.includes('privacy') }
  ];

  const privacyOptions = [
    { id: 'private', name: 'Private' },
    { id: 'public', name: 'Public' }
  ];

  const handleAddFilter = (filterId) => {
    if (!activeFilters.includes(filterId)) {
      setActiveFilters([...activeFilters, filterId]);
    } else {
      // If already selected, remove it
      setActiveFilters(activeFilters.filter(f => f !== filterId));
    }
    setIsFilterDropdownOpen(false);
  };

  const handleRemoveFilter = (filterId) => {
    setActiveFilters(activeFilters.filter(f => f !== filterId));
  };

  const handlePrivacyOptionToggle = (optionId) => {
    setSelectedPrivacyOptions(prev => {
      if (prev.includes(optionId)) {
        return prev.filter(id => id !== optionId);
      } else {
        return [...prev, optionId];
      }
    });
  };

  const getPrivacyDisplayText = () => {
    const count = selectedPrivacyOptions.length;
    if (count === 0) return 'Select privacy...';
    return `(${count}) ${selectedPrivacyOptions.map(option => 
      option.charAt(0).toUpperCase() + option.slice(1)
    ).join(', ')}`;
  };

  const renderFilter = (filterId) => {
    switch (filterId) {
      case 'creator':
        return (
          <div>
            <div className="uppercase text-gray-500 text-sm font-medium mb-2">
              CREATOR
              <button 
                onClick={() => handleRemoveFilter('creator')}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4 inline" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Enter creator..."
              value={creatorValue}
              onChange={(e) => setCreatorValue(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-[200px]"
            />
          </div>
        );

      case 'privacy':
        return (
          <div>
            <div className="uppercase text-gray-500 text-sm font-medium mb-2">
              PRIVACY
              <button 
                onClick={() => handleRemoveFilter('privacy')}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4 inline" />
              </button>
            </div>
            <div className="relative">
              <button
                className="border border-gray-300 rounded px-3 py-2 w-[200px] text-left flex items-center justify-between"
                onClick={() => setIsPrivacyDropdownOpen(!isPrivacyDropdownOpen)}
              >
                <span>{getPrivacyDisplayText()}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {isPrivacyDropdownOpen && (
                <div className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="py-1">
                    {privacyOptions.map((option) => (
                      <button
                        key={option.id}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                        onClick={() => handlePrivacyOptionToggle(option.id)}
                      >
                        <span className={`mr-2 ${selectedPrivacyOptions.includes(option.id) ? 'text-blue-600' : 'text-gray-400'}`}>
                          {selectedPrivacyOptions.includes(option.id) ? '✓' : '○'}
                        </span>
                        {option.name}
                      </button>
                    ))}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Property Groups</h1>
            <p className="text-gray-600">Manage and organize your property groups</p>
          </div>
          <button 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => setIsAddGroupModalOpen(true)}
          >
            Add group
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {['All groups', 'My groups'].map((tab) => (
              <button
                key={tab}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search groups..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-600 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            >
              Add Filter Option
              <ChevronDown className="ml-2 h-4 w-4" />
            </button>
            {isFilterDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
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
      {activeFilters.length > 0 && (
        <div className="bg-white rounded-lg border-l-4 border-green-500 p-4">
          <div className="flex items-end gap-4">
            {activeFilters.map((filterId) => renderFilter(filterId))}
            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded h-[38px]">
              Apply filter
            </button>
          </div>
        </div>
      )}

      {/* Groups Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GROUP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CREATOR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PRIVACY
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PROPERTIES
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center">
                  <div className="text-gray-500">
                    <p className="text-lg font-medium mb-2">No groups found</p>
                    <p className="text-sm">
                      We didn't find any groups. Maybe you don't have any or maybe you need to{' '}
                      <button 
                        className="text-blue-600 hover:text-blue-800 font-medium"
                        onClick={() => {
                          setActiveFilters([]);
                          setSearchText('');
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

      {/* Add Group Modal */}
      <AddGroupModal 
        isOpen={isAddGroupModalOpen}
        onClose={() => setIsAddGroupModalOpen(false)}
      />
    </div>
  );
};

export default PropertyGroups;