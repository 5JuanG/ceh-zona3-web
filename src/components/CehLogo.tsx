import React from 'react';

interface CehLogoProps {
  className?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
}

export const CehLogo: React.FC<CehLogoProps> = ({ 
  className, 
  color = '#2589bd',
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    custom: className || ''
  };

  const finalClass = className || sizeClasses[size];

  return (
    <svg 
      viewBox="0 0 500 380" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`shrink-0 ${finalClass}`}
    >
      {/* Outer framing line */}
      <path 
        d="M 112 150 V 345 H 398 V 150" 
        stroke={color} 
        strokeWidth="11" 
        strokeLinecap="square" 
        strokeLinejoin="miter" 
      />

      {/* FATHER (Taller, Left Adult) */}
      <circle cx="210" cy="55" r="30" fill={color} />
      <path 
        d="M 142 88 C 142 78, 278 78, 278 88 V 345 H 142 Z" 
        fill={color} 
      />
      {/* Father neck V-notch */}
      <polygon points="210,110 188,78 232,78" fill="#ffffff" />

      {/* MOTHER (Right Adult) */}
      <circle cx="318" cy="98" r="26" fill={color} />
      <path 
        d="M 276 138 C 276 128, 360 128, 360 138 L 372 320 H 264 Z" 
        fill={color} 
      />
      {/* Mother neck V-notch */}
      <polygon points="318,155 300,132 336,132" fill="#ffffff" />

      {/* BOY (Front Center) */}
      <circle cx="220" cy="180" r="22" fill={color} />
      <path 
        d="M 181 212 C 181 205, 259 205, 259 212 V 345 H 181 Z" 
        fill={color} 
      />
      {/* Boy neck V-notch */}
      <polygon points="220,230 203,208 237,208" fill="#ffffff" />

      {/* GIRL (Front Right) */}
      <circle cx="285" cy="235" r="18" fill={color} />
      <path 
        d="M 252 265 C 252 258, 318 258, 318 265 L 324 330 H 246 Z" 
        fill={color} 
      />
    </svg>
  );
};
