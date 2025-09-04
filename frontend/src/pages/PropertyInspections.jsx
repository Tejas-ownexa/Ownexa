import React from 'react';
import { Search } from 'lucide-react';

const PropertyInspections = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Property Inspections</h1>
          <p className="text-gray-600">Schedule and manage property inspections</p>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="text-center py-12">
          <Search className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Property Inspections</h3>
          <p className="text-gray-600 mb-6">Schedule, conduct, and track property inspections</p>
          <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2 mx-auto">
            <Search className="h-4 w-4" />
            <span>Schedule Inspection</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyInspections;
