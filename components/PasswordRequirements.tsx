import React from 'react';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface PasswordRequirementsProps {
  password?: string;
}

const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({ password = '' }) => {
  const requirements = [
    { text: 'Mínimo 8 caracteres', regex: /.{8,}/ },
    { text: 'Una letra mayúscula', regex: /[A-Z]/ },
    { text: 'Un número', regex: /[0-9]/ },
    { text: 'Un caracter especial (ej. !@#$)', regex: /[^A-Za-z0-9]/ },
  ];

  return (
    <ul className="text-sm space-y-1.5 mt-4 text-neutral-600 dark:text-neutral-400">
      {requirements.map((req, index) => {
        const isValid = req.regex.test(password);
        return (
          <li key={index} className={`flex items-center transition-colors duration-300 ${isValid ? 'text-income' : ''}`}>
            <div className="w-4 h-4 mr-2 flex-shrink-0">
                <CheckCircleIcon className={`transition-colors duration-300 ${isValid ? 'text-income' : 'text-neutral-400 dark:text-neutral-600'}`} />
            </div>
            <span>{req.text}</span>
          </li>
        );
      })}
    </ul>
  );
};

export default PasswordRequirements;
