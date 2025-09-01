import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Info } from 'lucide-react';

const AddDraftLease = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    signatureStatus: 'unsigned',
    property: '',
    leaseType: 'fixed',
    startDate: '',
    endDate: '',
    leasingAgent: '',
    rentCycle: 'monthly',
    rentAmount: '',
    rentAccount: 'rent-income',
    nextDueDate: '',
    memo: '',
    welcomeEmail: false
  });

  const [approvedApplicants, setApprovedApplicants] = useState([]);
  const [moveInCharges, setMoveInCharges] = useState([]);
  const [recurringCharges, setRecurringCharges] = useState([]);
  const [oneTimeCharges, setOneTimeCharges] = useState([]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addApprovedApplicant = () => {
    setApprovedApplicants(prev => [...prev, { id: Date.now(), name: '', type: 'tenant' }]);
  };

  const removeApprovedApplicant = (id) => {
    setApprovedApplicants(prev => prev.filter(app => app.id !== id));
  };

  const addOneTimeCharge = () => {
    setOneTimeCharges(prev => [...prev, { id: Date.now(), description: '', amount: '' }]);
  };

  const splitRentCharge = () => {
    // Handle split rent charge functionality
    console.log('Split rent charge');
  };

  const addRecurringCharge = () => {
    setRecurringCharges(prev => [...prev, { id: Date.now(), description: '', amount: '', frequency: 'monthly' }]);
  };

  const handleSave = () => {
    console.log('Save draft lease:', formData);
    // Implement save functionality
  };

  const handleSaveAndPrepareESignature = () => {
    console.log('Save and prepare eSignature:', formData);
    // Implement save and eSignature functionality
  };

  const handleCancel = () => {
    navigate('/leasing?tab=draft-lease');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Add draft lease</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-8">
          {/* Signature Status */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Signature status</h3>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="signatureStatus"
                  value="signed"
                  checked={formData.signatureStatus === 'signed'}
                  onChange={handleInputChange}
                  className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Signed</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="signatureStatus"
                  value="unsigned"
                  checked={formData.signatureStatus === 'unsigned'}
                  onChange={handleInputChange}
                  className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-green-600 font-medium">Unsigned</span>
              </label>
            </div>
          </div>

          {/* Lease Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Lease details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Property */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PROPERTY <span className="text-red-500">*</span>
                </label>
                <select
                  name="property"
                  value={formData.property}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a property...</option>
                  <option value="property1">Shree Nivas</option>
                  <option value="property2">df</option>
                  <option value="property3">Property 3</option>
                </select>
              </div>

              {/* Lease Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LEASE TYPE <span className="text-red-500">*</span>
                </label>
                <select
                  name="leaseType"
                  value={formData.leaseType}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="fixed">Fixed</option>
                  <option value="month-to-month">Month-to-Month</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  START DATE <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="mm/dd/yyyy"
                    required
                  />
                </div>
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  END DATE <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="mm/dd/yyyy"
                    required
                  />
                </div>
              </div>

              {/* Leasing Agent */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LEASING AGENT
                </label>
                <select
                  name="leasingAgent"
                  value={formData.leasingAgent}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select an agent...</option>
                  <option value="agent1">Agent 1</option>
                  <option value="agent2">Agent 2</option>
                </select>
              </div>
            </div>
          </div>

          {/* Approved Applicants */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Approved Applicants, Tenants and cosigners</h3>
            <button
              onClick={addApprovedApplicant}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Add approved applicant, tenant or cosigner</span>
            </button>
            
            {approvedApplicants.map((applicant) => (
              <div key={applicant.id} className="mt-3 p-3 border border-gray-200 rounded-md">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    placeholder="Name"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm mr-2"
                  />
                  <select className="border border-gray-300 rounded-md px-3 py-2 text-sm mr-2">
                    <option value="tenant">Tenant</option>
                    <option value="cosigner">Cosigner</option>
                  </select>
                  <button
                    onClick={() => removeApprovedApplicant(applicant.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Move-in Charges */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Move-in charges</h3>
            <p className="text-sm text-gray-600 mb-4">(optional)</p>
            <p className="text-sm text-gray-600 mb-4">
              Move-in payments can be made by applicants added to this draft lease in the Applicant Center. Any applicants without Applicant Center access will be sent a welcome email when the draft lease is saved.
            </p>
            <button
              onClick={addOneTimeCharge}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Add one-time charge</span>
            </button>
          </div>

          {/* Rent */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Rent</h3>
            <p className="text-sm text-gray-600 mb-4">(optional)</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RENT CYCLE <Info className="inline h-4 w-4 ml-1 text-gray-400" />
              </label>
              <select
                name="rentCycle"
                value={formData.rentCycle}
                onChange={handleInputChange}
                className="w-full md:w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border-l-4 border-green-500 bg-green-50">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">AMOUNT</label>
                <input
                  type="number"
                  name="rentAmount"
                  value={formData.rentAmount}
                  onChange={handleInputChange}
                  placeholder="$0.00"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ACCOUNT <span className="text-red-500">*</span>
                </label>
                <select
                  name="rentAccount"
                  value={formData.rentAccount}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="rent-income">Rent Income</option>
                  <option value="other-income">Other Income</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NEXT DUE DATE <Info className="inline h-4 w-4 ml-1 text-gray-400" />
                </label>
                <input
                  type="date"
                  name="nextDueDate"
                  value={formData.nextDueDate}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="mm/dd/yyyy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MEMO</label>
                <input
                  type="text"
                  name="memo"
                  value={formData.memo}
                  onChange={handleInputChange}
                  placeholder="If left blank, will show 'Rent'"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="text-right text-xs text-gray-500 mt-1">100</div>
              </div>
            </div>

            <button
              onClick={splitRentCharge}
              className="mt-4 flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Split rent charge</span>
            </button>
          </div>

          {/* Charges */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Charges</h3>
            <p className="text-sm text-gray-600 mb-4">(optional)</p>
            <p className="text-sm text-gray-600 mb-4">
              Create charges for tenants that are part of this lease
            </p>
            <div className="flex space-x-4">
              <button
                onClick={addRecurringCharge}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>Add recurring charge</span>
              </button>
              <button
                onClick={addOneTimeCharge}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>Add one-time charge</span>
              </button>
            </div>
          </div>

          {/* Resident Center Welcome Email */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Resident Center Welcome Email</h3>
                <p className="text-sm text-gray-600 mt-1">
                  We'll send a welcome email to anyone without Resident Center access. Once they sign in, they can make online payments, view important documents, submit requests, and more!{' '}
                  <button className="text-blue-600 hover:text-blue-800 underline">Learn more</button>
                </p>
              </div>
              <div className="flex items-center">
                <span className="mr-3 text-sm text-gray-700">OFF</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="welcomeEmail"
                    checked={formData.welcomeEmail}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Save
          </button>
          <button
            onClick={handleSaveAndPrepareESignature}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Save and prepare eSignature
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddDraftLease;
