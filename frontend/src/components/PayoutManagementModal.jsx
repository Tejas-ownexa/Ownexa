import React from 'react';
import { X } from 'lucide-react';

const PayoutManagementModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-4xl rounded-lg shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6">
          <h2 className="text-2xl font-semibold">Pay out management income accounts</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600">
            Includes all outstanding funds on{' '}
            <a href="#" className="text-blue-600 hover:underline">
              management income accounts
            </a>.
          </p>

          <div className="mt-8 bg-white border rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Configuration needed</h3>
            <p className="text-gray-600">
              You must set your management income accounts and a management company in{' '}
              <a href="#" className="text-blue-600 hover:underline">
                management fee settings
              </a>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayoutManagementModal;
