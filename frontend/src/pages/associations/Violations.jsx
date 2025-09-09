import React, { useState } from 'react';
import { ChevronDown, Check, X, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Violations = () => {
  const navigate = useNavigate();
  const [selectedAssociation, setSelectedAssociation] = useState('All associations');
  const [isAssociationDropdownOpen, setIsAssociationDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [filterValues, setFilterValues] = useState({
    address_unit_owner: '',
    date_created: {
      start: '',
      end: ''
    },
    stages: '(4) Draft, Unresolved, Resolv...'
  });

  const filterOptions = [
    { id: 'address_unit_owner', label: 'Address, unit or owner' },
    { id: 'date_created', label: 'Date created' },
    { id: 'stages', label: 'Stages' }
  ];

  const handleAddFilter = (filterId) => {
    if (activeFilters.includes(filterId)) {
      handleRemoveFilter(filterId);
    } else {
      setActiveFilters([...activeFilters, filterId]);
    }
  };

  const handleRemoveFilter = (filterId) => {
    setActiveFilters(activeFilters.filter(id => id !== filterId));
    setFilterValues({
      ...filterValues,
      [filterId]: filterId === 'date_created' ? { start: '', end: '' } : ''
    });
    setIsFilterDropdownOpen(false);
  };

  const handleFilterValueChange = (filterId, value, dateType) => {
    if (filterId === 'date_created') {
      setFilterValues({
        ...filterValues,
        date_created: {
          ...filterValues.date_created,
          [dateType]: value
        }
      });
    } else {
      setFilterValues({ ...filterValues, [filterId]: value });
    }
  };

  const handleLogViolation = () => {
    // Add your log violation logic here
    console.log('Log violation clicked');
  };

  const handleManageGroups = () => {
    navigate('/associations/property-groups', {
      state: { from: '/associations/violations' }
    });
  };

  return (
    <div className="p-6">
      {/* Header with title and button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">All violations</h1>
        <button
          onClick={handleLogViolation}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Log violation
        </button>
      </div>

      {/* Filters Row */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          {/* Associations Dropdown */}
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
                  onClick={handleManageGroups}
                >
                  Manage groups...
                </div>
              </div>
            )}
          </div>

          {/* Keep existing filter dropdown */}
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

        {/* Keep existing active filters section */}
        {activeFilters.length > 0 && (
          <div className="mb-6 bg-white rounded-lg border p-4">
            <div className="grid grid-cols-4 gap-4">
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
                    {filterId === 'date_created' ? (
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="m/d/yyyy"
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            value={filterValues.date_created.start}
                            onChange={(e) => handleFilterValueChange(filterId, e.target.value, 'start')}
                          />
                          <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                        <span>to</span>
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="m/d/yyyy"
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            value={filterValues.date_created.end}
                            onChange={(e) => handleFilterValueChange(filterId, e.target.value, 'end')}
                          />
                          <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    ) : filterId === 'stages' ? (
                      <select
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        value={filterValues[filterId]}
                        onChange={(e) => handleFilterValueChange(filterId, e.target.value)}
                      >
                        <option value="(4) Draft, Unresolved, Resolv...">(4) Draft, Unresolved, Resolved...</option>
                        <option value="draft">Draft</option>
                        <option value="unresolved">Unresolved</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        placeholder="Address, unit or owner"
                        value={filterValues[filterId]}
                        onChange={(e) => handleFilterValueChange(filterId, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
              <div className="flex items-end">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Apply filter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table Structure */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex justify-between items-center px-4 py-2 border-b">
          <span className="text-gray-600">0 matches</span>
          <button className="text-gray-600 hover:text-gray-800">Export</button>
        </div>
        
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">TYPE</th>
              <th className="text-left p-4">
                CATEGORY
                <button className="ml-1 text-gray-400">▲</button>
              </th>
              <th className="text-left p-4">ADDRESS</th>
              <th className="text-left p-4">OWNERS</th>
              <th className="text-left p-4">ASSOCIATION</th>
              <th className="text-left p-4">UNIT</th>
              <th className="text-left p-4">STAGE</th>
              <th className="text-left p-4">DEADLINE</th>
              <th className="text-left p-4">VIOLATION DATE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="9" className="p-4 text-center text-gray-600">
                We didn't find any violations. Maybe you don't have any or maybe you need to{' '}
                <button 
                  onClick={() => {
                    setActiveFilters([]);
                    setFilterValues({
                      address_unit_owner: '',
                      date_created: { start: '', end: '' },
                      stages: ''
                    });
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

export default Violations;
