import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const OutstandingBalances = () => {
  const [selectedAssociation, setSelectedAssociation] = useState('All associations');
  const [selectedStatus, setSelectedStatus] = useState('(2) Future, Active');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Outstanding account balances</h1>

      <div className="flex gap-4 mb-6">
        <select 
          className="border border-gray-300 rounded px-3 py-2"
          value={selectedAssociation}
          onChange={(e) => setSelectedAssociation(e.target.value)}
        >
          <option>All associations</option>
        </select>
        <select 
          className="border border-gray-300 rounded px-3 py-2"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option>(2) Future, Active</option>
        </select>
        <button 
          className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          Add filter option
          <ChevronDown className="h-4 w-4" />
        </button>
        <button className="ml-auto text-gray-600 hover:text-gray-800 flex items-center gap-2">
          Export
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="w-8 p-4">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300"
                />
              </th>
              <th className="w-8 p-4"></th>
              <th className="text-left p-4">ACCOUNT</th>
              <th className="text-left p-4">PAST DUE EMAIL</th>
              <th className="text-left p-4">0 - 30 DAYS</th>
              <th className="text-left p-4">31 - 60 DAYS</th>
              <th className="text-left p-4">61 - 90 DAYS</th>
              <th className="text-left p-4">90+ DAYS</th>
              <th className="text-left p-4">BALANCE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="9" className="p-4 text-center text-gray-500">
                We didn't find any ownership accounts with outstanding balances. Maybe you don't have any or maybe you need to{' '}
                <button 
                  className="text-blue-500 hover:underline"
                  onClick={() => {
                    setSelectedAssociation('All associations');
                    setSelectedStatus('(2) Future, Active');
                  }}
                >
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

export default OutstandingBalances;
