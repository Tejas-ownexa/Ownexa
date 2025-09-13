import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AddAssociation = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    associationName: '',
    units: '',
    streetAddress: '', 
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    taxIdentityType: '',
    taxpayerId: '',
    useDifferentName: false,
    useDifferentAddress: false,
    operatingAccount: '',
    manager: ''
  });

  const handleCancel = () => {
    navigate('/associations');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    navigate('/associations');
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Add association</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          {/* What is the name of the association? */}
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-4">What is the name of the association?</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">ASSOCIATION NAME</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={formData.associationName}
                  onChange={(e) => setFormData({ ...formData, associationName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">HOW MANY UNITS?</label>
                <input
                  type="number"
                  className="w-1/4 border border-gray-300 rounded px-3 py-2"
                  value={formData.units}
                  onChange={(e) => setFormData({ ...formData, units: e.target.value })}
                />
                <p className="text-sm text-gray-500 mt-1">You have 31 available units remaining in your plan.</p>
              </div>
            </div>
          </div>

          {/* What is the address? */}
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-4">What is the address?</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">STREET ADDRESS</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={formData.streetAddress}
                    onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">CITY</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">STATE</label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  >
                    <option value="">Select...</option>
                    {/* Add state options */}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">ZIP</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">COUNTRY</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                >
                  <option value="United States">United States</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tax Information */}
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-4">Tax Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">TAX IDENTITY TYPE</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={formData.taxIdentityType}
                  onChange={(e) => setFormData({ ...formData, taxIdentityType: e.target.value })}
                >
                  <option value="">Select type...</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">TAXPAYER ID</label>
                <input
                  type="text"
                  placeholder="Enter SSN or EIN..."
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={formData.taxpayerId}
                  onChange={(e) => setFormData({ ...formData, taxpayerId: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={formData.useDifferentName}
                  onChange={(e) => setFormData({ ...formData, useDifferentName: e.target.checked })}
                />
                <span className="ml-2">Use a different name</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={formData.useDifferentAddress}
                  onChange={(e) => setFormData({ ...formData, useDifferentAddress: e.target.checked })}
                />
                <span className="ml-2">Use a different address</span>
              </label>
            </div>
          </div>

          {/* Bank Account */}
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-4">What is this association's primary bank account?</h2>
            <div>
              <label className="block text-sm text-gray-600 mb-1">OPERATING ACCOUNT *</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={formData.operatingAccount}
                onChange={(e) => setFormData({ ...formData, operatingAccount: e.target.value })}
              >
                <option value="">Select or add new</option>
              </select>
            </div>
          </div>

          {/* Manager */}
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-4">Who will be the primary manager of this community?</h2>
            <p className="text-sm text-gray-600 mb-4">
              Choose an existing staff member. If the staff member has not yet been added as a user, they can be
              added as the manager later through the association's summary details.
            </p>
            <div>
              <label className="block text-sm text-gray-600 mb-1">MANAGER (OPTIONAL)</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              >
                <option value="">Select a staff member...</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
            >
              Create association
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
    </div>
  );
};

export default AddAssociation;
