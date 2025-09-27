import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'react-query';
import api from '../utils/axios';
import { MessageCircle, Send, Bot, User, Wrench, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const MaintenanceChatbot = ({ isOpen, onClose, userProperties = [] }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [context, setContext] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef(null);

  // Check Ollama status
  const { data: ollamaStatus } = useQuery(
    ['ollama-status'],
    async () => {
      const response = await api.get('/api/chatbot/ollama-status');
      return response.data;
    },
    {
      retry: 3,
      retryDelay: 1000,
    }
  );

  // Chat mutation
  const chatMutation = useMutation(
    async (data) => {
      const response = await api.post('/api/chatbot/chat', data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        setMessages(data.conversation_history || []);
        setContext(data.context || []);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to send message');
      },
    }
  );

  // Submit maintenance request mutation
  const submitRequestMutation = useMutation(
    async (data) => {
      const response = await api.post('/api/chatbot/submit-from-chat', data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success(data.message);
        
        // Create detailed success message based on vendor assignment
        let successMessage = `✅ Great! I've successfully submitted your maintenance request (ID: ${data.request_id}).`;
        
        // Add tenant information summary
        if (data.tenant_info) {
          const tenant = data.tenant_info;
          successMessage += `\n\n👤 **Your Information:**\n` +
            `**Name:** ${tenant.full_name}\n` +
            `**Phone:** ${tenant.phone_number}\n` +
            `**Location:** ${tenant.property_location?.full_address || 'Not specified'}\n` +
            `**Lease Status:** ${tenant.lease_status?.toUpperCase() || 'Unknown'}`;
          
          if (tenant.lease_status === 'active' && tenant.days_until_lease_expiry !== null) {
            successMessage += ` (${tenant.days_until_lease_expiry} days remaining)`;
          }
        }
        
        if (data.auto_assigned_vendor) {
          successMessage += `\n\n🔧 **Auto-Assigned Vendor:**\n` +
            `**${data.auto_assigned_vendor.vendor_name}** (${data.auto_assigned_vendor.vendor_type})\n` +
            `📞 ${data.auto_assigned_vendor.phone}\n` +
            `📧 ${data.auto_assigned_vendor.email}\n\n` +
            `The vendor will be notified and should contact you soon!`;
        } else if (data.vendor_type_detected && data.vendor_type_detected !== 'general') {
          successMessage += `\n\n🤖 **AI Analysis:** Detected as ${data.vendor_type_detected} issue`;
          if (data.assignment_note) {
            successMessage += `\n⚠️ ${data.assignment_note}`;
          } else {
            successMessage += `\nYour property manager will assign a ${data.vendor_type_detected} to this request.`;
          }
        } else {
          successMessage += `\nYour property manager will review it and get back to you soon.`;
        }
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          message: successMessage,
          timestamp: new Date().toISOString()
        }]);
        setIsSubmitting(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to submit maintenance request');
        setIsSubmitting(false);
      },
    }
  );

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Start conversation
      setMessages([{
        role: 'assistant',
        message: "Hi! I'm your AI maintenance assistant. I'm here to help you report any maintenance issues with your property. What seems to be the problem?",
        timestamp: new Date().toISOString()
      }]);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    if (!selectedProperty) {
      toast.error('Please select a property first');
      return;
    }

    const messageData = {
      message: inputMessage,
      context: context,
      conversation_history: messages
    };

    chatMutation.mutate(messageData);
    setInputMessage('');
  };

  const handleSubmitRequest = () => {
    if (!selectedProperty) {
      toast.error('Please select a property first');
      return;
    }

    if (messages.length < 2) {
      toast.error('Please have a conversation about the maintenance issue first');
      return;
    }

    setIsSubmitting(true);
    submitRequestMutation.mutate({
      conversation_history: messages,
      property_id: parseInt(selectedProperty)
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  const isOllamaOffline = ollamaStatus?.status !== 'running';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl h-3/4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Bot className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              AI Maintenance Assistant
            </h3>
            {isOllamaOffline && (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-300 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Property Selection */}
        {userProperties.length > 0 && (
          <div className="p-4 border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Property
            </label>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a property...</option>
              {userProperties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.title} - {property.street_address_1}, {property.city}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status Messages */}
        {isOllamaOffline && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-sm text-red-700">
                AI service is offline. Please make sure Ollama is running with Llama 3.2 model.
              </span>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.role === 'assistant' && (
                    <Bot className="h-4 w-4 mt-0.5 text-blue-600" />
                  )}
                  {message.role === 'user' && (
                    <User className="h-4 w-4 mt-0.5 text-blue-100" />
                  )}
                  <div>
                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-300'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {chatMutation.isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4 text-blue-600" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Submit Button */}
        {messages.length > 2 && selectedProperty && (
          <div className="px-4 py-2 border-t border-gray-200">
            <button
              onClick={handleSubmitRequest}
              disabled={isSubmitting || submitRequestMutation.isLoading}
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || submitRequestMutation.isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting Request...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Submit Maintenance Request</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isOllamaOffline 
                  ? "AI service is offline..." 
                  : "Describe your maintenance issue..."
              }
              disabled={isOllamaOffline || chatMutation.isLoading}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows="3"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isOllamaOffline || chatMutation.isLoading || !selectedProperty}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          
          {!selectedProperty && userProperties.length > 0 && (
            <p className="text-xs text-red-600 mt-1">Please select a property first</p>
          )}
          
          {isOllamaOffline && (
            <p className="text-xs text-red-600 mt-1">
              To use AI assistant: Install Ollama and run "ollama pull llama3.2"
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceChatbot; 