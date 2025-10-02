import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

const AnimatedToast = ({ 
  message, 
  type = 'info', 
  duration = 5000, 
  onClose,
  position = 'top-right' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  
  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto close after duration
    const closeTimer = setTimeout(() => {
      handleClose();
    }, duration);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(closeTimer);
    };
  }, [duration]);
  
  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };
  
  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-500',
      textColor: 'text-green-800 dark:text-green-200',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-500',
      textColor: 'text-red-800 dark:text-red-200',
      iconColor: 'text-red-600',
      borderColor: 'border-red-200'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-500',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-200'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-500',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    }
  };
  
  const config = typeConfig[type];
  const Icon = config.icon;
  
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };
  
  return (
    <div className={`fixed ${positionClasses[position]} z-50 transition-all duration-300 ${
      isVisible && !isLeaving 
        ? 'opacity-100 translate-y-0 scale-100' 
        : 'opacity-0 translate-y-2 scale-95'
    }`}>
      <div className={`max-w-sm w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border ${config.borderColor} overflow-hidden`}>
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Icon className={`h-6 w-6 ${config.iconColor}`} />
            </div>
            <div className="ml-3 w-0 flex-1">
              <p className={`text-sm font-medium ${config.textColor}`}>
                {message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                className="bg-white rounded-md inline-flex text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                onClick={handleClose}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-1 bg-gray-200">
          <div 
            className={`h-full ${config.bgColor} transition-all duration-100 ease-linear`}
            style={{ 
              width: isLeaving ? '0%' : '100%',
              transition: isLeaving ? 'width 300ms ease-out' : `width ${duration}ms linear`
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AnimatedToast;
