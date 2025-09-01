import React, { useState, useEffect } from 'react';
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
  Home
} from 'lucide-react';

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
