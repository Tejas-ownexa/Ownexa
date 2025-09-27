import React from 'react';
import { X } from 'lucide-react';

const CollectManagementFeesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-4xl rounded-lg shadow-lg flex flex-col h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-semibold">Collect management fees</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 dark:text-gray-300 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Warning Message */}
        <div className="p-4 mx-6 mt-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p>
            You need to set up the management fee default policy before you can calculate management fees. 
            To set up the default policy please visit the 'Management fees' in the Settings/Application settings section.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 flex-1">
          <div className="space-y-4 text-gray-600">
            <p>
              The system calculates total income for the specified period for properties whose management fee is based on income. 
              Note the system excludes management income accounts and non-commissionable income accounts from this total.
            </p>
            <p>
              To avoid collecting a management fee for a unit or property, set the amount to $0.00.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-white bg-gray-600 hover:bg-gray-700 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollectManagementFeesModal;
