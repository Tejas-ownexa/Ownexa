import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus } from 'lucide-react';

const ManageVendorCategories = () => {
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState([
    { id: 1, name: 'Uncategorized', details: 'No vendors are assigned to this category', canDelete: false },
    { id: 2, name: 'Contractors - Dry Wall', details: 'No vendors are assigned to this category', canDelete: true },
    { id: 3, name: 'Contractors - Electrical', details: 'No vendors are assigned to this category', canDelete: true },
    { id: 4, name: 'Contractors - Flooring', details: 'No vendors are assigned to this category', canDelete: true }
  ]);
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const handleDeleteCategory = (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter(cat => cat.id !== categoryId));
    }
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      const newCategory = {
        id: Math.max(...categories.map(c => c.id)) + 1,
        name: newCategoryName.trim(),
        details: 'No vendors are assigned to this category',
        canDelete: true
      };
      setCategories([...categories, newCategory]);
      setNewCategoryName('');
      setIsAddingCategory(false);
    }
  };

  const handleCancel = () => {
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  const handleBack = () => {
    navigate('/maintenance/vendors');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manage vendor categories</h1>
          <div className="flex space-x-3">
            <button
              onClick={() => setIsAddingCategory(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Category</span>
            </button>
            <button
              onClick={handleBack}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Back to Vendors
            </button>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
                  CATEGORY NAME
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
                  DETAILS
                </th>
                <th className="text-right py-4 px-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 text-sm text-gray-900 font-medium">
                    {category.name}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {category.details}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {category.canDelete && (
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        title="Delete category"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              
              {/* Add New Category Row */}
              {isAddingCategory && (
                <tr className="bg-blue-50 border-l-4 border-blue-500">
                  <td className="py-4 px-4">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter category name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddCategory();
                        } else if (e.key === 'Escape') {
                          handleCancel();
                        }
                      }}
                    />
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    No vendors are assigned to this category
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={handleAddCategory}
                        className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                        disabled={!newCategoryName.trim()}
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {categories.length === 0 && !isAddingCategory && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <p>No vendor categories found.</p>
            </div>
            <button
              onClick={() => setIsAddingCategory(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Add Your First Category</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageVendorCategories;
