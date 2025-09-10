// FIX: This file was missing. Added full implementation for the Avatar component.
import React from 'react';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, name, className = 'w-16 h-16' }) => {
  const getInitials = (userName?: string): string => {
    if (!userName) return '';
    const names = userName.split(' ');
    if (names.length > 1 && names[0] && names[names.length - 1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return userName.substring(0, 2).toUpperCase();
  };

  return (
    <div className={`relative inline-flex items-center justify-center overflow-hidden bg-neutral-200 dark:bg-neutral-700 rounded-full ${className}`}>
      {src ? (
        <img className="w-full h-full object-cover" src={src} alt={name || 'User avatar'} />
      ) : (
        <span className="font-medium text-neutral-600 dark:text-neutral-300">
          {getInitials(name || undefined)}
        </span>
      )}
    </div>
  );
};

export default Avatar;
