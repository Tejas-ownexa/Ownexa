import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { ChevronDown, ArrowLeft, Plus, Building2, User, MapPin } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import CollectManagementFeesModal from '../components/CollectManagementFeesModal';
import PayoutManagementModal from '../components/PayoutManagementModal';
import associationService from '../services/associationService';
import { useAuth } from '../contexts/AuthContext';

const Associations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const previousPage = location.state?.from || '/associations';
  const { user, loading: authLoading } = useAuth();

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
  
  // Fetch associations from API
  const { data: associations = [], isLoading, error } = useQuery(
    ['associations'],
    () => associationService.getAssociations(),
    {
      onError: (error) => {
        console.error('Error fetching associations:', error);
      },
    }
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Associations</h1>
            <p className="text-gray-600 dark:text-gray-300">Manage and browse your association portfolio</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/associations/add')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Association
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex gap-4">
          {/* Associations Dropdown */}
          <div className="relative">
            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-w-[200px] justify-between"
              onClick={() => setIsAssociationDropdownOpen(!isAssociationDropdownOpen)}
            >
              {selectedAssociation}
              <ChevronDown className="ml-2 h-4 w-4" />
            </button>
            {isAssociationDropdownOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50">
                <div className="py-1">
                  <button 
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
                    onClick={() => {
                      setSelectedAssociation('All associations');
                      setIsAssociationDropdownOpen(false);
                    }}
                  >
                    All associations
                  </button>
                  <button 
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-blue-600 dark:text-blue-400"
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
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-600 dark:text-green-400 bg-green-50 hover:bg-green-100 dark:bg-green-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            >
              Add Filter Option
              <ChevronDown className="ml-2 h-4 w-4" />
            </button>
            {isFilterDropdownOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50">
                <div className="py-1">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Loading associations...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    ASSOCIATION
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    LOCATION
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    MANAGER
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center">
                      <div className="text-gray-500 dark:text-gray-400 dark:text-gray-300">
                        <p className="text-lg font-medium mb-2">Loading associations...</p>
                        <p className="text-sm">Please wait while we fetch your associations.</p>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center">
                      <div className="text-red-500 dark:text-red-400">
                        <p className="text-lg font-medium mb-2">Error loading associations</p>
                        <p className="text-sm">{error.message || 'An error occurred while fetching associations.'}</p>
                      </div>
                    </td>
                  </tr>
                ) : associations && associations.length > 0 ? (
                  associations.map((association) => (
                    <tr 
                      key={association.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => navigate(`/associations/${association.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                          {association.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-300 dark:text-gray-500" />
                          {association.full_address || `${association.city}, ${association.state}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {association.manager && association.manager !== 'None' && association.manager.trim() !== '' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                            <User className="h-3 w-3 mr-1" />
                            {association.manager}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 dark:text-gray-300">
                            <Building2 className="h-3 w-3 mr-1" />
                            No Manager
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center">
                      <div className="text-gray-500 dark:text-gray-400 dark:text-gray-300">
                        <p className="text-lg font-medium mb-2">No associations found</p>
                        <p className="text-sm">
                          We didn't find any associations. Maybe you don't have any or maybe you need to{' '}
                          <button 
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                            onClick={() => {
                              setSelectedAssociation('All associations');
                              setActiveFilters([]);
                            }}
                          >
                            clear your filters
                          </button>.
                        </p>
                        <div className="mt-4">
                          <button
                            onClick={() => navigate('/associations/add')}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Association
                          </button>
                        </div>
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