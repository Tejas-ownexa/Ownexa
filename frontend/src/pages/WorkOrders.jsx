import React, { useState } from 'react';
import { ChevronDown, Download, HelpCircle, ChevronUp } from 'lucide-react';

// Multi-select dropdown component with checkboxes
const MultiSelectDropdown = ({ label, options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const getDisplayText = () => {
    if (value.length === 0) return placeholder;
    if (value.length === options.length) return `(${value.length}) New, In progress, Comple...`;
    return `(${value.length}) ${options.filter(opt => value.includes(opt.value)).map(opt => opt.label).join(', ')}`;
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.multi-select-dropdown')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative multi-select-dropdown">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full text-left"
      >
        {getDisplayText()}
      </button>
      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="p-2">
            {options.map((option) => (
              <label key={option.value} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                <div className={`flex items-center justify-center w-5 h-5 rounded ${
                  value.includes(option.value) ? 'bg-green-600' : 'bg-gray-200'
                }`}>
                  {value.includes(option.value) && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-gray-700">{option.label}</span>
                <input
                  type="checkbox"
                  checked={value.includes(option.value)}
                  onChange={() => handleToggle(option.value)}
                  className="sr-only"
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const WorkOrders = () => {
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [selectedStatuses, setSelectedStatuses] = useState(['new', 'in-progress', 'completed', 'deferred', 'closed']);
  const [filterOption, setFilterOption] = useState('');
  const [sortBy, setSortBy] = useState('updated');
  const [sortOrder, setSortOrder] = useState('desc');

  // Status options for multi-select dropdown
  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'in-progress', label: 'In progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'deferred', label: 'Deferred' },
    { value: 'closed', label: 'Closed' }
  ];

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export work orders');
  };

  const handleClearFilters = () => {
    setSelectedProperty('all');
    setSelectedStatuses(['new', 'in-progress', 'completed', 'deferred', 'closed']);
    setFilterOption('');
  };

  const handleAddWorkOrder = () => {
    // TODO: Navigate to add work order page
    console.log('Add work order');
  };

  const handlePrintWorkOrders = () => {
    // TODO: Implement print functionality
    console.log('Print work orders');
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Work orders</h1>
            <HelpCircle className="h-5 w-5 text-blue-500 cursor-pointer" title="Help" />
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button 
              onClick={handleAddWorkOrder}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Add work order
            </button>
            <button 
              onClick={handlePrintWorkOrders}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Print work orders
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Results */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        {/* Filter Section */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative">
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All properties</option>
              <option value="property1">123 Main St</option>
              <option value="property2">456 Oak Ave</option>
              <option value="property3">789 Pine Rd</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          <MultiSelectDropdown
            options={statusOptions}
            value={selectedStatuses}
            onChange={setSelectedStatuses}
            placeholder="Select statuses"
          />

          <div className="relative">
            <select
              value={filterOption}
              onChange={(e) => setFilterOption(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Add filter option</option>
              <option value="high-priority">High Priority</option>
              <option value="overdue">Overdue</option>
              <option value="unassigned">Unassigned</option>
              <option value="this-week">This Week</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Results Count and Export */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-2 sm:space-y-0">
          <div className="text-sm text-gray-600">
            0 matches
          </div>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  WORK ORDER
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  UNIT
                </th>
                <th 
                  className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('updated')}
                >
                  <div className="flex items-center space-x-1">
                    <span>UPDATED</span>
                    {getSortIcon('updated')}
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AGE
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DUE
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ASSIGNED TO
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PRIORITY
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  VENDOR
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BILL TOTAL
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BILL STATUS
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Empty state */}
              <tr>
                <td colSpan="11" className="text-center py-12 text-gray-500">
                  <div className="space-y-2">
                    <p>We didn't find any work orders. Maybe you don't have any or maybe you need to{' '}
                      <button 
                        onClick={handleClearFilters}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        clear your filters
                      </button>
                      .
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WorkOrders;
