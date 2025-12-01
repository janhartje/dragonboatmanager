import React from 'react';

interface DragonLogoProps {
  className?: string;
}

const DragonLogo: React.FC<DragonLogoProps> = ({ className }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path
      d="M 20 80 Q 30 90, 50 85 Q 70 80, 75 60 Q 80 40, 60 35 Q 40 30, 35 50 Q 30 70, 50 75"
      className="text-blue-600 dark:text-blue-400"
      fill="currentColor"
      fillOpacity="0.1"
      strokeWidth="2.5"
    />
    <path
      d="M 60 35 Q 50 15, 30 20 Q 15 25, 25 40 Q 35 55, 55 50"
      className="text-blue-700 dark:text-blue-300"
      fill="currentColor"
      fillOpacity="0.2"
    />
    <circle
      cx="32"
      cy="28"
      r="2.5"
      fill="currentColor"
      className="text-slate-800 dark:text-slate-100"
    />
    <path
      d="M 30 20 L 25 5"
      strokeWidth="2.5"
      className="text-blue-800 dark:text-blue-200"
    />
    <path d="M 38 22 L 40 12" strokeWidth="2" />
    <path d="M 48 26 L 52 16" strokeWidth="2" />
    <path d="M 55 50 Q 65 55, 70 50" strokeWidth="2.5" />
    <path
      d="M 70 50 L 75 48 M 70 50 L 76 52 M 70 50 L 74 55"
      strokeWidth="2"
    />
    <path
      d="M 65 45 C 65 40, 85 40, 85 45 L 85 65 C 85 70, 65 70, 65 65 Z"
      className="text-amber-600 dark:text-amber-500"
      fill="currentColor"
      fillOpacity="0.2"
      strokeWidth="2"
    />
    <line
      x1="70"
      y1="50"
      x2="80"
      y2="50"
      strokeWidth="1.5"
      className="text-amber-700 dark:text-amber-300"
    />
    <line
      x1="70"
      y1="56"
      x2="80"
      y2="56"
      strokeWidth="1.5"
      className="text-amber-700 dark:text-amber-300"
    />
    <line
      x1="70"
      y1="62"
      x2="75"
      y2="62"
      strokeWidth="1.5"
      className="text-amber-700 dark:text-amber-300"
    />
  </svg>
);

export default DragonLogo;
