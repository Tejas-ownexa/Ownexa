import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Plus, X } from 'lucide-react';

const AddWorkOrder = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    // Task details
    addToTask: 'create-new-task',
    property: '',
    existingTask: '',
    taskType: '',
    category: '',
    assignedTo: '',
    collaborators: '',
    
    // Work order details
    subject: '',
    vendor: '',
    entryDetails: '',
    entryContact: '',
    workToBePerformed: '',
    vendorNotes: '',
    
    // Status and scheduling
    status: 'new',
    priority: 'normal',
    dueDate: '',
    
    // Parts and labor
    workHours: '',
    chargeHoursTo: '',
    parts: [
      { qty: '', account: '', description: '', price: '', total: '$0.00' }
    ]
  });

  const [files, setFiles] = useState([]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePartChange = (index, field, value) => {
    const newParts = [...formData.parts];
    newParts[index] = { ...newParts[index], [field]: value };
    
    // Calculate total for this row
    if (field === 'qty' || field === 'price') {
      const qty = parseFloat(newParts[index].qty) || 0;
      const price = parseFloat(newParts[index].price) || 0;
      newParts[index].total = `$${(qty * price).toFixed(2)}`;
    }
    
    setFormData(prev => ({ ...prev, parts: newParts }));
  };

  const addPart = () => {
    setFormData(prev => ({
      ...prev,
      parts: [...prev.parts, { qty: '', account: '', description: '', price: '', total: '$0.00' }]
    }));
  };

  const removePart = (index) => {
    if (formData.parts.length > 1) {
      setFormData(prev => ({
        ...prev,
        parts: prev.parts.filter((_, i) => i !== index)
      }));
    }
  };

  const getTotalAmount = () => {
    return formData.parts.reduce((total, part) => {
      const amount = parseFloat(part.total.replace('$', '')) || 0;
      return total + amount;
    }, 0).toFixed(2);
  };

  const handleAddFile = () => {
    // TODO: Implement file upload
    console.log('Add file clicked');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement form submission
    console.log('Work order data:', formData);
  };

  const handleCancel = () => {
    navigate('/maintenance/work-orders');
  };

  const handleAddAnotherWorkOrder = () => {
    // TODO: Implement add another work order
    console.log('Add another work order');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add work order</h1>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Task Details Section */}
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900">Task details</h2>
            
            {/* Add to Task */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ADD TO TASK
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="addToTask"
                    value="create-new-task"
                    checked={formData.addToTask === 'create-new-task'}
                    onChange={(e) => handleInputChange('addToTask', e.target.value)}
                    className="mr-2"
                  />
                  Create new task
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="addToTask"
                    value="add-to-existing"
                    checked={formData.addToTask === 'add-to-existing'}
                    onChange={(e) => handleInputChange('addToTask', e.target.value)}
                    className="mr-2"
                  />
                  Add to existing task
                </label>
              </div>
            </div>

            {/* Additional fields when "Add to existing task" is selected */}
            {formData.addToTask === 'add-to-existing' && (
              <div className="space-y-6 bg-gray-50 p-4 rounded-lg">
                {/* Property Required */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PROPERTY (REQUIRED)
                  </label>
                  <div className="relative">
                    <select
                      value={formData.property}
                      onChange={(e) => handleInputChange('property', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                      required
                    >
                      <option value="">Select property</option>
                      <option value="property1">123 Main Street</option>
                      <option value="property2">456 Oak Avenue</option>
                      <option value="property3">789 Pine Road</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Add to Task (Required) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ADD TO TASK (REQUIRED)
                  </label>
                  <div className="relative">
                    <select
                      value={formData.existingTask}
                      onChange={(e) => handleInputChange('existingTask', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                      required
                    >
                      <option value="">Select existing task</option>
                      <option value="task1">Routine Maintenance - Q1</option>
                      <option value="task2">Emergency Repairs</option>
                      <option value="task3">Annual Inspections</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            {/* Task Type and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TASK TYPE
                </label>
                <div className="relative">
                  <select
                    value={formData.taskType}
                    onChange={(e) => handleInputChange('taskType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    <option value="">Select task type</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="repair">Repair</option>
                    <option value="inspection">Inspection</option>
                    <option value="emergency">Emergency</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CATEGORY
                </label>
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    <option value="">Select category</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="hvac">HVAC</option>
                    <option value="general">General</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Assigned To and Collaborators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ASSIGNED TO (REQUIRED)
                </label>
                <div className="relative">
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    required
                  >
                    <option value="">Team Owner</option>
                    <option value="john-doe">John Doe</option>
                    <option value="jane-smith">Jane Smith</option>
                    <option value="maintenance-team">Maintenance Team</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  COLLABORATORS
                </label>
                <div className="relative">
                  <select
                    value={formData.collaborators}
                    onChange={(e) => handleInputChange('collaborators', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    <option value="">Select collaborators</option>
                    <option value="team-alpha">Team Alpha</option>
                    <option value="team-beta">Team Beta</option>
                    <option value="external-contractor">External Contractor</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Work Order Details Section */}
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900">Work order details</h2>
            
            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SUBJECT (REQUIRED)
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Vendor and Entry Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  VENDOR (REQUIRED)
                </label>
                <div className="relative">
                  <select
                    value={formData.vendor}
                    onChange={(e) => handleInputChange('vendor', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    required
                  >
                    <option value="">Select or add new...</option>
                    <option value="abc-plumbing">ABC Plumbing</option>
                    <option value="xyz-electrical">XYZ Electrical</option>
                    <option value="pro-maintenance">Pro Maintenance</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ENTRY DETAILS
                </label>
                <div className="relative">
                  <select
                    value={formData.entryDetails}
                    onChange={(e) => handleInputChange('entryDetails', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    <option value="">Select entry preference</option>
                    <option value="no-entry-needed">No entry needed</option>
                    <option value="key-available">Key available</option>
                    <option value="tenant-present">Tenant must be present</option>
                    <option value="coordinate-entry">Coordinate entry</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Entry Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ENTRY CONTACT
              </label>
              <div className="relative">
                <select
                  value={formData.entryContact}
                  onChange={(e) => handleInputChange('entryContact', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="">Select entry contact...</option>
                  <option value="property-manager">Property Manager</option>
                  <option value="tenant">Tenant</option>
                  <option value="maintenance-staff">Maintenance Staff</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Work to be performed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WORK TO BE PERFORMED
              </label>
              <textarea
                value={formData.workToBePerformed}
                onChange={(e) => handleInputChange('workToBePerformed', e.target.value)}
                placeholder="Tell the vendor what you need done"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Vendor Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                VENDOR NOTES
              </label>
              <textarea
                value={formData.vendorNotes}
                onChange={(e) => handleInputChange('vendorNotes', e.target.value)}
                placeholder="Add any notes from vendors here"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Status, Priority, Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  STATUS
                </label>
                <div className="relative">
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    <option value="new">New</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="deferred">Deferred</option>
                    <option value="closed">Closed</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PRIORITY
                </label>
                <div className="relative">
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DUE DATE
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="mm/dd/yyyy"
                />
              </div>
            </div>
          </div>

          {/* Files Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Files</h2>
            <button
              type="button"
              onClick={handleAddFile}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add files</span>
            </button>
          </div>

          {/* Work Order Details - Hours and Parts */}
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900">Work order details</h2>
            
            {/* Work Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WORK HOURS
                </label>
                <input
                  type="number"
                  value={formData.workHours}
                  onChange={(e) => handleInputChange('workHours', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.5"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CHARGE HOURS TO
                </label>
                <input
                  type="text"
                  value={formData.chargeHoursTo}
                  onChange={(e) => handleInputChange('chargeHoursTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Parts and Labor Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Parts and labor</h2>
            
            {/* Table Header */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      QTY
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ACCOUNT
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DESCRIPTION
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      PRICE
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      TOTAL
                    </th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.parts.map((part, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={part.qty}
                          onChange={(e) => handlePartChange(index, 'qty', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          min="0"
                          step="1"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={part.account}
                          onChange={(e) => handlePartChange(index, 'account', e.target.value)}
                          placeholder="Type or select an account"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={part.description}
                          onChange={(e) => handlePartChange(index, 'description', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                          <input
                            type="number"
                            value={part.price}
                            onChange={(e) => handlePartChange(index, 'price', e.target.value)}
                            className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-900">{part.total}</span>
                      </td>
                      <td className="py-3 px-4">
                        {formData.parts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePart(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Row and Total */}
            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={addPart}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add row</span>
              </button>
              
              <div className="text-right">
                <div className="text-sm text-gray-600">Total</div>
                <div className="text-lg font-semibold">${getTotalAmount()}</div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t">
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Create work order
            </button>
            <button
              type="button"
              onClick={handleAddAnotherWorkOrder}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Add another work order
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWorkOrder;
