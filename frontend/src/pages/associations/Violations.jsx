import React from 'react';
import { ChevronDown } from 'lucide-react';

const Violations = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">All violations</h1>
        <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
          Log violation
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <select className="border border-gray-300 rounded px-3 py-2">
          <option>All associations</option>
        </select>
        <button className="text-gray-600 hover:text-gray-800">
          Add filter option <ChevronDown className="inline h-4 w-4" />
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">TYPE</th>
              <th className="text-left p-4">CATEGORY</th>
              <th className="text-left p-4">ADDRESS</th>
              <th className="text-left p-4">OWNERS</th>
              <th className="text-left p-4">ASSOCIATION</th>
              <th className="text-left p-4">UNIT</th>
              <th className="text-left p-4">STAGE</th>
              <th className="text-left p-4">DEADLINE</th>
              <th className="text-left p-4">VIOLATION DATE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="9" className="p-4 text-center text-gray-500">
                We didn't find any violations. Maybe you don't have any or maybe you need to{' '}
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

export default Violations;
