import React from 'react';

interface ProgressBarProps {
  percentage: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage }) => {
  let colorClass = 'bg-brand-primary';
  if (percentage > 75) colorClass = 'bg-yellow-500';
  if (percentage >= 100) colorClass = 'bg-expense';
  
  const progress = Math.max(0, Math.min(percentage, 100));

  return (
    <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2.5">
      <div
        className={`h-2.5 rounded-full transition-all duration-500 ease-out ${colorClass}`}
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      ></div>
    </div>
  );
};

export default ProgressBar;
