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
  Home,
  Download
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
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Listing</span>
        </button>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
          <Building className="h-4 w-4" />
          <span>View All Listed</span>
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
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 mx-auto">
                      <Plus className="h-4 w-4" />
                      <span>Add First Listing</span>
                    </button>
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
        <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Create Listing</span>
        </button>
        <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2">
          <Building className="h-4 w-4" />
          <span>View Unlisted</span>
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
                    <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2 mx-auto">
                      <Plus className="h-4 w-4" />
                      <span>Create First Listing</span>
                    </button>
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
