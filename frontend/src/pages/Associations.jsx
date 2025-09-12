import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { ChevronDown, ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import CollectManagementFeesModal from '../components/CollectManagementFeesModal';
import PayoutManagementModal from '../components/PayoutManagementModal';

const Associations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const previousPage = location.state?.from || '/associations';

  const handleGoBack = () => {
    navigate(previousPage);
  };

  const [selectedAssociation, setSelectedAssociation] = useState('All associations');
  const [isAssociationDropdownOpen, setIsAssociationDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isManagementFeesOpen, setIsManagementFeesOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [isManagementFeesModalOpen, setIsManagementFeesModalOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  
  // You can implement this in your API client
  const { data: associations, isLoading } = useQuery('associations', () => 
    fetch('http://localhost:5002/api/associations').then(res => res.json())
  );

  const filterOptions = [
    { name: 'Status', value: 'status' },
    { name: 'Location', value: 'location' },
    { name: 'Preferred vendor', value: 'preferred_vendor' }
  ];

  const handleManageGroups = () => {
    navigate('/associations/property-groups', {
      state: { from: '/associations' }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Associations</h1>
            <p className="text-gray-600">Manage and browse your association portfolio</p>
          </div>
          <div className="flex gap-4">
            <button 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => {/* Add association handler */}}
            >
              Add Association
            </button>
          
            {/* Management Fees Dropdown */}
            <div className="relative">
              <button 
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => setIsManagementFeesOpen(!isManagementFeesOpen)}
              >
                Management Fees
                <ChevronDown className="ml-2 h-4 w-4" />
              </button>
              {isManagementFeesOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <button 
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      onClick={() => {
                        setIsManagementFeesModalOpen(true);
                        setIsManagementFeesOpen(false);
                      }}
                    >
                      Collect management fees
                    </button>
                    <button 
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      onClick={() => {
                        setIsPayoutModalOpen(true);
                        setIsManagementFeesOpen(false);
                      }}
                    >
                      Pay out management income accounts
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Link 
              to="/associations/property-groups"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Property Groups
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex gap-4">
          {/* Associations Dropdown */}
          <div className="relative">
            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-w-[200px] justify-between"
              onClick={() => setIsAssociationDropdownOpen(!isAssociationDropdownOpen)}
            >
              {selectedAssociation}
              <ChevronDown className="h-4 w-4" />
            </button>
            {isAssociationDropdownOpen && (
              <div className="absolute left-0 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <div className="py-1">
                  <button 
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => {
                      setSelectedAssociation('All associations');
                      setIsAssociationDropdownOpen(false);
                    }}
                  >
                    All associations
                  </button>
                  <button 
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-blue-600"
                    onClick={() => {
                      setIsAssociationDropdownOpen(false);
                      handleManageGroups();
                    }}
                  >
                    Manage groups...
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-600 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            >
              Add Filter Option
              <ChevronDown className="ml-2 h-4 w-4" />
            </button>
            {isFilterDropdownOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <div className="py-1">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      onClick={() => {
                        setActiveFilters([...activeFilters, option.value]);
                        setIsFilterDropdownOpen(false);
                      }}
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

      {/* Associations Table */}
      <div className="bg-white rounded-lg shadow-md">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading associations...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ASSOCIATION
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LOCATION
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MANAGER
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {associations?.length ? (
                  associations.map((association) => (
                    <tr key={association.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {association.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {association.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {association.manager}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <p className="text-lg font-medium mb-2">No associations found</p>
                        <p className="text-sm">
                          We didn't find any associations. Maybe you don't have any or maybe you need to{' '}
                          <button 
                            className="text-blue-600 hover:text-blue-800 font-medium"
                            onClick={() => {
                              setSelectedAssociation('All associations');
                              setActiveFilters([]);
                            }}
                          >
                            clear your filters
                          </button>.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CollectManagementFeesModal 
        isOpen={isManagementFeesModalOpen}
        onClose={() => setIsManagementFeesModalOpen(false)}
      />
      
      <PayoutManagementModal 
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
      />
    </div>
  );
};

export default Associations;