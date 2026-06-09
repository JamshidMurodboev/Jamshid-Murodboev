import React from 'react';

interface LogoProps {
  className?: string;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({ className = '', height = 40 }) => (
  <img
    src="/logo.png"
    alt="Erasmus Memory Capsule"
    style={{ height }}
    className={`w-auto object-contain ${className}`}
    onError={(e) => {
      const target = e.currentTarget;
      target.style.display = 'none';
      const fallback = target.nextElementSibling as HTMLElement | null;
      if (fallback) fallback.style.display = 'flex';
    }}
  />
);

export const LogoWithFallback: React.FC<{ className?: string; height?: number }> = ({
  className = '',
  height = 40,
}) => (
  <span className={`inline-flex items-center gap-2 ${className}`}>
    <Logo height={height} />
    <span
      className="items-center gap-2 font-bold text-lg text-slate-800 dark:text-white"
      style={{ display: 'none' }}
    >
      <span className="text-2xl">✈️</span>
      Memory Capsule
    </span>
  </span>
);

export default Logo;
