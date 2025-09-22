import React, { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

const UpdateRecurringCharges = () => {
  const [account, setAccount] = useState('');
  const [frequency, setFrequency] = useState('');
  const [property, setProperty] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleClose = () => {
    // Navigate back to previous page
    window.history.back();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div className="bg-white w-full max-w-5xl rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-semibold">Update recurring charges</h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-3 gap-6 mb-6">
            {/* Account Dropdown */}
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-2">
                ACCOUNT*
              </label>
              <div className="relative">
                <select
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 appearance-none bg-white pr-8"
                >
                  <option value="">Select</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Frequency Dropdown */}
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-2">
                FREQUENCY*
              </label>
              <div className="relative">
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 appearance-none bg-white pr-8"
                >
                  <option value="">Select</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Property Dropdown */}
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-2">
                PROPERTY*
              </label>
              <div className="relative">
                <select
                  value={property}
                  onChange={(e) => setProperty(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 appearance-none bg-white pr-8"
                >
                  <option value="">Select</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Apply Filters Button */}
          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded">
            Apply filters
          </button>

          {/* Help Text */}
          <div className="mt-8 space-y-4 text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              <p>Find recurring charges by filtering accounts, frequencies, and properties.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              <p>Change their amounts and memos in a single step. Simple!</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50 rounded-b-lg flex items-center justify-between">
          <div className="flex gap-4">
            <button className="px-6 py-2 bg-white border border-gray-300 rounded font-medium">
              Save
            </button>
            <button 
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateRecurringCharges;
