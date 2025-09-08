import React from 'react';
import { ChevronDown } from 'lucide-react';

const ArchitecturalRequests = () => {
  return (
    <div className="p-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-yellow-800">
            <span>⚠️</span>
            <span>
              To set up architectural requests in Resident Center, go to{' '}
              <a href="#" className="underline">Resident Center Settings</a>.
            </span>
          </div>
          <button className="text-gray-500 hover:text-gray-700">×</button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Architectural requests</h1>
        <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
          Add request
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <select className="border border-gray-300 rounded px-3 py-2">
          <option>All associations</option>
        </select>
        <select className="border border-gray-300 rounded px-3 py-2">
          <option>(3) Pending, Approved, Denied</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">ADDRESS</th>
              <th className="text-left p-4">ASSOCIATION</th>
              <th className="text-left p-4">DATE OF REQUEST</th>
              <th className="text-left p-4">AGE OF REQUEST</th>
              <th className="text-left p-4">PROJECT NAME</th>
              <th className="text-left p-4">DECISION STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="6" className="p-4 text-center text-gray-500">
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
