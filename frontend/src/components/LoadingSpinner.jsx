import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      <div className="relative">
        {/* Main spinner */}
        <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-blue-200 border-t-blue-600`}></div>
        {/* Pulsing ring */}
        <div className={`${sizeClasses[size]} animate-ping absolute top-0 left-0 rounded-full border-4 border-blue-300 opacity-20`}></div>
        {/* Glow effect */}
        <div className={`${sizeClasses[size]} animate-pulse absolute top-0 left-0 rounded-full bg-blue-400 opacity-10`}></div>
      </div>
      {text && (
        <div className="mt-4 text-center">
          <p className={`${textSizeClasses[size]} text-gray-600 animate-pulse`}>{text}</p>
          <div className="flex space-x-1 mt-2 justify-center">
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;
