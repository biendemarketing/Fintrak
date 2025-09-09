
import React from 'react';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select: React.FC<SelectProps> = ({ className = '', children, ...props }) => {
  const lightModeArrow = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`;
  const darkModeArrow = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`;

  return (
    <select
      className={`w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-600 border border-neutral-300 dark:border-neutral-500 rounded-md text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition duration-200 appearance-none bg-no-repeat bg-right pr-8`}
      style={{
        backgroundImage: document.documentElement.classList.contains('dark') ? darkModeArrow : lightModeArrow,
        backgroundPosition: 'right 0.5rem center',
        backgroundSize: '1.5em 1.5em',
      }}
      {...props}
    >
      {children}
    </select>
  );
};

export default Select;