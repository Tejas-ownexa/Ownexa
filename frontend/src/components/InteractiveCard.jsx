import React from 'react';

const InteractiveCard = ({ 
  children, 
  variant = 'default', 
  hover = true, 
  className = '',
  onClick,
  ...props 
}) => {
  const baseClasses = "rounded-xl shadow-lg transition-all duration-500 border";
  
  const variantClasses = {
    default: "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700",
    glass: "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/20",
    gradient: "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 border-gray-100 dark:border-gray-700",
    elevated: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 shadow-xl"
  };
  
  const hoverClasses = hover 
    ? "hover:shadow-2xl hover:scale-105 hover:-translate-y-2 hover:border-blue-200 dark:hover:border-blue-600 cursor-pointer" 
    : "";
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className}`;
  
  return (
    <div
      className={classes}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default InteractiveCard;
