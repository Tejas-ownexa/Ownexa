import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ArchitecturalRequests = () => {
  const navigate = useNavigate();
  const statusDropdownRef = useRef(null);
  const [selectedAssociation, setSelectedAssociation] = useState('All associations');
  const [isAssociationDropdownOpen, setIsAssociationDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState(['pending', 'approved', 'denied']);

  const statusOptions = [
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'denied', label: 'Denied' }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusToggle = (statusId) => {
    setSelectedStatuses(prev => {
      if (prev.includes(statusId)) {
        return prev.filter(id => id !== statusId);
      }
      return [...prev, statusId];
    });
  };

  const getStatusDisplayText = () => {
    if (selectedStatuses.length === statusOptions.length) {
      return `(${selectedStatuses.length}) Pending, Approved, Denied`;
    }
    return `(${selectedStatuses.length}) ${selectedStatuses
      .map(id => statusOptions.find(opt => opt.id === id)?.label)
      .filter(Boolean)
      .join(', ')}`;
  };

  const handleManageGroups = () => {
    navigate('/associations/property-groups', {
      state: { from: '/associations/architectural-requests' }
    });
  };

  const handleAddRequest = () => {
    // Add your logic for handling new request
    console.log('Add request clicked');
  };

  return (
    <div className="p-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <span>⚠️</span>
            <span>
              To set up architectural requests in Resident Center, go to{' '}
              <a href="#" className="underline">Resident Center Settings</a>.
            </span>
          </div>
          <button className="text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:text-gray-300">×</button>
        </div>
      </div>

      {/* Header with Title and Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Architectural requests</h1>
        <button
          onClick={handleAddRequest}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Add request
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        {/* Associations Dropdown */}
        <div className="relative inline-block">
          <button
            className="border border-gray-300 dark:border-gray-600 rounded px-4 py-2 flex items-center gap-2 bg-white dark:bg-gray-800 min-w-[200px]"
            onClick={() => setIsAssociationDropdownOpen(!isAssociationDropdownOpen)}
          >
            <span>{selectedAssociation}</span>
            <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300" />
          </button>
          {isAssociationDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50">
              <div
                className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 cursor-pointer"
                onClick={() => {
                  setSelectedAssociation('All associations');
                  setIsAssociationDropdownOpen(false);
                }}
              >
                All associations
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-700"
                onClick={() => {
                  handleManageGroups();
                  setIsAssociationDropdownOpen(false);
                }}
              >
                Manage groups...
              </div>
            </div>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="relative inline-block" ref={statusDropdownRef}>
          <button
            className="border border-gray-300 dark:border-gray-600 rounded px-4 py-2 flex items-center gap-2 bg-white dark:bg-gray-800 min-w-[200px]"
            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
          >
            <span>{getStatusDisplayText()}</span>
            <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300" />
          </button>
          {isStatusDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50">
              {statusOptions.map(option => (
                <div
                  key={option.id}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 cursor-pointer"
                  onClick={() => handleStatusToggle(option.id)}
                >
                  <div className="w-6 h-6 border border-gray-300 dark:border-gray-600 rounded flex items-center justify-center bg-white dark:bg-gray-800">
                    {selectedStatuses.includes(option.id) && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">ADDRESS</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">ASSOCIATION</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">DATE OF REQUEST</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">AGE OF REQUEST</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">PROJECT NAME</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wider">DECISION STATUS</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
            <tr>
              <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-300 dark:text-gray-500 dark:text-gray-300">
                We didn't find any architectural requests. Maybe you don't have any or maybe you need to{' '}
                <button className="text-blue-500 hover:underline">
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

export default ArchitecturalRequests;
