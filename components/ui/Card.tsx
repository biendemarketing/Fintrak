
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-white dark:bg-neutral-800/70 backdrop-blur-md p-6 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700/50 ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;