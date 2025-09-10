import React from 'react';

interface AvatarProps {
  src?: string | null;
  name?: string;
  className?: string;
}

const getInitials = (name: string = ''): string => {
  const names = name.split(' ').filter(Boolean);
  if (names.length === 0) return '?';
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
};

const Avatar: React.FC<AvatarProps> = ({ src, name, className = '' }) => {
  const initials = getInitials(name);

  return (
    <div className={`relative inline-flex items-center justify-center w-16 h-16 overflow-hidden bg-neutral-300 dark:bg-neutral-600 rounded-full ${className}`}>
      {src ? (
        <img src={src} alt={name || 'User Avatar'} className="w-full h-full object-cover" />
      ) : (
        <span className="font-bold text-xl text-neutral-800 dark:text-white">{initials}</span>
      )}
    </div>
  );
};

export default Avatar;
