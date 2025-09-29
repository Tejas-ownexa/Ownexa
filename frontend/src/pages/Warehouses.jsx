import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { Plus, Warehouse, MapPin, DollarSign, Edit, Trash2, Eye, Search, Filter } from 'lucide-react';
import api from '../utils/axios';
import toast from 'react-hot-toast';

const Warehouses = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch warehouses
  const { data: warehouses, isLoading, error } = useQuery(
    ['warehouses'],
    async () => {
      const response = await api.get('/api/warehouses/');
      return response.data;
    }
  );

  // Delete warehouse mutation
  const deleteWarehouseMutation = useMutation(
    async (warehouseId) => {
      const response = await api.delete(`/api/warehouses/${warehouseId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Warehouse deleted successfully!');
        queryClient.invalidateQueries(['warehouses']);
      },
      onError: (error) => {
        toast.error('Failed to delete warehouse');
        console.error('Error deleting warehouse:', error);
      }
    }
  );

  const handleDeleteWarehouse = (warehouseId, warehouseName) => {
    if (window.confirm(`Are you sure you want to delete "${warehouseName}"?`)) {
      deleteWarehouseMutation.mutate(warehouseId);
    }
  };

  // Filter warehouses based on search and status
  const filteredWarehouses = warehouses?.filter(warehouse => {
    const matchesSearch = warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warehouse.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warehouse.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || warehouse.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading warehouses...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="text-red-600 dark:text-red-400 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Warehouses</h2>
            <p className="text-gray-600 dark:text-gray-300">Please try refreshing the page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                <Warehouse className="h-8 w-8 mr-3 text-orange-600" />
                Warehouses
              </h1>
              <p className="text-gray-600 dark:text-gray-300">Manage your warehouse properties</p>
            </div>
            <Link
              to="/add-warehouse"
              className="btn-primary flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
            >
              <Plus className="h-5 w-5" />
              <span>Add Warehouse</span>
            </Link>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search warehouses by name, address, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
        </div>

        {/* Warehouses Grid */}
        {filteredWarehouses.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <Warehouse className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No warehouses found' : 'No warehouses yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first warehouse.'
              }
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <Link
                to="/add-warehouse"
                className="btn-primary inline-flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
              >
                <Plus className="h-5 w-5" />
                <span>Add Your First Warehouse</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWarehouses.map((warehouse) => (
              <div key={warehouse.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {warehouse.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{warehouse.city}, {warehouse.state}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(warehouse.status)}`}>
                      {warehouse.status}
                    </span>
                  </div>

                  {/* Description */}
                  {warehouse.description && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                      {warehouse.description}
                    </p>
                  )}

                  {/* Warehouse Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Square Feet:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {warehouse.total_square_feet?.toLocaleString()} sq ft
                      </span>
                    </div>
                    
                    {warehouse.purchase_price && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Purchase Price:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(warehouse.purchase_price)}
                        </span>
                      </div>
                    )}
                    
                    {warehouse.total_value && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Current Value:</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(warehouse.total_value)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Financial Summary */}
                  {(warehouse.mortgage_amount || warehouse.down_payment) && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                      <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <DollarSign className="h-4 w-4 mr-1" />
                        Financial Summary
                      </div>
                      <div className="space-y-1 text-xs">
                        {warehouse.down_payment && (
                          <div className="flex justify-between">
                            <span>Down Payment:</span>
                            <span>{formatCurrency(warehouse.down_payment)}</span>
                          </div>
                        )}
                        {warehouse.mortgage_amount && (
                          <div className="flex justify-between">
                            <span>Mortgage:</span>
                            <span>{formatCurrency(warehouse.mortgage_amount)}</span>
                          </div>
                        )}
                        {warehouse.interest_rate && (
                          <div className="flex justify-between">
                            <span>Interest Rate:</span>
                            <span>{(warehouse.interest_rate * 100).toFixed(2)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDeleteWarehouse(warehouse.id, warehouse.name)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete warehouse"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Added {new Date(warehouse.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {filteredWarehouses.length > 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {filteredWarehouses.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Total Warehouses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {filteredWarehouses.filter(w => w.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {filteredWarehouses.reduce((sum, w) => sum + (w.total_square_feet || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Total Sq Ft</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(filteredWarehouses.reduce((sum, w) => sum + (w.total_value || 0), 0))}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Total Value</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Warehouses;
