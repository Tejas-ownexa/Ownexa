import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, X } from 'lucide-react';

const AddTenant = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    association: '',
    firstName: '',
    lastName: '',
    moveInDate: '',
    moveOutDate: '',
    primaryEmail: '',
    phoneNumbers: {
      mobile: '',
      home: '',
      work: '',
      fax: ''
    },
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'United States'
    },
    dateOfBirth: '',
    comments: '',
    emergency: {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    }
  });

  const handleCancel = () => {
    navigate('/associations/owners-tenants');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Add tenant</h1>
        <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
          <X className="h-6 w-6" />
        </button>
      </div>

      <form className="space-y-8">
        {/* Association Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ASSOCIATION NAME
          </label>
          <select 
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            value={formData.association}
            onChange={(e) => setFormData({...formData, association: e.target.value})}
          >
            <option value="">Select association...</option>
            {/* Add your association options here */}
          </select>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            NAME (REQUIRED)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="First"
              className="border border-gray-300 rounded-md px-3 py-2"
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            />
            <input
              type="text"
              placeholder="Last"
              className="border border-gray-300 rounded-md px-3 py-2"
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            />
          </div>
        </div>

        {/* Move-in/Move-out Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              MOVE-IN DATE
            </label>
            <input
              type="date"
              className="border border-gray-300 rounded-md px-3 py-2 w-full"
              value={formData.moveInDate}
              onChange={(e) => setFormData({...formData, moveInDate: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              MOVE-OUT DATE
            </label>
            <input
              type="date"
              className="border border-gray-300 rounded-md px-3 py-2 w-full"
              value={formData.moveOutDate}
              onChange={(e) => setFormData({...formData, moveOutDate: e.target.value})}
            />
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Contact information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PRIMARY EMAIL
              </label>
              <input
                type="email"
                className="border border-gray-300 rounded-md px-3 py-2 w-full"
                value={formData.primaryEmail}
                onChange={(e) => setFormData({...formData, primaryEmail: e.target.value})}
              />
            </div>
            <button type="button" className="text-blue-600 hover:text-blue-700">
              + Add alternate email
            </button>
          </div>
        </div>

        {/* Phone Numbers */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            PHONE NUMBER
          </label>
          {Object.entries(formData.phoneNumbers).map(([type, number]) => (
            <input
              key={type}
              type="tel"
              placeholder={type.charAt(0).toUpperCase() + type.slice(1)}
              className="border border-gray-300 rounded-md px-3 py-2 w-full"
              value={number}
              onChange={(e) => setFormData({
                ...formData,
                phoneNumbers: {...formData.phoneNumbers, [type]: e.target.value}
              })}
            />
          ))}
        </div>

        {/* Primary Address */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Primary address</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                STREET ADDRESS
              </label>
              <input
                type="text"
                className="border border-gray-300 rounded-md px-3 py-2 w-full mb-2"
                value={formData.address.street}
                onChange={(e) => setFormData({
                  ...formData,
                  address: {...formData.address, street: e.target.value}
                })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CITY
                </label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                  value={formData.address.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: {...formData.address, city: e.target.value}
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  STATE
                </label>
                <select
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                  value={formData.address.state}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: {...formData.address, state: e.target.value}
                  })}
                >
                  <option value="">Select...</option>
                  {/* Add state options */}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP
                </label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                  value={formData.address.zip}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: {...formData.address, zip: e.target.value}
                  })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Additional information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                COMMENTS
              </label>
              <textarea
                className="border border-gray-300 rounded-md px-3 py-2 w-full"
                rows={4}
                value={formData.comments}
                onChange={(e) => setFormData({...formData, comments: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DATE OF BIRTH
              </label>
              <input
                type="date"
                className="border border-gray-300 rounded-md px-3 py-2 w-full"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Emergency contact</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NAME
              </label>
              <input
                type="text"
                className="border border-gray-300 rounded-md px-3 py-2 w-full"
                value={formData.emergency.name}
                onChange={(e) => setFormData({
                  ...formData,
                  emergency: {...formData.emergency, name: e.target.value}
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RELATIONSHIP TO TENANT
              </label>
              <input
                type="text"
                className="border border-gray-300 rounded-md px-3 py-2 w-full"
                value={formData.emergency.relationship}
                onChange={(e) => setFormData({
                  ...formData,
                  emergency: {...formData.emergency, relationship: e.target.value}
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PHONE
              </label>
              <input
                type="tel"
                className="border border-gray-300 rounded-md px-3 py-2 w-full"
                value={formData.emergency.phone}
                onChange={(e) => setFormData({
                  ...formData,
                  emergency: {...formData.emergency, phone: e.target.value}
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                EMAIL
              </label>
              <input
                type="email"
                className="border border-gray-300 rounded-md px-3 py-2 w-full"
                value={formData.emergency.email}
                onChange={(e) => setFormData({
                  ...formData,
                  emergency: {...formData.emergency, email: e.target.value}
                })}
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600"
          >
            Create tenant
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTenant;
