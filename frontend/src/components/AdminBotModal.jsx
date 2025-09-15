import React, { useState } from 'react';
import { X, MessageCircle } from 'lucide-react';
import AdminBot from './AdminBot';

const AdminBotModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative flex items-center justify-center min-h-screen p-2 sm:p-4 lg:p-6">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-[90vw] lg:max-w-[85vw] xl:max-w-[80vw] h-[95vh] sm:h-[90vh] lg:h-[85vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 sm:p-4 lg:p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-2 sm:mr-3 lg:mr-4">
                  <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">Admin Assistant</h1>
                  <p className="text-blue-100 text-xs sm:text-sm lg:text-base">AI-powered property management helper</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 sm:p-3 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                title="Close"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <AdminBot />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBotModal;
