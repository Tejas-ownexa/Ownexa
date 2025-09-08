import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const OwnersAndTenants = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleAddOwner = async () => {
    try {
      // First logout the user
      await logout();
      // Then redirect to login page
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleAddTenant = () => {
    navigate('/associations/add-tenant');
  };

  const handleReceivePayment = () => {
    navigate('/associations/receive-payment');
  };

  const [selectedAssociation, setSelectedAssociation] = useState('All associations');
  const [selectedStatus, setSelectedStatus] = useState('(2) Future, Active');
  const [selectedType, setSelectedType] = useState('(3) Owners, Tenants, Residents');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  return (
    <div className="p-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
        <div className="flex items-center gap-2 text-blue-700">
          <span role="img" aria-label="info">💡</span>
          <span>
            Curious about Resident Center adoption? It looks like 0% of association owners have an active account.{' '}
            <a href="#" className="underline">Manage users</a>
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Association owners and tenants</h1>
        <div className="flex gap-4">
          <button
            onClick={handleAddOwner}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add owner
          </button>
          <button
            onClick={handleAddTenant}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add tenant
          </button>
          <button
            onClick={handleReceivePayment}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Receive payment
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select 
          className="border border-gray-300 rounded px-3 py-2"
          value={selectedAssociation}
          onChange={(e) => setSelectedAssociation(e.target.value)}
        >
          <option>All associations</option>
        </select>
        <select 
          className="border border-gray-300 rounded px-3 py-2"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option>(2) Future, Active</option>
        </select>
        <select 
          className="border border-gray-300 rounded px-3 py-2"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          <option>(3) Owners, Tenants, Residents</option>
        </select>
        <button 
          className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
          onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
        >
          Add filter option
          <ChevronDown className="h-4 w-4" />
        </button>
        <button className="ml-auto text-gray-600 hover:text-gray-800 flex items-center gap-2">
          Export
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">FIRST NAME</th>
              <th className="text-left p-4">LAST NAME</th>
              <th className="text-left p-4">UNIT NUMBER</th>
              <th className="text-left p-4">PHONE</th>
              <th className="text-left p-4">EMAIL</th>
              <th className="text-left p-4">RESIDENT CENTER STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="6" className="p-4 text-center text-gray-500">
                We didn't find any association owners or tenants. Maybe you don't have any or maybe you need to{' '}
                <button 
                  className="text-blue-500 hover:underline"
                  onClick={() => {
                    setSelectedAssociation('All associations');
                    setSelectedStatus('(2) Future, Active');
                    setSelectedType('(3) Owners, Tenants, Residents');
                  }}
                >
                  clear your filters
                </button>.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OwnersAndTenants;



