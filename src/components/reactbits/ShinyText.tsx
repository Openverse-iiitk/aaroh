import React from 'react';

interface ShinyTextProps {
  text: string;
  className?: string;
  shimmerColor?: string;
  speed?: number;
}

export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  className = '',
  shimmerColor = 'rgba(255, 255, 255, 0.95)',
  speed = 3,
}) => {
  return (
    <span
      className={`inline-block relative overflow-hidden bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(120deg, rgba(244, 240, 255, 0.7) 0%, ${shimmerColor} 50%, rgba(244, 240, 255, 0.7) 100%)`,
        backgroundSize: '200% 100%',
        animation: `shiny-sweep ${speed}s ease-in-out infinite`,
      }}
    >
      {text}
    </span>
  );
};
