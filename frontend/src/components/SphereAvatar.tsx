import React from 'react';

interface SphereAvatarProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export const SphereAvatar: React.FC<SphereAvatarProps> = ({
  size = 76,
  className = '',
  animate = true,
}) => {
  return (
    <div
      className={`sphere-avatar ${animate ? 'floating' : ''} ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-label="BillGPT Golden Sphere Avatar"
    >
      <div className="sphere-inner">
        <div className="sphere-specular-primary" />
        <div className="sphere-specular-secondary" />
        <div className="sphere-glow-ring" />
      </div>
      <div className="sphere-shadow" />
    </div>
  );
};
