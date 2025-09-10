import React from 'react';

interface PasswordStrengthMeterProps {
  password?: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password = '' }) => {
  const calculateStrength = (pass: string): number => {
    let score = 0;
    if (!pass) return 0;
    
    const validations = [
      pass.length > 7,      // Length > 7
      pass.length > 11,     // Length > 11
      /[A-Z]/.test(pass),   // Has uppercase
      /[0-9]/.test(pass),   // Has number
      /[^A-Za-z0-9]/.test(pass), // Has special char
    ];

    validations.forEach(isValid => {
      if (isValid) score++;
    });

    return score;
  };

  const strength = calculateStrength(password);

  const strengthConfig = [
    { label: '', color: 'bg-neutral-600' }, // score 0
    { label: 'Muy Débil', color: 'bg-red-500' }, // score 1
    { label: 'Débil', color: 'bg-orange-500' }, // score 2
    { label: 'Regular', color: 'bg-yellow-500' }, // score 3
    { label: 'Fuerte', color: 'bg-lime-500' }, // score 4
    { label: 'Muy Fuerte', color: 'bg-green-500' }, // score 5
  ];
  
  const activeConfig = strengthConfig[strength];
  const progressPercentage = (strength / 5) * 100;

  return (
    <div className="mt-2">
      <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${activeConfig.color}`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <p className="text-xs text-right text-neutral-500 dark:text-neutral-400 mt-1 h-4">
        {activeConfig.label}
      </p>
    </div>
  );
};

export default PasswordStrengthMeter;
