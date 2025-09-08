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
    <div className="p-6">
      {/* Update Back Button */}
      <button 
        onClick={handleGoBack}
        className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Go back
      </button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Associations</h1>
        <div className="flex gap-4">
          <button 
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            onClick={() => {/* Add association handler */}}
          >
            Add association
          </button>
          
          {/* Management Fees Dropdown */}
          <div className="relative">
            <button 
              className="border border-gray-300 px-4 py-2 rounded flex items-center gap-2 text-gray-700 hover:bg-gray-50"
              onClick={() => setIsManagementFeesOpen(!isManagementFeesOpen)}
            >
              Management fees
              <ChevronDown className="h-4 w-4" />
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

          <button className="border border-gray-300 px-4 py-2 rounded text-gray-700 hover:bg-gray-50">
            <Link to="/associations/property-groups">Property groups</Link>
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        {/* Associations Dropdown */}
        <div className="relative">
          <button
            className="border border-gray-300 rounded px-3 py-2 flex items-center gap-2 min-w-[200px]"
            onClick={() => setIsAssociationDropdownOpen(!isAssociationDropdownOpen)}
          >
            {selectedAssociation}
            <ChevronDown className="h-4 w-4 ml-auto" />
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
            className="text-green-600 hover:text-green-700 px-3 py-2 flex items-center gap-2"
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
          >
            Add filter option
            <ChevronDown className="h-4 w-4" />
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

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">ASSOCIATION</th>
                <th className="text-left p-4">LOCATION</th>
                <th className="text-left p-4">MANAGER</th>
              </tr>
            </thead>
            <tbody>
              {associations?.length ? (
                associations.map((association) => (
                  <tr key={association.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{association.name}</td>
                    <td className="p-4">{association.location}</td>
                    <td className="p-4">{association.manager}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="p-4 text-center text-gray-500">
                    We didn't find any associations. Maybe you don't have any or maybe you need to{' '}
                    <button 
                      className="text-blue-500 hover:underline"
                      onClick={() => {
                        setSelectedAssociation('All associations');
                        setActiveFilters([]);
                      }}
                    >
                      clear your filters
                    </button>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

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
