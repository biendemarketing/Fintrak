
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <button
      className={`w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-800 focus:ring-brand-primary transition-all duration-200 ease-in-out transform hover:scale-[1.02] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
