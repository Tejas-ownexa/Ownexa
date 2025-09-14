import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import AddApplicantModal from '../components/AddApplicantModal';
import CreateApplicantGroupModal from '../components/CreateApplicantGroupModal';
import leasingService from '../services/leasingService';
import leaseRenewalService from '../services/leaseRenewalService';
import rentalOwnerService from '../services/rentalOwnerService';
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
  XCircle,
  Check,
  Trash2,
  MoreVertical
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

// Action Dropdown Component
const ActionDropdown = ({ 
  applicant, 
  group, 
  onApprove, 
  onReject, 
  onDelete, 
  isGroup = false 
}) => {
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

  const item = isGroup ? group : applicant;
  const status = isGroup ? item?.status : item?.application_status;
  const isApproved = isGroup ? status === 'Active' : status === 'Approved';
  const isLeaseCreated = !isGroup && status === 'Lease Created';
  
  // Debug logging
  console.log('ActionDropdown Debug:', {
    isGroup,
    status,
    isApproved,
    isLeaseCreated,
    item: item?.id,
    fullName: item?.full_name || item?.name
  });

  // If approved or lease created, show no actions
  if (isApproved || isLeaseCreated) {
    const badgeText = isLeaseCreated ? 'Lease Created' : 'Final';
    const badgeColor = isLeaseCreated ? 'blue' : 'green';
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium text-${badgeColor}-600 bg-${badgeColor}-50 rounded-md border border-${badgeColor}-200`}>
        <Check className="h-3 w-3 mr-1" />
        {badgeText}
      </span>
    );
  }

  const availableActions = [];
  
  if (!isGroup) {
    // Individual applicant actions
    // Show Approve for any status that is not 'Approved' or 'Lease Created' (case insensitive)
    if (status && status.toLowerCase() !== 'approved' && status.toLowerCase() !== 'lease created') {
      availableActions.push({
        label: 'Approve',
        icon: Check,
        onClick: () => onApprove(item.id, 'Approved'),
        className: 'text-green-700 hover:bg-green-50'
      });
    }
    // Show Reject for any status that is not 'Rejected', 'Approved', or 'Lease Created' (case insensitive)
    if (status && status.toLowerCase() !== 'rejected' && status.toLowerCase() !== 'approved' && status.toLowerCase() !== 'lease created') {
      availableActions.push({
        label: 'Reject',
        icon: X,
        onClick: () => onReject(item.id, 'Rejected'),
        className: 'text-red-700 hover:bg-red-50'
      });
    }
    // Show Delete option only if not 'Lease Created' (lease created applicants should not be deleted)
    if (status && status.toLowerCase() !== 'lease created') {
      availableActions.push({
        label: 'Delete',
        icon: Trash2,
        onClick: () => onDelete(item.id, item.full_name),
        className: 'text-red-700 hover:bg-red-50'
      });
    }
  } else {
    // Group actions
    if (status !== 'Active') {
      availableActions.push({
        label: 'Approve',
        icon: Check,
        onClick: () => onApprove(item.id, 'Active'),
        className: 'text-green-700 hover:bg-green-50'
      });
    }
    if (status !== 'Inactive' && status !== 'Active') {
      availableActions.push({
        label: 'Reject',
        icon: X,
        onClick: () => onReject(item.id, 'Inactive'),
        className: 'text-red-700 hover:bg-red-50'
      });
    }
    availableActions.push({
      label: 'Delete',
      icon: Trash2,
      onClick: () => onDelete(item.id, item.name),
      className: 'text-red-700 hover:bg-red-50'
    });
  }

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
        title="Actions"
      >
        <MoreVertical className="h-3 w-3" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-0 mr-8 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            {availableActions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center ${action.className}`}
              >
                <action.icon className="h-3 w-3 mr-2" />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Leasing = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('listing');
  const [isAddApplicantModalOpen, setIsAddApplicantModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  // Mutations for creating applicants and groups
  const createApplicantMutation = useMutation(
    leasingService.applicants.createApplicant,
    {
      onSuccess: () => {
        toast.success('Applicant created successfully!');
        queryClient.invalidateQueries(['leasing-applicants']);
        setIsAddApplicantModalOpen(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create applicant');
      }
    }
  );

  const createGroupMutation = useMutation(
    leasingService.groups.createGroup,
    {
      onSuccess: () => {
        toast.success('Applicant group created successfully!');
        queryClient.invalidateQueries(['applicant-groups']);
        setIsCreateGroupModalOpen(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create applicant group');
      }
    }
  );

  // Handle saving new applicant
  const handleSaveApplicant = (applicantData) => {
    createApplicantMutation.mutate(applicantData);
  };

  // Handle saving new applicant group
  const handleSaveApplicantGroup = (groupData) => {
    createGroupMutation.mutate(groupData);
  };


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
        return <ApplicantsTab 
          onOpenAddApplicant={() => setIsAddApplicantModalOpen(true)}
          onOpenCreateGroup={() => setIsCreateGroupModalOpen(true)}
        />;
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

      {/* Add Applicant Modal */}
      <AddApplicantModal
        isOpen={isAddApplicantModalOpen}
        onClose={() => setIsAddApplicantModalOpen(false)}
        onSave={handleSaveApplicant}
      />

      {/* Create Applicant Group Modal */}
      <CreateApplicantGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onSave={handleSaveApplicantGroup}
      />
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
const ApplicantsTab = ({ onOpenAddApplicant, onOpenCreateGroup }) => {
  const [showBurgerMenu, setShowBurgerMenu] = useState(false);
  const [viewMode, setViewMode] = useState('individual'); // 'individual' or 'group'
  
  // Fetch applicants from API
  const { data: applicants = [], isLoading: applicantsLoading, refetch: refetchApplicants } = useQuery(
    ['leasing-applicants'],
    () => leasingService.applicants.getApplicants(),
    {
      onError: (error) => {
        console.error('Error fetching applicants:', error);
      }
    }
  );
  
  // Fetch applicant groups from API
  const { data: applicantGroups = [], isLoading: groupsLoading, refetch: refetchGroups } = useQuery(
    ['applicant-groups'],
    () => leasingService.groups.getGroups(),
    {
      onError: (error) => {
        console.error('Error fetching applicant groups:', error);
      }
    }
  );

  // Filter states - using arrays for multi-select
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState([]);
  const [stageFilter, setStageFilter] = useState([]);
  const [dateFilter, setDateFilter] = useState('all'); // Keep single select for date
  const [showFilters, setShowFilters] = useState(false);

  // Handle status update for individual applicants
  const handleStatusUpdate = async (applicantId, newStatus) => {
    try {
      const response = await leasingService.applicants.updateStatus(applicantId, newStatus);
      if (response.success) {
        toast.success(`Application ${newStatus.toLowerCase()} successfully!`);
        refetchApplicants();
      } else {
        toast.error('Failed to update application status');
      }
    } catch (error) {
      console.error('Error updating applicant status:', error);
      toast.error(error.response?.data?.error || 'Failed to update application status');
    }
  };

  // Handle status update for applicant groups
    const handleGroupStatusUpdate = async (groupId, newStatus) => {
      try {
        const response = await leasingService.groups.updateStatus(groupId, newStatus);
        if (response.success) {
          toast.success(`Group ${newStatus.toLowerCase()} successfully!`);
          refetchGroups();
        } else {
          toast.error('Failed to update group status');
        }
      } catch (error) {
        console.error('Error updating group status:', error);
        toast.error(error.response?.data?.error || 'Failed to update group status');
      }
    };

    const handleDeleteApplicant = async (applicantId, applicantName) => {
      if (window.confirm(`Are you sure you want to delete the application for ${applicantName}? This action cannot be undone.`)) {
        try {
          const response = await leasingService.applicants.deleteApplicant(applicantId);
          if (response.success) {
            toast.success('Application deleted successfully!');
            refetchApplicants();
          } else {
            toast.error('Failed to delete application');
          }
        } catch (error) {
          console.error('Error deleting applicant:', error);
          toast.error(error.response?.data?.error || 'Failed to delete application');
        }
      }
    };

    const handleDeleteGroup = async (groupId, groupName) => {
      if (window.confirm(`Are you sure you want to delete the group "${groupName}"? This action cannot be undone.`)) {
        try {
          const response = await leasingService.groups.deleteGroup(groupId);
          if (response.success) {
            toast.success('Group deleted successfully!');
            refetchGroups();
          } else {
            toast.error('Failed to delete group');
          }
        } catch (error) {
          console.error('Error deleting group:', error);
          toast.error(error.response?.data?.error || 'Failed to delete group');
        }
      }
    };

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
        
        <button 
          onClick={onOpenAddApplicant}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Applicants</span>
        </button>
        
        <button 
          onClick={onOpenCreateGroup}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
        >
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
                      Property
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
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </>
                ) : (
                  <>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicants
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
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
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {viewMode === 'individual' ? (
                applicantsLoading ? (
                  <tr>
                    <td colSpan="6" className="px-3 sm:px-6 py-12 text-center">
                      <div className="text-gray-400 mb-4">
                        <RefreshCw className="h-8 w-8 mx-auto animate-spin" />
                      </div>
                      <p className="text-gray-600">Loading applicants...</p>
                    </td>
                  </tr>
                ) : applicants.length > 0 ? (
                  applicants.map((applicant) => (
                    <tr key={applicant.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {applicant.full_name}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {applicant.property?.title || 'N/A'}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {applicant.unit_number || 'N/A'}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          applicant.application_status === 'Approved' ? 'bg-green-100 text-green-800' :
                          applicant.application_status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                          applicant.application_status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {applicant.application_status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {applicant.stage_in_process || 'Application Submitted'}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {applicant.updated_at ? new Date(applicant.updated_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {applicant.application_date ? new Date(applicant.application_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <ActionDropdown
                          applicant={applicant}
                          onApprove={handleStatusUpdate}
                          onReject={handleStatusUpdate}
                          onDelete={handleDeleteApplicant}
                          isGroup={false}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-3 sm:px-6 py-12 text-center">
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
                groupsLoading ? (
                  <tr>
                    <td colSpan="7" className="px-3 sm:px-6 py-12 text-center">
                      <div className="text-gray-400 mb-4">
                        <RefreshCw className="h-8 w-8 mx-auto animate-spin" />
                      </div>
                      <p className="text-gray-600">Loading applicant groups...</p>
                    </td>
                  </tr>
                ) : applicantGroups.length > 0 ? (
                  applicantGroups.map((group) => (
                    <tr key={group.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {group.applicants}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {group.property || 'N/A'}
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
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <ActionDropdown
                          group={group}
                          onApprove={handleGroupStatusUpdate}
                          onReject={handleGroupStatusUpdate}
                          onDelete={handleDeleteGroup}
                          isGroup={true}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-3 sm:px-6 py-12 text-center">
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
  const navigate = useNavigate();
  
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
          <button 
            onClick={() => navigate('/leasing/add-draft-lease')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
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
  const [activeRenewalTab, setActiveRenewalTab] = useState('renewals');
  const [filterRentals, setFilterRentals] = useState('all-rentals');
  const [filterDays, setFilterDays] = useState([]);
  
  // Fetch lease renewals data
  const { data: leaseRenewalsData, isLoading, error } = useQuery(
    'lease-renewals',
    () => leaseRenewalService.getLeaseRenewals(),
    {
      refetchOnWindowFocus: false,
      retry: 1
    }
  );

  // Fetch rental owners for filter dropdown
  const { data: rentalOwnersData, isLoading: ownersLoading } = useQuery(
    'rental-owners',
    () => rentalOwnerService.getRentalOwners(),
    {
      refetchOnWindowFocus: false,
      retry: 1
    }
  );

  const leaseRenewals = leaseRenewalsData?.lease_renewals || [];
  const totalCount = leaseRenewalsData?.total_count || 0;
  const rentalOwners = rentalOwnersData || [];

  const getFilteredLeases = () => {
    return leaseRenewals.filter(lease => {
      // Apply rental owner filter
      if (filterRentals !== 'all-rentals') {
        if (lease.rentalOwners !== filterRentals) {
          return false;
        }
      }
      
      // Apply days filter
      if (filterDays.length > 0) {
        const daysLeft = lease.daysLeft;
        const matchesFilter = filterDays.some(filter => {
          switch (filter) {
            case 'expired':
              return daysLeft < 0;
            case '0-30':
              return daysLeft >= 0 && daysLeft <= 30;
            case '31-60':
              return daysLeft >= 31 && daysLeft <= 60;
            case '61-90':
              return daysLeft >= 61 && daysLeft <= 90;
            case '91-120':
              return daysLeft >= 91 && daysLeft <= 120;
            case '121-180':
              return daysLeft >= 121 && daysLeft <= 180;
            case '181-240':
              return daysLeft >= 181 && daysLeft <= 240;
            case '241-300':
              return daysLeft >= 241 && daysLeft <= 300;
            case '301-360':
              return daysLeft >= 301 && daysLeft <= 360;
            case '360-plus':
              return daysLeft > 360;
            default:
              return true;
          }
        });
        if (!matchesFilter) {
          return false;
        }
      }
      
      return true;
    });
  };

  const filteredLeases = getFilteredLeases();

  return (
    <div className="space-y-6">
      {/* Header with Title */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Lease management</h2>
      </div>

      {/* Top Level Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveRenewalTab('renewals')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeRenewalTab === 'renewals'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Renewals
          </button>
          <button
            onClick={() => setActiveRenewalTab('leasing')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeRenewalTab === 'leasing'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Leasing
          </button>
        </nav>
      </div>

      {/* Sub-tabs for Renewals */}
      {activeRenewalTab === 'renewals' && (
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button className="py-2 px-1 border-b-2 border-green-500 text-green-600 font-medium text-sm whitespace-nowrap">
              Not Started ({filteredLeases.length})
            </button>
            <button className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap">
              Renewal offers (0)
            </button>
            <button className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap">
              Accepted offers (0)
            </button>
          </nav>
        </div>
      )}

      {/* Sub-tabs for Leasing */}
      {activeRenewalTab === 'leasing' && (
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button className="py-2 px-1 border-b-2 border-green-500 text-green-600 font-medium text-sm whitespace-nowrap">
              Move outs (0)
            </button>
            <button className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap">
              Move ins (0)
            </button>
            <button className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap">
              Vacancies (0)
            </button>
          </nav>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="w-full sm:w-48">
          <select
            value={filterRentals}
            onChange={(e) => setFilterRentals(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            disabled={ownersLoading}
          >
            <option value="all-rentals">All rentals</option>
            {rentalOwners.map((owner) => (
              <option key={owner.id} value={owner.company_name}>
                {owner.company_name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-64">
          <MultiSelectDropdown
            label=""
            options={[
              { value: 'expired', label: 'Expired' },
              { value: '0-30', label: '0-30 days' },
              { value: '31-60', label: '31-60 days' },
              { value: '61-90', label: '61-90 days' },
              { value: '91-120', label: '91-120 days' },
              { value: '121-180', label: '121-180 days' },
              { value: '181-240', label: '181-240 days' },
              { value: '241-300', label: '241-300 days' },
              { value: '301-360', label: '301-360 days' },
              { value: '360-plus', label: '360+ days' }
            ]}
            value={filterDays}
            onChange={setFilterDays}
            placeholder="All time periods"
          />
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        {filteredLeases.length} matches
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Export Button */}
        <div className="flex justify-end p-4 border-b border-gray-200">
          <button className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                {activeRenewalTab === 'renewals' ? (
                  <>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700">
                      DAYS LEFT
                      <ChevronDown className="inline h-4 w-4 ml-1" />
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LEASE
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CURRENT TERMS
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      RENTAL OWNERS
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ACTIONS
                    </th>
                  </>
                ) : (
                  <>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700">
                      DAYS LEFT
                      <ChevronDown className="inline h-4 w-4 ml-1" />
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LEASE
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      STATUS
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NOTICE GIVEN DATE
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MOVE OUT DATE
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      COMMENTS
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NEXT LEASE
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeRenewalTab === 'renewals' ? (
                isLoading ? (
                  <tr>
                    <td colSpan="6" className="px-3 sm:px-6 py-12 text-center">
                      <div className="text-gray-400 mb-4">
                        <RefreshCw className="h-16 w-16 mx-auto animate-spin" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Loading lease renewals...</h3>
                      <p className="text-gray-600">Please wait while we fetch your lease data</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="6" className="px-3 sm:px-6 py-12 text-center">
                      <div className="text-red-400 mb-4">
                        <XCircle className="h-16 w-16 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading lease renewals</h3>
                      <p className="text-gray-600 mb-6">{error.message || 'Failed to fetch lease data'}</p>
                      <button 
                        onClick={() => window.location.reload()} 
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                      >
                        Try Again
                      </button>
                    </td>
                  </tr>
                ) : filteredLeases.length > 0 ? (
                  filteredLeases.map((lease) => (
                    <tr key={lease.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          lease.daysLeft < 0 ? 'bg-gray-100 text-gray-800' :
                          lease.daysLeft <= 30 ? 'bg-red-100 text-red-800' : 
                          lease.daysLeft <= 60 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-green-100 text-green-800'
                        }`}>
                          {lease.daysLeft < 0 ? 'EXPIRED' : `${lease.daysLeft} DAYS`}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-sm">
                        <div className="text-blue-600 hover:text-blue-800 cursor-pointer">
                          <div className="font-medium">{lease.propertyTitle}</div>
                          <div className="text-gray-500 text-xs">{lease.tenantName}</div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-sm text-gray-900">
                        <div className="whitespace-pre-line">
                          <div className="font-medium">{lease.currentTerms}</div>
                          <div className="text-gray-500 text-xs">${lease.rentAmount.toLocaleString()}/month</div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-sm">
                        <div className="text-blue-600 hover:text-blue-800 cursor-pointer">
                          {lease.rentalOwners}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end space-x-2">
                          <button className="bg-white text-gray-700 px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 transition-colors text-sm">
                            Generate offer
                          </button>
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-3 sm:px-6 py-12 text-center">
                      <div className="text-gray-400 mb-4">
                        <RefreshCw className="h-16 w-16 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No lease renewals found</h3>
                      <p className="text-gray-600 mb-6">There are currently no lease renewals to manage</p>
                      <p className="text-sm text-gray-500">Lease renewals will appear here when they become available for processing</p>
                    </td>
                  </tr>
                )
              ) : (
                <tr>
                  <td colSpan="7" className="px-3 sm:px-6 py-12 text-center">
                    <div className="text-gray-400 mb-4">
                      <svg className="h-16 w-16 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.3"/>
                        <path d="M12 8v4m0 4h.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">We didn't find any leases matching your criteria.</h3>
                    <p className="text-gray-600">Try changing your filters.</p>
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
