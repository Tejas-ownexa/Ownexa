import React, { useState } from 'react';
import { X, MessageCircle } from 'lucide-react';
import AdminBot from './AdminBot';

const AdminBotModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-end p-1 sm:p-2">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-20 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal - Positioned on right side with extended height */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-2 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-2">
                <MessageCircle className="h-3 w-3" />
              </div>
              <div>
                <h1 className="text-base font-bold">Admin Assistant</h1>
                <p className="text-blue-100 text-sm">AI helper</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              title="Close"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <AdminBot />
        </div>
      </div>
    </div>
  );
};

export default AdminBotModal;
