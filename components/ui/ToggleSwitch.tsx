
import React from 'react';

interface ToggleSwitchProps {
  id: string;
  isChecked?: boolean;
  onChange?: (checked: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, isChecked = false, onChange }) => {
  const handleToggle = () => {
    if (onChange) {
      onChange(!isChecked);
    }
  };

  return (
    <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
      <input 
        type="checkbox" 
        id={id} 
        className="sr-only peer" 
        checked={isChecked} 
        onChange={handleToggle} 
      />
      <div className="w-11 h-6 bg-neutral-400 dark:bg-neutral-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
    </label>
  );
};

export default ToggleSwitch;