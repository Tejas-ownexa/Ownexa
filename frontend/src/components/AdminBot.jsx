import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-hot-toast';
import api from '../utils/axios';

const AdminBot = () => {
  const [messages, setMessages] = useState([
    {
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
    }
  ]);
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
              <div key={index} className="mb-2">
                <span dangerouslySetInnerHTML={{ __html: line.replace(/\[Click here to download PDF\]\([^)]+\)/, '') }} />
                <button
                  onClick={() => handlePDFDownload(downloadUrl)}
                  className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  📥 Download PDF
                </button>
              </div>
            );
          }
        }
        
        // Handle different line types
        if (line.startsWith('•')) {
          return (
            <div key={index} className="ml-4 mb-1">
              <span dangerouslySetInnerHTML={{ __html: line }} />
            </div>
          );
        } else if (line.startsWith('🔸') || line.startsWith('   ')) {
          return (
            <div key={index} className="ml-2 mb-1 text-sm">
              <span dangerouslySetInnerHTML={{ __html: line }} />
            </div>
          );
        } else if (line.trim() === '') {
          return <br key={index} />;
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
    <div className="h-full flex flex-col">
      {/* Quick Questions */}
      <div className="p-3 border-b bg-gray-50">
        <p className="text-xs text-gray-600 mb-2">Quick questions:</p>
        <div className="flex flex-wrap gap-1">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => handleQuickQuestion(question)}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : `${getMessageTypeColor(message.type)} text-gray-800`
            } rounded-lg p-2 shadow-sm border text-sm`}>
              {message.role === 'assistant' && (
                <div className="flex items-center mb-1">
                  <span className="text-sm mr-2">🤖</span>
                  <span className="text-xs text-gray-500">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              )}
              
              <div className={`${message.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                {message.role === 'user' ? (
                  <div className="text-sm">{message.message || 'No message content'}</div>
                ) : (
                  <div className="prose prose-sm max-w-none text-sm">
                    {formatMessage(message.message)}
                  </div>
                )}
              </div>

              {message.role === 'user' && (
                <div className="text-xs text-blue-100 mt-1 text-right">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 shadow-sm">
              <div className="flex items-center">
                <span className="text-sm mr-2">🤖</span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="ml-2 text-xs text-gray-500">Analyzing...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 bg-white">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="Ask me anything about your properties..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!currentMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Send'
            )}
          </button>
        </form>
        
        <div className="mt-1 text-xs text-gray-500 text-center">
          Try: "What's the lease end date for tenant John?" or "Show me vacant properties"
        </div>
      </div>
    </div>
  );
};

export default AdminBot;
