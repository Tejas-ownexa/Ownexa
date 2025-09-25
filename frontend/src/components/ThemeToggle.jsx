import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = ({ className = '', size = 'default' }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  const sizeClasses = {
    small: 'h-8 w-8',
    default: 'h-10 w-10',
    large: 'h-12 w-12'
  };

  const iconSizes = {
    small: 'h-4 w-4',
    default: 'h-5 w-5',
    large: 'h-6 w-6'
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${sizeClasses[size]}
        relative rounded-lg
        bg-gray-100 dark:bg-gray-800
        hover:bg-gray-200 dark:hover:bg-gray-700
        border border-gray-200 dark:border-gray-600
        transition-all duration-300 ease-in-out
        flex items-center justify-center
        group hover:scale-105 active:scale-95
        shadow-sm hover:shadow-md
        ${className}
      `}
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      <div className="relative overflow-hidden">
        <Sun 
          className={`
            ${iconSizes[size]}
            text-yellow-500
            transition-all duration-300 ease-in-out
            ${isDarkMode 
              ? 'opacity-0 rotate-90 scale-0' 
              : 'opacity-100 rotate-0 scale-100'
            }
          `}
        />
        <Moon 
          className={`
            ${iconSizes[size]}
            text-blue-400
            absolute top-0 left-0
            transition-all duration-300 ease-in-out
            ${isDarkMode 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-90 scale-0'
            }
          `}
        />
      </div>
      
      {/* Animated background effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-yellow-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
};

export default ThemeToggle;
