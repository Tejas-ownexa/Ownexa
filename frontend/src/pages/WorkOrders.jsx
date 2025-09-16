import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ChevronDown, Download, HelpCircle, ChevronUp, Eye, Edit, MoreHorizontal } from 'lucide-react';
import api from '../utils/axios';
import toast from 'react-hot-toast';

// Multi-select dropdown component with checkboxes
const MultiSelectDropdown = ({ label, options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const getDisplayText = () => {
    if (value.length === 0) return placeholder;
    if (value.length === options.length) return `(${value.length}) New, In progress, Comple...`;
    return `(${value.length}) ${options.filter(opt => value.includes(opt.value)).map(opt => opt.label).join(', ')}`;
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.multi-select-dropdown')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative multi-select-dropdown">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full text-left"
      >
        {getDisplayText()}
      </button>
      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="p-2">
            {options.map((option) => (
              <label key={option.value} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                <div className={`flex items-center justify-center w-5 h-5 rounded ${
                  value.includes(option.value) ? 'bg-green-600' : 'bg-gray-200'
                }`}>
                  {value.includes(option.value) && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-gray-700">{option.label}</span>
                <input
                  type="checkbox"
                  checked={value.includes(option.value)}
                  onChange={() => handleToggle(option.value)}
                  className="sr-only"
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const WorkOrders = () => {
  const navigate = useNavigate();
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [selectedStatuses, setSelectedStatuses] = useState(['new', 'pending', 'in_progress', 'completed', 'cancelled', 'on_hold']);
  const [filterOption, setFilterOption] = useState('');
  const [sortBy, setSortBy] = useState('updated');
  const [sortOrder, setSortOrder] = useState('desc');

  // Status options for multi-select dropdown (matching database constraints)
  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'on_hold', label: 'On Hold' }
  ];

  // Fetch work orders
  const { data: workOrders = [], isLoading: workOrdersLoading, error: workOrdersError } = useQuery(
    'work-orders',
    async () => {
      const response = await api.get('/api/work-orders');
      return response.data;
    },
    {
      onError: (error) => {
        console.error('Error fetching work orders:', error);
        toast.error('Failed to load work orders');
      }
    }
  );

  // Fetch properties for filter dropdown
  const { data: properties = [] } = useQuery(
    'properties',
    async () => {
      const response = await api.get('/api/properties');
      return response.data;
    }
  );

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export work orders');
  };

  const handleClearFilters = () => {
    setSelectedProperty('all');
    setSelectedStatuses(['new', 'pending', 'in_progress', 'completed', 'cancelled', 'on_hold']);
    setFilterOption('');
  };

  const handleAddWorkOrder = () => {
    navigate('/maintenance/work-orders/add');
  };

  const handlePrintWorkOrders = () => {
    // TODO: Implement print functionality
    console.log('Print work orders');
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  // Filter and sort work orders
  const filteredAndSortedWorkOrders = useMemo(() => {
    let filtered = workOrders;

    // Filter by property
    if (selectedProperty !== 'all') {
      filtered = filtered.filter(wo => wo.property?.id.toString() === selectedProperty);
    }

    // Filter by status
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(wo => selectedStatuses.includes(wo.status));
    }

    // Apply additional filters
    if (filterOption === 'high-priority') {
      filtered = filtered.filter(wo => wo.priority === 'high' || wo.priority === 'urgent');
    } else if (filterOption === 'overdue') {
      const today = new Date();
      filtered = filtered.filter(wo => wo.due_date && new Date(wo.due_date) < today && wo.status !== 'completed');
    } else if (filterOption === 'unassigned') {
      filtered = filtered.filter(wo => !wo.assigned_vendor && !wo.assigned_to_user);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'updated':
          aValue = new Date(a.last_updated || a.created_at);
          bValue = new Date(b.last_updated || b.created_at);
          break;
        case 'age':
          aValue = a.age_days || 0;
          bValue = b.age_days || 0;
          break;
        case 'due':
          aValue = a.due_date ? new Date(a.due_date) : new Date('9999-12-31');
          bValue = b.due_date ? new Date(b.due_date) : new Date('9999-12-31');
          break;
        case 'priority':
          const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [workOrders, selectedProperty, selectedStatuses, filterOption, sortBy, sortOrder]);

  const getStatusBadge = (status) => {
    const statusStyles = {
      'new': 'bg-blue-100 text-blue-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'on_hold': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityStyles = {
      'urgent': 'bg-red-100 text-red-800',
      'high': 'bg-orange-100 text-orange-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${priorityStyles[priority] || 'bg-gray-100 text-gray-800'}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Work orders</h1>
            <HelpCircle className="h-5 w-5 text-blue-500 cursor-pointer" title="Help" />
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button 
              onClick={handleAddWorkOrder}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Add work order
            </button>
            <button 
              onClick={handlePrintWorkOrders}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Print work orders
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Results */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        {/* Filter Section */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative">
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All properties</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.title || property.property_name || `${property.street_address_1 || property.address}, ${property.city}`}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          <MultiSelectDropdown
            options={statusOptions}
            value={selectedStatuses}
            onChange={setSelectedStatuses}
            placeholder="Select statuses"
          />

          <div className="relative">
            <select
              value={filterOption}
              onChange={(e) => setFilterOption(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Add filter option</option>
              <option value="high-priority">High Priority</option>
              <option value="overdue">Overdue</option>
              <option value="unassigned">Unassigned</option>
              <option value="this-week">This Week</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Results Count and Export */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-2 sm:space-y-0">
          <div className="text-sm text-gray-600">
            {workOrdersLoading ? 'Loading...' : `${filteredAndSortedWorkOrders.length} matches`}
          </div>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  WORK ORDER
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  UNIT
                </th>
                <th 
                  className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('updated')}
                >
                  <div className="flex items-center space-x-1">
                    <span>UPDATED</span>
                    {getSortIcon('updated')}
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AGE
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DUE
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ASSIGNED TO
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PRIORITY
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  VENDOR
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BILL TOTAL
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BILL STATUS
                </th>
              </tr>
            </thead>
            <tbody>
              {workOrdersLoading ? (
                <tr>
                  <td colSpan="11" className="text-center py-12 text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Loading work orders...</span>
                    </div>
                  </td>
                </tr>
              ) : workOrdersError ? (
                <tr>
                  <td colSpan="11" className="text-center py-12 text-red-500">
                    <div className="space-y-2">
                      <p>Failed to load work orders. Please try again.</p>
                      <button 
                        onClick={() => window.location.reload()}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Refresh page
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredAndSortedWorkOrders.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center py-12 text-gray-500">
                    <div className="space-y-2">
                      <p>We didn't find any work orders. Maybe you don't have any or maybe you need to{' '}
                        <button 
                          onClick={handleClearFilters}
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          clear your filters
                        </button>
                        .
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedWorkOrders.map((workOrder) => (
                  <tr key={workOrder.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {workOrder.work_order_number || `WO-${workOrder.id.toString().padStart(6, '0')}`}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {workOrder.title}
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button 
                            onClick={() => {
                              // TODO: Add view work order functionality
                              console.log('View work order:', workOrder.id);
                            }}
                            className="p-1 text-blue-600 hover:text-blue-800 transition-colors" 
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => {
                              // TODO: Add edit work order functionality
                              console.log('Edit work order:', workOrder.id);
                            }}
                            className="p-1 text-green-600 hover:text-green-800 transition-colors" 
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => {
                              // TODO: Add more options menu functionality
                              console.log('More options for work order:', workOrder.id);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors" 
                            title="More options"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {workOrder.property?.title || workOrder.property?.address || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {workOrder.last_updated ? new Date(workOrder.last_updated).toLocaleDateString() : 
                       workOrder.created_at ? new Date(workOrder.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {workOrder.age_days ? `${workOrder.age_days} days` : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(workOrder.status)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {workOrder.due_date ? new Date(workOrder.due_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {workOrder.assigned_to_user?.full_name || workOrder.assigned_vendor?.display_name || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4">
                      {getPriorityBadge(workOrder.priority)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {workOrder.assigned_vendor?.display_name || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {workOrder.bill_total ? `$${parseFloat(workOrder.bill_total).toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {workOrder.bill_status ? workOrder.bill_status.charAt(0).toUpperCase() + workOrder.bill_status.slice(1) : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WorkOrders;
