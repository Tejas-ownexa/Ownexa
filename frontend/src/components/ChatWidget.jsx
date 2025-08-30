import React, { useState } from 'react';
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AdminBot from './AdminBot';

const ChatWidget = () => {
  const { user, is_admin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Don't render if user is not authenticated or not an admin user
  if (!user || !is_admin) {
    return null;
  }

  const toggleChat = () => {
    if (isOpen && isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const minimizeChat = () => {
    setIsMinimized(true);
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Widget */}
      {isOpen && (
        <div className={`bg-white rounded-lg shadow-2xl border border-gray-200 transition-all duration-300 ${
          isMinimized ? 'w-80 h-12' : 'w-96 h-[600px]'
        }`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-2">
                🤖
              </div>
              <div>
                <h3 className="text-sm font-semibold">Admin Assistant</h3>
                <p className="text-xs text-blue-100">AI-powered property management helper</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={minimizeChat}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                title="Minimize"
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button
                onClick={closeChat}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <div className="h-[548px]">
              <AdminBot />
            </div>
          )}
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={toggleChat}
        className={`bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 ${
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        title="Chat with Admin Assistant"
      >
        <MessageCircle size={24} />
      </button>
    </div>
  );
};

export default ChatWidget;
