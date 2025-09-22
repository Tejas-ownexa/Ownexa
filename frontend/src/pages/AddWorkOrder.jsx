import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { ChevronDown, Plus, X } from 'lucide-react';
import api from '../utils/axios';
import toast from 'react-hot-toast';

const AddWorkOrder = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    // Property and basic details
    property: '',
    subject: '',
    category: '',
    vendor: '',
    
    // Work details
    workToBePerformed: '',
    entryDetails: '',
    entryContact: '',
    
    // Status and scheduling
    status: 'new',
    priority: 'normal',
    dueDate: '',
    
    // Cost tracking
    estimatedCost: '',
    workHours: ''
  });

  const [selectedRentalOwner, setSelectedRentalOwner] = useState(null);

  const [files, setFiles] = useState([]);

  // Fetch properties
  const { data: properties = [], isLoading: propertiesLoading } = useQuery(
    'properties',
    async () => {
      try {
        const response = await api.get('/api/properties');
        return response.data || [];
      } catch (error) {
        console.error('Error fetching properties:', error);
        return [];
      }
    }
  );

  // Fetch vendors
  const { data: vendors = [], isLoading: vendorsLoading } = useQuery(
    'vendors',
    async () => {
      try {
        const response = await api.get('/api/vendors');
        return response.data || [];
      } catch (error) {
        console.error('Error fetching vendors:', error);
        return [];
      }
    }
  );

  // Fetch vendor categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery(
    'vendor-categories',
    async () => {
      try {
        const response = await api.get('/api/vendors/categories');
        return response.data || [];
      } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
    }
  );

  // Create work order mutation
  const createWorkOrderMutation = useMutation(
    async (workOrderData) => {
      const response = await api.post('/api/work-orders', workOrderData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success('Work order created successfully!');
        queryClient.invalidateQueries('work-orders');
        navigate('/maintenance/work-orders');
      },
      onError: (error) => {
        console.error('Error creating work order:', error);
        toast.error(error.response?.data?.error || 'Failed to create work order');
      }
    }
  );

  const handleInputChange = (field, value) => {
    if (field === 'property') {
      // Find the selected property and get its rental owner
      const selectedProperty = properties.find(p => p.id.toString() === value);
      if (selectedProperty && selectedProperty.rental_owner) {
        setSelectedRentalOwner(selectedProperty.rental_owner);
      } else {
        setSelectedRentalOwner(null);
      }
      // Reset category and vendor when property changes
      setFormData(prev => ({ 
        ...prev, 
        [field]: value, 
        category: '', 
        vendor: '' 
      }));
    } else if (field === 'category') {
      // Reset vendor when category changes
      setFormData(prev => ({ 
        ...prev, 
        [field]: value, 
        vendor: '' 
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };


  // Filter vendors based on rental owner and category
  const getFilteredVendors = () => {
    if (!selectedRentalOwner || !formData.category) {
      return vendors;
    }
    
    return vendors.filter(vendor => {
      // Check if vendor is assigned to the selected rental owner
      const isAssignedToRentalOwner = vendor.rental_owner && 
        vendor.rental_owner.id.toString() === selectedRentalOwner.id.toString();
      
      // Check if vendor belongs to the selected category
      const isInSelectedCategory = vendor.category && 
        vendor.category.id.toString() === formData.category;
      
      return isAssignedToRentalOwner && isInSelectedCategory;
    });
  };

  const handleAddFile = () => {
    // TODO: Implement file upload
    console.log('Add file clicked');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.property || !formData.subject || !formData.vendor || !formData.workToBePerformed) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Prepare work order data
    const workOrderData = {
      property_id: parseInt(formData.property),
      title: formData.subject,
      description: formData.workToBePerformed,
      category: formData.category,
      assigned_vendor_id: parseInt(formData.vendor),
      priority: formData.priority,
      status: formData.status,
      due_date: formData.dueDate || null,
      estimated_cost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : null,
      work_hours: formData.workHours ? parseFloat(formData.workHours) : null,
      entry_details: formData.entryDetails || null,
      entry_contact: formData.entryContact || null,
      notes: null // Can be added later if needed
    };

    // Create the work order
    createWorkOrderMutation.mutate(workOrderData);
  };

  const handleCancel = () => {
    navigate('/maintenance/work-orders');
  };

  const handleAddAnotherWorkOrder = () => {
    // Reset form data
    setFormData({
      property: '',
      subject: '',
      category: '',
      vendor: '',
      workToBePerformed: '',
      entryDetails: '',
      entryContact: '',
      status: 'new',
      priority: 'normal',
      dueDate: '',
      estimatedCost: '',
      workHours: ''
    });
    setSelectedRentalOwner(null);
    toast.success('Form reset. You can create another work order.');
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
          {/* Basic Information Section */}
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
            
            {/* Property and Subject */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    disabled={propertiesLoading}
                  >
                    <option value="">{propertiesLoading ? 'Loading properties...' : 'Select property'}</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.title || property.property_name || property.name || `${property.street_address_1 || property.address}, ${property.city}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SUBJECT (REQUIRED)
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the work needed"
                  required
                />
              </div>
            </div>

            {/* Rental Owner Display */}
            {selectedRentalOwner && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">Rental Owner</h3>
                    <p className="text-sm text-blue-700">
                      {selectedRentalOwner.company_name || selectedRentalOwner.contact_person || 'Unknown Owner'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Category and Vendor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CATEGORY
                </label>
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    disabled={categoriesLoading}
                  >
                    <option value="">{categoriesLoading ? 'Loading categories...' : 'Select category'}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

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
                    disabled={vendorsLoading || !selectedRentalOwner || !formData.category}
                  >
                    <option value="">
                      {vendorsLoading ? 'Loading vendors...' : 
                       !selectedRentalOwner ? 'Select property first' :
                       !formData.category ? 'Select category first' :
                       'Select vendor'}
                    </option>
                    {getFilteredVendors().length > 0 ? (
                      getFilteredVendors().map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.company_name || `${vendor.first_name} ${vendor.last_name}`}
                        </option>
                      ))
                    ) : (
                      selectedRentalOwner && formData.category && (
                        <option value="" disabled>
                          No vendors found for this rental owner and category
                        </option>
                      )
                    )}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Work Details Section */}
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900">Work Details</h2>
            
            {/* Work to be performed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WORK TO BE PERFORMED (REQUIRED)
              </label>
              <textarea
                value={formData.workToBePerformed}
                onChange={(e) => handleInputChange('workToBePerformed', e.target.value)}
                placeholder="Describe the work that needs to be done..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
              />
            </div>

            {/* Entry Details and Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <option value="">Select entry contact</option>
                    <option value="property-manager">Property Manager</option>
                    <option value="tenant">Tenant</option>
                    <option value="maintenance-staff">Maintenance Staff</option>
                    <option value="landlord">Landlord</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Status and Scheduling Section */}
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900">Status & Scheduling</h2>
            
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
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
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
                />
              </div>
            </div>
          </div>

          {/* Cost Tracking Section */}
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900">Cost Tracking</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ESTIMATED COST
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.estimatedCost}
                    onChange={(e) => handleInputChange('estimatedCost', e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ESTIMATED HOURS
                </label>
                <input
                  type="number"
                  value={formData.workHours}
                  onChange={(e) => handleInputChange('workHours', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  step="0.5"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Files Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Attachments</h2>
            <button
              type="button"
              onClick={handleAddFile}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add files (photos, documents, etc.)</span>
            </button>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t">
            <button
              type="submit"
              disabled={createWorkOrderMutation.isLoading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createWorkOrderMutation.isLoading ? 'Creating...' : 'Create work order'}
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
