import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  ClipboardList,
  FileText,
  Calendar,
  User,
  Building,
  Users,
  Edit,
  RefreshCw,
  Home
} from 'lucide-react';

const Leasing = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('listing');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Tab configurations
  const tabs = [
    { id: 'listing', label: 'Listing', icon: Building },
    { id: 'applicants', label: 'Applicants', icon: Users },
    { id: 'draft-lease', label: 'Draft Lease', icon: Edit },
    { id: 'lease-renewals', label: 'Lease Renewals', icon: RefreshCw },
    { id: 'leasing', label: 'Leasing', icon: Home }
  ];

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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Leasing</h1>
            <p className="text-gray-600">Manage leases, applications, and tenant onboarding</p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <button className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center sm:justify-start space-x-2 text-sm sm:text-base">
              <Plus className="h-4 w-4" />
              <span>New Lease</span>
            </button>
            <button className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center sm:justify-start space-x-2 text-sm sm:text-base">
              <FileText className="h-4 w-4" />
              <span>New Application</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap space-x-4 sm:space-x-8 px-4 sm:px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">
                    {tab.label.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {renderTabContent()}
        </div>
      </div>

    </div>
  );
};

// Listing Tab Component
const ListingTab = () => {
  return (
    <div className="text-center py-12">
      <Building className="h-16 w-16 mx-auto text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Listing Management</h3>
      <p className="text-gray-600 mb-6">Manage property listings and availability</p>
      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 mx-auto">
        <Plus className="h-4 w-4" />
        <span>Create Listing</span>
      </button>
    </div>
  );
};

// Applicants Tab Component
const ApplicantsTab = () => {
  return (
    <div className="text-center py-12">
      <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Applicant Management</h3>
      <p className="text-gray-600 mb-6">Review and process rental applications</p>
      <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 mx-auto">
        <Users className="h-4 w-4" />
        <span>View Applications</span>
      </button>
    </div>
  );
};

// Draft Lease Tab Component
const DraftLeaseTab = () => {
  return (
    <div className="text-center py-12">
      <Edit className="h-16 w-16 mx-auto text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Draft Lease Management</h3>
      <p className="text-gray-600 mb-6">Create and manage draft lease agreements</p>
      <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2 mx-auto">
        <Edit className="h-4 w-4" />
        <span>Create Draft</span>
      </button>
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

export default Leasing;
