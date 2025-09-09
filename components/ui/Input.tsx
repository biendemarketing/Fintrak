
import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input: React.FC<InputProps> = ({ className = '', ...props }) => {
  return (
    <input
      className={`w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-600 border border-neutral-300 dark:border-neutral-500 rounded-md text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition duration-200 ${className}`}
      {...props}
    />
  );
};

export default Input;