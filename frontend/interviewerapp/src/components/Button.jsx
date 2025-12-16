import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  icon,
  className = '',
  disabled,
  ...props 
}) => {
  // Neo-Brutalist Base Styles
  const baseStyles = "inline-flex items-center justify-center font-bold border-3 border-black transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";
  
  const variants = {
    primary: "bg-primary text-white shadow-neo hover:-translate-y-1 hover:shadow-neo-hover",
    secondary: "bg-white text-black shadow-neo hover:-translate-y-1 hover:shadow-neo-hover",
    danger: "bg-red-500 text-white shadow-neo hover:-translate-y-1 hover:shadow-neo-hover",
    ghost: "bg-transparent border-transparent shadow-none hover:bg-gray-100",
  };
  
  const sizeStyles = "px-6 py-3 text-base";

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizeStyles} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

export default Button;

