import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus,
  ClipboardList,
  FileText,
  Building,
  Users,
  Edit,
  RefreshCw,
  Home,
  Download,
  MoreHorizontal,
  UserPlus,
  UsersIcon,
  Printer,
  CheckSquare,
  FileEdit,
  DollarSign,
  Filter,
  Search,
  Calendar,
  ChevronDown,
  X,
  Check
} from 'lucide-react';

// Custom Multi-Select Dropdown Component
const MultiSelectDropdown = ({ label, options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionClick = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const getDisplayText = () => {
    if (value.length === 0) return placeholder || 'Select options...';
    if (value.length === 1) {
      const option = options.find(opt => opt.value === value[0]);
      return option ? option.label : value[0];
    }
    return `${value.length} selected`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-left focus:ring-2 focus:ring-blue-500 focus:border-transparent flex justify-between items-center"
      >
        <span className={value.length === 0 ? 'text-gray-500' : 'text-gray-900'}>
          {getDisplayText()}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {value.length > 0 && (
            <div className="p-2 border-b border-gray-200">
              <button
                onClick={() => onChange([])}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Clear all
              </button>
            </div>
          )}
          {options.map((option) => (
            <label
              key={option.value}
              className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center space-x-2 text-sm"
            >
              <input
                type="checkbox"
                checked={value.includes(option.value)}
                onChange={() => handleOptionClick(option.value)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const Leasing = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('listing');

  // Handle URL parameters to set initial tab
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Get page title and description based on active tab
  const getPageInfo = () => {
    switch (activeTab) {
      case 'listing':
        return {
          title: 'Listing',
          description: 'Manage property listings and availability'
        };
      case 'applicants':
        return {
          title: 'Applicants',
          description: 'Review and process rental applications'
        };
      case 'draft-lease':
        return {
          title: 'Draft Lease',
          description: 'Create and manage draft lease agreements'
        };
      case 'lease-renewals':
        return {
          title: 'Lease Renewals',
          description: 'Manage lease renewals and extensions'
        };
      case 'leasing':
        return {
          title: 'Leasing Overview',
          description: 'Complete leasing dashboard and analytics'
        };
      default:
        return {
          title: 'Listing',
          description: 'Manage property listings and availability'
        };
    }
  };



  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'listing':
        return <ListingTab />;
      case 'applicants':
        return <ApplicantsTab />;
      case 'draft-lease':
        return <DraftLeaseTab />;
      case 'lease-renewals':
        return <LeaseRenewalsTab />;
      case 'leasing':
        return <LeasingTab />;
      default:
        return <ListingTab />;
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{pageInfo.title}</h1>
          <p className="text-gray-600">{pageInfo.description}</p>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        {renderTabContent()}
      </div>

    </div>
  );
};

// Listing Tab Component  
const ListingTab = () => {
  const [listingActiveTab, setListingActiveTab] = React.useState('listed');

  const renderListingContent = () => {
    switch (listingActiveTab) {
      case 'listed':
        return <ListedUnitsTab />;
      case 'unlisted':
        return <UnlistedUnitsTab />;
      default:
        return <ListedUnitsTab />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Listing Sub-tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setListingActiveTab('listed')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              listingActiveTab === 'listed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Listed Units
          </button>
          <button
            onClick={() => setListingActiveTab('unlisted')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              listingActiveTab === 'unlisted'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Unlisted Units
          </button>
        </nav>
      </div>

      {/* Listing Content */}
      {renderListingContent()}
    </div>
  );
};

// Applicants Tab Component
const ApplicantsTab = () => {
  const [showBurgerMenu, setShowBurgerMenu] = useState(false);
  const [viewMode, setViewMode] = useState('individual'); // 'individual' or 'group'
  const applicants = []; // Sample data - replace with real data later
  const applicantGroups = []; // Sample group data - replace with real data later

  // Filter states - using arrays for multi-select
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState([]);
  const [stageFilter, setStageFilter] = useState([]);
  const [dateFilter, setDateFilter] = useState('all'); // Keep single select for date
  const [showFilters, setShowFilters] = useState(false);

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (statusFilter.length > 0) count++;
    if (stageFilter.length > 0) count++;
    if (dateFilter !== 'all') count++;
    return count;
  };

  const burgerMenuItems = [
    { label: 'Print Rental Application', icon: Printer, action: () => console.log('Print rental application') },
    { label: 'Customize Applicants checklist', icon: CheckSquare, action: () => console.log('Customize applicants checklist') },
    { label: 'Customize rental application', icon: FileEdit, action: () => console.log('Customize rental application') },
    { label: 'Manage application fees', icon: DollarSign, action: () => console.log('Manage application fees') }
  ];

  // Filter options
  const statusOptions = [
    { value: 'submitted', label: 'Submitted' },
    { value: 'under-review', label: 'Under Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    ...(viewMode === 'group' ? [
      { value: 'active', label: 'Active' },
      { value: 'pending', label: 'Pending' },
      { value: 'inactive', label: 'Inactive' }
    ] : [])
  ];

  const stageOptions = viewMode === 'individual' ? [
    { value: 'application-submitted', label: 'Application Submitted' },
    { value: 'background-check', label: 'Background Check' },
    { value: 'reference-verification', label: 'Reference Verification' },
    { value: 'final-review', label: 'Final Review' },
    { value: 'lease-preparation', label: 'Lease Preparation' }
  ] : [
    { value: '0-25', label: '0-25% Complete' },
    { value: '26-50', label: '26-50% Complete' },
    { value: '51-75', label: '51-75% Complete' },
    { value: '76-100', label: '76-100% Complete' }
  ];

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
        <button className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto">
          <Download className="h-4 w-4" />
          <span>Export</span>
        </button>
        
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto">
          <UserPlus className="h-4 w-4" />
          <span>Add Applicants</span>
        </button>
        
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto">
          <UsersIcon className="h-4 w-4" />
          <span>Create group</span>
        </button>

        {/* Burger Menu */}
        <div className="relative w-full sm:w-auto">
          <button 
            onClick={() => setShowBurgerMenu(!showBurgerMenu)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sm:hidden">More Options</span>
          </button>

          {/* Dropdown Menu */}
          {showBurgerMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
              <div className="py-2">
                {burgerMenuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        item.action();
                        setShowBurgerMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center space-x-3"
                    >
                      <Icon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-start">
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1">
          <button
            onClick={() => setViewMode('individual')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'individual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            By Individual
          </button>
          <button
            onClick={() => setViewMode('group')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'group'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            By Group
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {/* Search and Filter Toggle */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          {/* Search Bar */}
          <div className="relative w-full lg:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={viewMode === 'individual' ? 'Search applicants...' : 'Search groups...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full lg:w-64"
            />
          </div>

          {/* Filter Toggle Button */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Active Filter Count */}
            {getActiveFilterCount() > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {getActiveFilterCount()} active
              </span>
            )}
          </div>
        </div>

        {/* Expandable Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status Filter */}
              <MultiSelectDropdown
                label="Status"
                options={statusOptions}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="All Status"
              />

              {/* Stage Filter (Individual only) */}
              {viewMode === 'individual' && (
                <MultiSelectDropdown
                  label="Stage"
                  options={stageOptions}
                  value={stageFilter}
                  onChange={setStageFilter}
                  placeholder="All Stages"
                />
              )}

              {/* Progress Filter (Group only) */}
              {viewMode === 'group' && (
                <MultiSelectDropdown
                  label="Progress"
                  options={stageOptions}
                  value={stageFilter}
                  onChange={setStageFilter}
                  placeholder="All Progress"
                />
              )}

              {/* Date Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {viewMode === 'individual' ? 'Application Date' : 'Last Updated'}
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">Last 3 Months</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter([]);
                  setStageFilter([]);
                  setDateFilter('all');
                }}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Applicants Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {viewMode === 'individual' ? (
                  <>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Full name
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage in process
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Application received
                    </th>
                  </>
                ) : (
                  <>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicants
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Laste Updated
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percent complete
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {viewMode === 'individual' ? (
                applicants.length > 0 ? (
                  applicants.map((applicant) => (
                    <tr key={applicant.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {applicant.fullName}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {applicant.unit}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          applicant.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          applicant.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                          applicant.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {applicant.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {applicant.stageInProcess}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {applicant.lastUpdated}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {applicant.applicationReceived}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-3 sm:px-6 py-12 text-center">
                      <div className="text-gray-400 mb-4">
                        <Users className="h-16 w-16 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No individual applicants found</h3>
                      <p className="text-gray-600 mb-6">Get started by adding your first applicant or wait for applications to come in</p>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 mx-auto">
                        <UserPlus className="h-4 w-4" />
                        <span>Add First Applicant</span>
                      </button>
                    </td>
                  </tr>
                )
              ) : (
                applicantGroups.length > 0 ? (
                  applicantGroups.map((group) => (
                    <tr key={group.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {group.applicants}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {group.unit}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          group.status === 'Active' ? 'bg-green-100 text-green-800' :
                          group.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          group.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {group.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {group.lastUpdated}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                group.percentComplete >= 80 ? 'bg-green-500' :
                                group.percentComplete >= 50 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${group.percentComplete}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">{group.percentComplete}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-3 sm:px-6 py-12 text-center">
                      <div className="text-gray-400 mb-4">
                        <UsersIcon className="h-16 w-16 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No applicant groups found</h3>
                      <p className="text-gray-600 mb-6">Create your first group to organize applicants together</p>
                      <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 mx-auto">
                        <UsersIcon className="h-4 w-4" />
                        <span>Create First Group</span>
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Click outside to close burger menu */}
      {showBurgerMenu && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowBurgerMenu(false)}
        />
      )}
    </div>
  );
};

// Draft Lease Tab Component
const DraftLeaseTab = () => {
  // Sample data for draft leases (replace with real data later)
  const draftLeases = [];

  // Filter state
  const [rentalFilter, setRentalFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);
  const [executionFilter, setExecutionFilter] = useState([]);
  const [additionalFilter, setAdditionalFilter] = useState([]);

  // Filter options
  const rentalFilterOptions = [
    { value: 'apartment-1', label: 'Apartment 1' },
    { value: 'apartment-2', label: 'Apartment 2' },
    { value: 'house-1', label: 'House 1' },
    { value: 'condo-1', label: 'Condo 1' }
  ];

  const statusFilterOptions = [
    { value: 'unknown', label: 'Unknown' },
    { value: 'not-sent', label: 'Not sent' },
    { value: 'processing', label: 'Processing' },
    { value: 'sent', label: 'Sent' },
    { value: 'completed', label: 'Completed' }
  ];

  const executionFilterOptions = [
    { value: 'executed', label: 'Executed' },
    { value: 'not-executed', label: 'Not executed' },
    { value: 'pending', label: 'Pending' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const additionalFilterOptions = [
    { value: 'urgent', label: 'Urgent' },
    { value: 'standard', label: 'Standard' },
    { value: 'low-priority', label: 'Low Priority' }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-semibold text-gray-900">Draft leases</h2>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add lease</span>
          </button>
          <button className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>eSignature Documents</span>
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <MultiSelectDropdown
            label=""
            options={rentalFilterOptions}
            value={rentalFilter}
            onChange={setRentalFilter}
            placeholder="All rentals"
          />
        </div>
        <div>
          <MultiSelectDropdown
            label=""
            options={statusFilterOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Unknown, Not sent, Processing..."
          />
        </div>
        <div>
          <MultiSelectDropdown
            label=""
            options={executionFilterOptions}
            value={executionFilter}
            onChange={setExecutionFilter}
            placeholder="Executed, Not executed"
          />
        </div>
        <div>
          <MultiSelectDropdown
            label=""
            options={additionalFilterOptions}
            value={additionalFilter}
            onChange={setAdditionalFilter}
            placeholder="Add filter option"
          />
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        {draftLeases.length} matches
      </div>

      {/* Draft Leases Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LEASE
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ESIGNATURE STATUS
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LEASE STATUS
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AGENT
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  START DATE
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  END DATE
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {draftLeases.length > 0 ? (
                draftLeases.map((lease) => (
                  <tr key={lease.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lease.name}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lease.esignatureStatus}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lease.leaseStatus}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lease.agent}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lease.startDate}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lease.endDate}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="space-y-2">
                      <p>We didn't find any draft leases. Maybe you don't have any or maybe you need to{' '}
                        <span 
                          className="text-blue-600 hover:text-blue-800 cursor-pointer"
                          onClick={() => {
                            setRentalFilter([]);
                            setStatusFilter([]);
                            setExecutionFilter([]);
                            setAdditionalFilter([]);
                          }}
                        >
                          clear your filters
                        </span>.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Lease Renewals Tab Component
const LeaseRenewalsTab = () => {
  return (
    <div className="text-center py-12">
      <RefreshCw className="h-16 w-16 mx-auto text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Lease Renewals</h3>
      <p className="text-gray-600 mb-6">Manage lease renewals and extensions</p>
      <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2 mx-auto">
        <RefreshCw className="h-4 w-4" />
        <span>Process Renewal</span>
      </button>
    </div>
  );
};

// Leasing Tab Component
const LeasingTab = () => {
  return (
    <div className="text-center py-12">
      <Home className="h-16 w-16 mx-auto text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Leasing Overview</h3>
      <p className="text-gray-600 mb-6">Complete leasing dashboard and analytics</p>
      <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
          <ClipboardList className="h-4 w-4" />
          <span>View Dashboard</span>
        </button>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
          <FileText className="h-4 w-4" />
          <span>Generate Report</span>
        </button>
      </div>
    </div>
  );
};

// Listed Units Tab Component
const ListedUnitsTab = () => {
  // Sample data for listed units (replace with real data later)
  const listedUnits = [];

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
        <button 
          onClick={() => {
            // Export listed units functionality
            const csvHeaders = ['Listed', 'Available', 'Unit', 'Beds', 'Baths', 'Size', 'Listing Rent'];
            const csvData = listedUnits.length > 0 
              ? listedUnits.map(unit => [
                  unit.listed || 'N/A',
                  unit.available || 'N/A', 
                  unit.unit || 'N/A',
                  unit.beds || 'N/A',
                  unit.baths || 'N/A',
                  unit.size || 'N/A',
                  unit.listingRent || 'N/A'
                ])
              : [['No listed units available']];
            
            const csvContent = [csvHeaders, ...csvData].map(row => row.join(',')).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `listed_units_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </button>
      </div>

      {/* Listed Units Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Listed
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Beds
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Baths
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Size
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Listing Rent
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {listedUnits.length > 0 ? (
                listedUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {unit.listed}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {unit.available}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {unit.unit}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {unit.beds}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {unit.baths}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                      {unit.size}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {unit.listingRent}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-3 sm:px-6 py-12 text-center">
                    <div className="text-gray-400 mb-4">
                      <Building className="h-16 w-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No listed units found</h3>
                    <p className="text-gray-600 mb-6">Get started by adding your first property listing</p>
                    <p className="text-sm text-gray-500">Use the Export button above to download an empty template or add listings through the properties section.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Unlisted Units Tab Component
const UnlistedUnitsTab = () => {
  // Sample data for unlisted units (replace with real data later)
  const unlistedUnits = [];

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
        <button 
          onClick={() => {
            // Export unlisted units functionality
            const csvHeaders = ['Status', 'Lease End', 'Next Lease', 'Unit', 'Tenants'];
            const csvData = unlistedUnits.length > 0 
              ? unlistedUnits.map(unit => [
                  unit.status || 'N/A',
                  unit.leaseEnd || 'N/A', 
                  unit.nextLease || 'N/A',
                  unit.unit || 'N/A',
                  unit.tenants || 'N/A'
                ])
              : [['No unlisted units available']];
            
            const csvContent = [csvHeaders, ...csvData].map(row => row.join(',')).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `unlisted_units_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </button>
      </div>

      {/* Unlisted Units Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lease End
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Lease
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenants
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {unlistedUnits.length > 0 ? (
                unlistedUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {unit.status}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {unit.leaseEnd}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {unit.nextLease}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {unit.unit}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {unit.tenants}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-3 sm:px-6 py-12 text-center">
                    <div className="text-gray-400 mb-4">
                      <Building className="h-16 w-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No unlisted units found</h3>
                    <p className="text-gray-600 mb-6">All your properties are either listed or need to be added to the system</p>
                    <p className="text-sm text-gray-500">Use the Export button above to download an empty template or manage units through the properties section.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leasing;
