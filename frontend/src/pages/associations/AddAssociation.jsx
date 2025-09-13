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
                    <option value="AL">Alabama</option>
                    <option value="AK">Alaska</option>
                    <option value="AZ">Arizona</option>
                    <option value="AR">Arkansas</option>
                    <option value="CA">California</option>
                    <option value="CO">Colorado</option>
                    <option value="CT">Connecticut</option>
                    <option value="DE">Delaware</option>
                    <option value="FL">Florida</option>
                    <option value="GA">Georgia</option>
                    <option value="HI">Hawaii</option>
                    <option value="ID">Idaho</option>
                    <option value="IL">Illinois</option>
                    <option value="IN">Indiana</option>
                    <option value="IA">Iowa</option>
                    <option value="KS">Kansas</option>
                    <option value="KY">Kentucky</option>
                    <option value="LA">Louisiana</option>
                    <option value="ME">Maine</option>
                    <option value="MD">Maryland</option>
                    <option value="MA">Massachusetts</option>
                    <option value="MI">Michigan</option>
                    <option value="MN">Minnesota</option>
                    <option value="MS">Mississippi</option>
                    <option value="MO">Missouri</option>
                    <option value="MT">Montana</option>
                    <option value="NE">Nebraska</option>
                    <option value="NV">Nevada</option>
                    <option value="NH">New Hampshire</option>
                    <option value="NJ">New Jersey</option>
                    <option value="NM">New Mexico</option>
                    <option value="NY">New York</option>
                    <option value="NC">North Carolina</option>
                    <option value="ND">North Dakota</option>
                    <option value="OH">Ohio</option>
                    <option value="OK">Oklahoma</option>
                    <option value="OR">Oregon</option>
                    <option value="PA">Pennsylvania</option>
                    <option value="RI">Rhode Island</option>
                    <option value="SC">South Carolina</option>
                    <option value="SD">South Dakota</option>
                    <option value="TN">Tennessee</option>
                    <option value="TX">Texas</option>
                    <option value="UT">Utah</option>
                    <option value="VT">Vermont</option>
                    <option value="VA">Virginia</option>
                    <option value="WA">Washington</option>
                    <option value="WV">West Virginia</option>
                    <option value="WI">Wisconsin</option>
                    <option value="WY">Wyoming</option>
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
                  <option value="SSN">SSN</option>
                  <option value="EIN">EIN</option>
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
                  <option value="new">Add new account</option>
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
                  <option value="john-doe">John Doe</option>
                  <option value="jane-smith">Jane Smith</option>
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
