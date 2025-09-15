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
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Admin Assistant</h1>
                  <p className="text-blue-100 text-base">AI-powered property management helper</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                title="Close"
              >
                <X className="h-6 w-6" />
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
