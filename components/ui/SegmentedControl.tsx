
import React from 'react';

interface SegmentedControlProps {
    options: { label: string; value: string }[];
    value: string;
    onChange: (value: string) => void;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, value, onChange }) => {
    const activeIndex = options.findIndex(opt => opt.value === value);

    return (
        <div className="relative flex w-full p-1 bg-neutral-200 dark:bg-neutral-700 rounded-lg">
            {options.map((option, index) => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    className={`relative w-full py-1.5 text-sm font-semibold z-10 transition-colors duration-300 rounded-md ${
                        value === option.value ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-neutral-200'
                    }`}
                >
                    {option.label}
                </button>
            ))}
            <div
                className="absolute top-1 bottom-1 bg-white dark:bg-neutral-800/80 rounded-md shadow-sm transition-all duration-300 ease-in-out"
                style={{
                    width: `calc(${100 / options.length}% - 4px)`,
                    left: `calc(${activeIndex * (100 / options.length)}% + 2px)`,
                }}
            />
        </div>
    );
};

export default SegmentedControl;
