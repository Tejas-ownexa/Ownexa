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
    if (count === 0) return 'Select option';
    return `(${count}) ${selectedPrivacyOptions.map(opt => 
      opt.charAt(0).toUpperCase() + opt.slice(1)
    ).join(', ')}`;
  };

  // Modify the table structure based on active tab
  const renderTable = () => {
    return (
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="w-8 p-4">
                <input type="checkbox" className="rounded border-gray-300" />
              </th>
              <th className="text-left p-4">NAME</th>
              <th className="text-left p-4">PROPERTIES</th>
              {activeTab === 'Favorites' && (
                <th className="text-left p-4">PRIVATE</th>
              )}
              <th className="text-left p-4">CREATOR</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={activeTab === 'Favorites' ? "5" : "4"} className="p-4 text-center text-gray-500">
                We didn't find any groups. Maybe you don't have any or maybe you need to{' '}
                <button 
                  className="text-blue-500 hover:underline"
                  onClick={() => {
                    setActiveFilters([]);
                    setSearchText('');
                    setSelectedProperties('All properties');
                  }}
                >
                  clear your filters
                </button>.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={handleGoBack}
          className="inline-flex items-center text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Go back
        </button>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Property groups</h1>
          <span className="bg-gray-600 text-white text-sm px-3 py-1 rounded">
            Property groups
          </span>
        </div>
        <button 
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          onClick={() => navigate('/associations/property-groups/add')}
        >
          Add group
        </button>
      </div>

      {/* Add the modal */}
      <AddGroupModal 
        isOpen={isAddGroupModalOpen}
        onClose={() => setIsAddGroupModalOpen(false)}
      />

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-8">
          <button
            className={`pb-4 px-1 ${
              activeTab === 'Favorites'
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('Favorites')}
          >
            Favorites
          </button>
          <button
            className={`pb-4 px-1 ${
              activeTab === 'All groups'
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('All groups')}
          >
            All groups
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 mb-6">
        Every property group you've created or been given access to from other staff members.{' '}
        <span className="font-medium">Tips:</span> Add groups to your "favorites" to quickly run reports, choose recipients, and more!
      </p>

      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        {/* Search Bar Section */}
        <div className="flex gap-4 mb-6">
          <select
            className="border border-gray-300 rounded px-3 py-2 appearance-none bg-white pr-8 relative min-w-[200px]"
            value={selectedProperties}
            onChange={(e) => setSelectedProperties(e.target.value)}
          >
            <option>All properties</option>
          </select>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search for names or descriptions"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="relative">
            <button
              className="text-green-600 hover:text-green-700 px-3 py-2 flex items-center gap-2"
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            >
              Add filter option
              <ChevronDown className="h-4 w-4" />
            </button>
            
            {/* Filter Dropdown */}
            {isFilterDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <div className="py-1">
                  {filterOptions.map((option) => (
                    <button
                      key={option.id}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between"
                      onClick={() => handleAddFilter(option.id)}
                    >
                      {option.name}
                      {option.checked && (
                        <span className="text-green-500">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Filters Row */}
        {activeFilters.length > 0 && (
          <div className="bg-white rounded-lg border-l-4 border-green-500 flex flex-col">
            <div className="flex items-center gap-8 p-4">
              {/* Creator Filter */}
              {activeFilters.includes('creator') && (
                <div className="flex items-center gap-4">
                  <div className="uppercase text-gray-500 text-sm font-medium w-24">
                    CREATOR
                  </div>
                  <div className="relative">
                    <select
                      className="border border-gray-300 rounded px-3 py-2 pr-8 appearance-none bg-white min-w-[200px]"
                      value={creatorValue}
                      onChange={(e) => setCreatorValue(e.target.value)}
                    >
                      <option>ADRIANA COLMENARES</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Privacy Filter */}
              {activeFilters.includes('privacy') && (
                <div className="flex items-center gap-4">
                  <div className="uppercase text-gray-500 text-sm font-medium w-24">
                    PRIVACY
                  </div>
                  <div className="relative">
                    <button
                      className="border border-gray-300 rounded px-3 py-2 pr-8 bg-white min-w-[200px] text-left flex items-center justify-between"
                      onClick={() => setIsPrivacyDropdownOpen(!isPrivacyDropdownOpen)}
                    >
                      <span>{getPrivacyDisplayText()}</span>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </button>

                    {/* Privacy Options Dropdown */}
                    {isPrivacyDropdownOpen && (
                      <div className="absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50">
                        <div className="py-1">
                          {privacyOptions.map((option) => (
                            <button
                              key={option.id}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrivacyOptionToggle(option.id);
                              }}
                            >
                              {option.name}
                              {selectedPrivacyOptions.includes(option.id) && (
                                <span className="text-green-500">✓</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Apply Filter Button */}
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700">
                Apply filter
              </button>

              {/* Close Button */}
              <button 
                onClick={() => setActiveFilters([])}
                className="ml-auto text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="text-gray-500 mb-4">
        0 matches
      </div>

      {/* Table */}
      {renderTable()}

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <span>© 2003-2025 Powered by Buildium, a RealPage Company®. All rights reserved.</span>
        <div className="mt-2 space-x-4">
          <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
          <a href="#" className="text-blue-600 hover:underline">Security</a>
          <a href="#" className="text-blue-600 hover:underline">Terms of Use</a>
        </div>
      </div>
    </div>
  );
};

export default PropertyGroups;
