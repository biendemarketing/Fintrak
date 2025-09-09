import React from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md' }) => {
  const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    const initials = names.map(n => n[0]).slice(0, 2).join('');
    return initials.toUpperCase();
  };
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
  };

  const colorClasses = [
    'bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500', 
    'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'
  ];
  
  const colorIndex = name.charCodeAt(0) % colorClasses.length;
  const bgColor = colorClasses[colorIndex];

  return (
    <div className={`relative flex-shrink-0 ${sizeClasses[size]}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <div
          className={`w-full h-full rounded-full flex items-center justify-center font-bold text-white ${bgColor}`}
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  );
};

export default Avatar;
