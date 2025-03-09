import React from 'react';

export function Button({ 
  className, 
  variant = "default", 
  size = "default", 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLButtonElement> & { 
  variant?: "default" | "outline" | "ghost",
  size?: "default" | "sm" | "lg"
}) {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-200 bg-transparent hover:bg-gray-100 text-gray-900",
    ghost: "hover:bg-gray-100 text-gray-900",
  };
  
  const sizes = {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3 rounded-md",
    lg: "h-11 px-8 rounded-md",
  };
  
  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className || ''}`} 
      {...props}
    >
      {children}
    </button>
  );
}