import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { X, Plus } from 'lucide-react';
import api from '../utils/axios';

const CreateApplicantGroupModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    property: '',
    emailApplicationLink: false
  });

  const [groupApplicants, setGroupApplicants] = useState([]);

  // Fetch properties from API
  const { data: properties = [], isLoading: propertiesLoading } = useQuery(
    ['properties'],
    async () => {
      const response = await api.get('/api/properties/');
      return response.data;
    },
    { enabled: isOpen } // Only fetch when modal is open
  );

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addApplicantToGroup = () => {
    setGroupApplicants(prev => [...prev, {
      id: Date.now(),
      firstName: '',
      lastName: '',
      phoneNumber: '',
      email: ''
    }]);
  };

  const removeApplicantFromGroup = (id) => {
    setGroupApplicants(prev => prev.filter(applicant => applicant.id !== id));
  };

  const updateGroupApplicant = (id, field, value) => {
    setGroupApplicants(prev => prev.map(applicant => 
      applicant.id === id ? { ...applicant, [field]: value } : applicant
    ));
  };

  const handleSave = () => {
    const groupData = {
      ...formData,
      applicants: groupApplicants
    };
    onSave(groupData);
    onClose();
  };

  const handleCancel = () => {
    setFormData({
      property: '',
      emailApplicationLink: false
    });
    setGroupApplicants([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create applicant group</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 dark:text-gray-300 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Property Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Property
            </label>
            <select
              name="property"
              value={formData.property}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              disabled={propertiesLoading}
            >
              <option value="">
                {propertiesLoading ? 'Loading properties...' : 
                 properties.length === 0 ? 'No properties available' : 
                 'Select a property...'}
              </option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.title} - {property.address?.street_1 || property.street_address_1}, {property.address?.city || property.city}
                </option>
              ))}
            </select>
          </div>

          {/* Applicants Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Applicants (required)
            </h3>
            
            {/* Group Applicant Forms */}
            {groupApplicants.map((applicant, index) => (
              <div key={applicant.id} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    Applicant {index + 1}
                  </h4>
                  <button
                    onClick={() => removeApplicantFromGroup(applicant.id)}
                    className="text-gray-400 dark:text-gray-300 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                      FIRST NAME <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={applicant.firstName}
                      onChange={(e) => updateGroupApplicant(applicant.id, 'firstName', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                      LAST NAME <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={applicant.lastName}
                      onChange={(e) => updateGroupApplicant(applicant.id, 'lastName', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                      PHONE NUMBER
                    </label>
                    <input
                      type="tel"
                      value={applicant.phoneNumber}
                      onChange={(e) => updateGroupApplicant(applicant.id, 'phoneNumber', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                      EMAIL
                    </label>
                    <input
                      type="email"
                      value={applicant.email}
                      onChange={(e) => updateGroupApplicant(applicant.id, 'email', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Add Applicant Button */}
            <button
              onClick={addApplicantToGroup}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </button>
          </div>

          {/* Rental Application */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">Rental application</h3>
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                name="emailApplicationLink"
                checked={formData.emailApplicationLink}
                onChange={handleInputChange}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Email application link to newly added applicants
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateApplicantGroupModal;
