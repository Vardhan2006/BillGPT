import React from 'react';

interface SphereAvatarProps {
  size?: number;
  className?: string;
}

export const SphereAvatar: React.FC<SphereAvatarProps> = ({ size = 80, className = '' }) => {
  return (
    <div
      className={`sphere-avatar ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-label="BillGPT Golden Sphere Avatar"
    >
      <div className="sphere-inner">
        <div className="sphere-highlight" />
        <div className="sphere-glow" />
      </div>
    </div>
  );
};
