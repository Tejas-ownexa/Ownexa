import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AddPropertyGroup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const handleCancel = () => {
    navigate('/associations/property-groups');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b">
        <h2 className="text-2xl font-semibold">Add group</h2>
        <button 
          onClick={handleCancel}
          className="text-gray-400 dark:text-gray-500 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-400 dark:text-gray-300"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto p-6">
        <div className="space-y-8">
          {/* Name Field */}
          <div>
            <label className="block font-medium mb-1">Name</label>
            <p className="text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 text-sm mb-2">
              Give your group a clear, memorable name to make searching easy.
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2"
            />
          </div>

          {/* Description Field */}
          <div>
            <label className="block font-medium mb-1">Description (optional)</label>
            <p className="text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 text-sm mb-2">
              Provide extra details to describe how this group should be used.
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 h-32"
            />
          </div>

          {/* Properties Field */}
          <div>
            <label className="block font-medium mb-1">Properties</label>
            <p className="text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 text-sm mb-2">
              Choose the properties you want to include.
            </p>
            <button className="border border-gray-300 dark:border-gray-600 rounded px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900">
              Add properties
            </button>
          </div>

          {/* Privacy Field */}
          <div>
            <label className="block font-medium mb-1">Privacy</label>
            <p className="text-gray-500 dark:text-gray-300 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300 text-sm mb-2">
              Decide if you want to share this group with other staff members or keep it to yourself.
            </p>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span>Make my group private</span>
            </label>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-[#1B3A4B] p-6">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button
            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
            onClick={() => {
              // Handle save logic here
              navigate('/associations/property-groups');
            }}
          >
            Add group
          </button>
          <button
            className="text-white px-4 py-2 hover:text-gray-300"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPropertyGroup;
