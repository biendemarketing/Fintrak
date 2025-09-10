
import React from 'react';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-20 h-20 text-2xl',
  };

  const getInitials = (nameStr?: string | null) => {
    if (!nameStr) return '?';
    const names = nameStr.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  return (
    <div className={`relative inline-block ${sizeClasses[size]}`}>
      {src ? (
        <img src={src} alt={name || 'User Avatar'} className="rounded-full w-full h-full object-cover" />
      ) : (
        <div className="rounded-full w-full h-full flex items-center justify-center bg-brand-primary/20 text-brand-primary font-bold">
          {getInitials(name)}
        </div>
      )}
    </div>
  );
};

export default Avatar;
