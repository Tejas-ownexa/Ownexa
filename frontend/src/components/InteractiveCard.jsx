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
    default: "bg-white border-gray-100",
    glass: "bg-white/80 backdrop-blur-sm border-white/20",
    gradient: "bg-gradient-to-br from-white to-gray-50 border-gray-100",
    elevated: "bg-white border-gray-200 shadow-xl"
  };
  
  const hoverClasses = hover 
    ? "hover:shadow-2xl hover:scale-105 hover:-translate-y-2 hover:border-blue-200 cursor-pointer" 
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
