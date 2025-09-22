import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ReceivePayment = () => {
  const navigate = useNavigate();
  const [selectedAccount, setSelectedAccount] = useState('');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Receive payment</h1>

      <div className="max-w-3xl">
        <div className="mb-6">
          <label className="block text-sm text-gray-600 mb-2">
            CHOOSE RESIDENT ACCOUNT
          </label>
          <div className="relative">
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 appearance-none bg-white"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
            >
              <option value="">Select resident account...</option>
              {/* Add your account options here */}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceivePayment;
