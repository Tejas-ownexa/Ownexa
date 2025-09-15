import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-hot-toast';
import api from '../utils/axios';

const AdminBot = () => {
  // Default welcome message
  const defaultWelcomeMessage = {
    role: 'assistant',
    message: `🤖 **Hello! I'm your AI-powered Admin Assistant.**

I can help you with comprehensive property management queries and generate detailed reports:

🎯 **REPORT GENERATION:**
• **"Generate a tenant report"** - Comprehensive tenant analysis
• **"Create a financial report"** - Portfolio financial analysis
• **"Show me a property report"** - Property performance overview
• **"Generate a maintenance report"** - Maintenance request summary

💬 **DATA QUERIES:**
• **"Show me my tenants"** - List all tenants with details
• **"List my properties"** - View all properties and status
• **"What maintenance requests do I have?"** - View repair orders
• **"Show me my vendors"** - List all service providers
• **"Display work orders"** - View all work orders
• **"List rental owners"** - Show property owners
• **"Show associations"** - View HOA/associations

📊 **ANALYTICS & INSIGHTS:**
• **"Property performance analytics"** - Get performance metrics
• **"Financial summary"** - View income and expenses
• **"Occupancy rates"** - Check property occupancy
• **"Maintenance trends"** - Analyze repair patterns

🔍 **SEARCH & FILTER:**
• **"Find John Smith"** - Search for specific tenants
• **"Show active tenants only"** - Filter by status
• **"Which properties are vacant?"** - Filter vacant units
• **"Compare properties"** - Compare property performance

💡 **EXAMPLES:**
• "Show me all tenants with rent over $2000"
• "Generate a comprehensive financial report"
• "What's my property performance this month?"
• "Find all pending maintenance requests"
• "Compare occupancy rates across properties"

Just ask me anything about your property management in natural language! 🏘️✨`,
    timestamp: new Date().toISOString(),
    type: 'help'
  };

  // Load conversation history from localStorage
  const loadConversationHistory = () => {
    try {
      const savedMessages = localStorage.getItem('adminBotConversation');
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        // Ensure we have at least the welcome message
        if (parsedMessages.length === 0) {
          return [defaultWelcomeMessage];
        }
        return parsedMessages;
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
    return [defaultWelcomeMessage];
  };

  // Save conversation history to localStorage
  const saveConversationHistory = (messages) => {
    try {
      // Only save the last 50 messages to prevent localStorage from getting too large
      const messagesToSave = messages.slice(-50);
      localStorage.setItem('adminBotConversation', JSON.stringify(messagesToSave));
    } catch (error) {
      console.error('Error saving conversation history:', error);
    }
  };

  // Clear conversation history
  const clearConversationHistory = () => {
    try {
      localStorage.removeItem('adminBotConversation');
      setMessages([defaultWelcomeMessage]);
      setConversationContext([]);
      toast.success('Conversation history cleared!');
    } catch (error) {
      console.error('Error clearing conversation history:', error);
      toast.error('Failed to clear conversation history');
    }
  };

  const [messages, setMessages] = useState(loadConversationHistory);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationContext, setConversationContext] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save conversation history whenever messages change
  useEffect(() => {
    if (messages.length > 1) { // Don't save if only welcome message
      saveConversationHistory(messages);
    }
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation(
    async (query) => {
      console.log('Sending query to AI admin bot:', query);
      console.log('Conversation context:', conversationContext);
      try {
        const response = await api.post('/api/admin-bot/admin-chat', { 
          query,
          context: conversationContext 
        });
        console.log('AI admin bot response:', response.data);
        return response.data;
      } catch (error) {
        console.error('AI admin bot error:', error);
        console.error('Error response:', error.response?.data);
        throw error;
      }
    },
    {
      onSuccess: (data) => {
        // Ensure we have a valid response
        const responseMessage = data.response || 'No response received from the assistant.';
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          message: responseMessage,
          timestamp: new Date().toISOString(),
          type: data.type || 'success',
          data: data.data,
          intent: data.intent,
          confidence: data.confidence,
          pdfAvailable: data.pdf_available,
          pdfInfo: data.pdf_info
        }]);
        
        // Update conversation context if provided
        if (data.context) {
          setConversationContext(data.context);
        }
        
        setIsLoading(false);
      },
      onError: (error) => {
        console.error('Detailed error:', error);
        console.error('Error response:', error.response);
        console.error('Error message:', error.message);
        
        let errorMessage = 'Failed to get response from admin bot';
        
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Request timed out. Please try again.';
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast.error(errorMessage);
        setMessages(prev => [...prev, {
          role: 'assistant',
          message: `❌ **Error**: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`,
          timestamp: new Date().toISOString(),
          type: 'error'
        }]);
        setIsLoading(false);
      },
    }
  );

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!currentMessage.trim() || isLoading) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    setIsLoading(true);

    // Add user message to chat
    setMessages(prev => [...prev, {
      role: 'user',
      message: userMessage,
      timestamp: new Date().toISOString()
    }]);

    // Send to backend
    sendMessageMutation.mutate(userMessage);
  };

  const formatMessage = (message) => {
    // Handle null or undefined messages
    if (!message || typeof message !== 'string') {
      return <div className="text-gray-500 italic">No message content available</div>;
    }
    
    // Convert markdown-style formatting to JSX
    return message
      .split('\n')
      .map((line, index) => {
        // Bold text
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Handle PDF download links
        if (line.includes('[Click here to download PDF]')) {
          const match = line.match(/\[Click here to download PDF\]\(([^)]+)\)/);
          if (match) {
            const downloadUrl = match[1];
            return (
              <div key={index} className="mb-3">
                <span dangerouslySetInnerHTML={{ __html: line.replace(/\[Click here to download PDF\]\([^)]+\)/, '') }} />
                <button
                  onClick={() => handlePDFDownload(downloadUrl)}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </button>
              </div>
            );
          }
        }
        
        // Handle different line types with improved styling
        if (line.startsWith('•')) {
          return (
            <div key={index} className="ml-4 mb-2 flex items-start">
              <span className="text-blue-500 mr-2 mt-1">•</span>
              <span dangerouslySetInnerHTML={{ __html: line.replace('•', '') }} />
            </div>
          );
        } else if (line.startsWith('🔸') || line.startsWith('   ')) {
          return (
            <div key={index} className="ml-6 mb-1 text-sm text-gray-600 flex items-start">
              <span className="text-gray-400 mr-2 mt-1">◦</span>
              <span dangerouslySetInnerHTML={{ __html: line.replace('🔸', '').replace('   ', '') }} />
            </div>
          );
        } else if (line.trim() === '') {
          return <br key={index} />;
        } else if (line.startsWith('📄') || line.startsWith('📥') || line.startsWith('🎯') || line.startsWith('💬') || line.startsWith('📊') || line.startsWith('🔍') || line.startsWith('💡')) {
          // Handle emoji headers with special styling
          return (
            <div key={index} className="mb-2 mt-3">
              <span className="text-lg font-semibold text-gray-800" dangerouslySetInnerHTML={{ __html: line }} />
            </div>
          );
        } else {
          return (
            <div key={index} className="mb-1">
              <span dangerouslySetInnerHTML={{ __html: line }} />
            </div>
          );
        }
      });
  };

  const getMessageTypeColor = (type) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'help':
        return 'bg-blue-50 border-blue-200';
      case 'clarification':
        return 'bg-yellow-50 border-yellow-200';
      case 'success':
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const quickQuestions = [
    "Show me my tenants",
    "List my properties", 
    "What maintenance requests do I have?",
    "Show me my vendors",
    "Display work orders",
    "List rental owners",
    "Show associations",
    "Property performance analytics",
    "Financial summary",
    "Occupancy rates",
    "Generate tenant report",
    "Generate financial report",
    "Generate property report",
    "Generate maintenance report"
  ];

  const handleQuickQuestion = (question) => {
    setCurrentMessage(question);
  };

  const handlePDFDownload = async (downloadUrl) => {
    try {
      console.log('Downloading PDF from:', downloadUrl);
      
      // Extract filename from URL
      const filename = downloadUrl.split('/').pop();
      
      const response = await api.get(downloadUrl, {
        responseType: 'blob'
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF downloaded successfully!');
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* History and Clear Button */}
      <div className="flex-shrink-0 bg-gray-50 border-b p-2 sm:p-3 lg:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-600">
              {messages.length > 1 ? `${messages.length - 1} messages saved` : 'No history'}
            </span>
          </div>
          <button
            onClick={clearConversationHistory}
            className="px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-2 text-xs sm:text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1 sm:gap-2"
            disabled={isLoading || messages.length <= 1}
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="hidden sm:inline">Clear History</span>
            <span className="sm:hidden">Clear</span>
          </button>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="flex-shrink-0 p-2 sm:p-4 lg:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center mb-2 sm:mb-3 lg:mb-4">
          <span className="text-sm sm:text-base lg:text-lg font-semibold text-gray-700 mr-2">💡 Quick Actions</span>
          <span className="text-xs sm:text-sm text-gray-500">Click any button to ask instantly</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => handleQuickQuestion(question)}
              className="px-2 py-2 sm:px-3 sm:py-2 lg:px-4 lg:py-3 text-xs sm:text-sm bg-white text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200 hover:border-blue-300 text-left"
              disabled={isLoading}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 lg:p-6 space-y-2 sm:space-y-3 lg:space-y-4 min-h-0 bg-gray-50">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-3 sm:mb-4 lg:mb-6`}>
            <div className={`max-w-[85%] sm:max-w-[80%] ${
              message.role === 'user' 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                : `${getMessageTypeColor(message.type)} text-gray-800`
            } rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border transition-all duration-200 hover:shadow-xl`}>
              {message.role === 'assistant' && (
                <div className="flex items-center mb-2 sm:mb-3 lg:mb-4 pb-2 sm:pb-3 border-b border-gray-200">
                  <div className="relative">
                    <span className="text-lg sm:text-xl mr-2 sm:mr-3">🤖</span>
                    <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm sm:text-base font-semibold text-gray-700">AI Assistant</span>
                    <span className="text-xs sm:text-sm text-gray-500">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              )}
              
              <div className={`${message.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                {message.role === 'user' ? (
                  <div className="text-sm sm:text-base leading-relaxed">{message.message || 'No message content'}</div>
                ) : (
                  <div className="prose prose-sm sm:prose-base max-w-none text-sm sm:text-base leading-relaxed">
                    {formatMessage(message.message)}
                  </div>
                )}
              </div>

              {message.role === 'user' && (
                <div className="text-xs sm:text-sm text-blue-100 mt-2 sm:mt-3 text-right">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start mb-3 sm:mb-4 lg:mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg max-w-[85%] sm:max-w-[80%]">
              <div className="flex items-center">
                <div className="relative">
                  <span className="text-lg sm:text-xl mr-2 sm:mr-3 lg:mr-4">🤖</span>
                  <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div className="flex space-x-1 mr-2 sm:mr-3 lg:mr-4">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm sm:text-base font-medium text-gray-700">AI Assistant is thinking...</span>
                  <span className="text-xs sm:text-sm text-gray-500">Processing your request</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t bg-gradient-to-r from-gray-50 to-blue-50 p-2 sm:p-4 lg:p-6">
        <form onSubmit={handleSendMessage} className="flex space-x-2 sm:space-x-3 lg:space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Ask me anything about your properties..."
              className="w-full px-3 py-2 sm:px-4 sm:py-3 lg:px-6 lg:py-4 border border-gray-300 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base shadow-sm transition-all duration-200"
              disabled={isLoading}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            {currentMessage && (
              <div className="absolute right-2 sm:right-3 lg:right-4 top-1/2 transform -translate-y-1/2">
                <span className="text-xs sm:text-sm text-gray-400">{currentMessage.length}/1000</span>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={!currentMessage.trim() || isLoading}
            className="px-3 py-2 sm:px-4 sm:py-3 lg:px-8 lg:py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl sm:rounded-2xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-1 sm:gap-2 lg:gap-3"
          >
            {isLoading ? (
              <>
                <div className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs sm:text-sm lg:text-base hidden sm:inline">Sending...</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span className="text-xs sm:text-sm lg:text-base hidden sm:inline">Send</span>
              </>
            )}
          </button>
        </form>
        
        <div className="mt-2 sm:mt-3 lg:mt-4 flex flex-wrap gap-1 sm:gap-2 lg:gap-3 justify-center">
          <span className="text-xs sm:text-sm text-gray-500">Try:</span>
          <button
            onClick={() => setCurrentMessage("What's the lease end date for tenant John?")}
            className="text-xs sm:text-sm bg-white px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
            disabled={isLoading}
          >
            <span className="hidden sm:inline">"What's the lease end date for tenant John?"</span>
            <span className="sm:hidden">"Lease end date?"</span>
          </button>
          <button
            onClick={() => setCurrentMessage("Show me vacant properties")}
            className="text-xs sm:text-sm bg-white px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
            disabled={isLoading}
          >
            <span className="hidden sm:inline">"Show me vacant properties"</span>
            <span className="sm:hidden">"Vacant properties"</span>
          </button>
          <button
            onClick={() => setCurrentMessage("Generate a financial report")}
            className="text-xs sm:text-sm bg-white px-2 py-1 sm:px-3 sm:py-2 lg:px-4 lg:py-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
            disabled={isLoading}
          >
            <span className="hidden sm:inline">"Generate a financial report"</span>
            <span className="sm:hidden">"Financial report"</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminBot;
