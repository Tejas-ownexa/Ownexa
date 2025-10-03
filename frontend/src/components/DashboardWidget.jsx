import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, DollarSign, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';

const DashboardWidget = ({ title, value, description, icon: Icon, link, color = 'blue', trend, animationDelay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, animationDelay);
    
    return () => clearTimeout(timer);
  }, [animationDelay]);
  
  useEffect(() => {
    if (isVisible && typeof value === 'number') {
      let start = 0;
      const end = value;
      const duration = 1000;
      const increment = end / (duration / 16);
      
      const counter = setInterval(() => {
        start += increment;
        if (start >= end) {
          setDisplayValue(end);
          clearInterval(counter);
        } else {
          setDisplayValue(Math.floor(start));
        }
      }, 16);
      
      return () => clearInterval(counter);
    } else {
      setDisplayValue(value);
    }
  }, [isVisible, value]);
  const getColorClasses = (color) => {
    switch (color) {
      case 'green':
        return 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 text-green-600 dark:text-green-400';
      case 'red':
        return 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 text-red-600 dark:text-red-400';
      case 'yellow':
        return 'bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 text-yellow-600 dark:text-yellow-400';
      case 'purple':
        return 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 text-purple-600 dark:text-purple-400';
      case 'blue':
      default:
        return 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-600 dark:text-blue-400';
    }
  };

  return (
<<<<<<< HEAD
<<<<<<< HEAD
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
          {trend && (
            <p className={`text-sm mt-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}% from last month
=======
    <div className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 ${
=======
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 ${
>>>>>>> 9010d28ffdbe7d520a9135b06ed90726c286e44f
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
    }`}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue}
>>>>>>> c4000e91ef9e66dfad67d379435355dc7c1a0112
            </p>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-300">{description}</p>
            )}
            {trend !== undefined && (
              <div className={`flex items-center mt-2 text-sm font-medium ${
                trend > 0 ? 'text-green-600 dark:text-green-400' : trend < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'
              }`}>
                {trend > 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : trend < 0 ? (
                  <TrendingDown className="h-4 w-4 mr-1" />
                ) : null}
                <span>{trend > 0 ? '+' : ''}{trend}% from last month</span>
              </div>
            )}
          </div>
          <div className={`p-4 rounded-xl ${getColorClasses(color)} transform transition-transform duration-300 hover:scale-110`}>
            <Icon className="h-8 w-8" />
          </div>
        </div>
        
        {/* Progress bar for visual appeal */}
        <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ease-out ${
              color === 'green' ? 'bg-green-500 dark:bg-green-400' :
              color === 'red' ? 'bg-red-500 dark:bg-red-400' :
              color === 'yellow' ? 'bg-yellow-500 dark:bg-yellow-400' :
              'bg-blue-500 dark:bg-blue-400'
            }`}
            style={{ 
              width: isVisible ? '75%' : '0%',
              transitionDelay: `${animationDelay + 500}ms`
            }}
          ></div>
        </div>
        
        {link && (
          <Link
            to={link}
            className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 group"
          >
            <span>View details</span>
            <svg className="ml-1 h-4 w-4 transform transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
};

export default DashboardWidget;
