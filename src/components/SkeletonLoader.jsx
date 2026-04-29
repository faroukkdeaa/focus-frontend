import React from 'react';
import { useTheme } from '../context/ThemeContext';

const SkeletonLoader = ({ type = 'text', width, height, className = '' }) => {
  const { isDarkMode, C } = useTheme();

  // Premium, subtle colors instead of harsh flashes
  // Dark mode: Deep slate base with subtle lighter element.
  // Light mode: soft slate-50 base with slate-100 element.
  const baseColor = isDarkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC'; 
  const borderColor = isDarkMode ? 'rgba(255,255,255,0.08)' : '#E2E8F0';

  let shapeStyle = {
    backgroundColor: baseColor,
  };

  switch (type) {
    case 'avatar':
      shapeStyle.width = width || '48px';
      shapeStyle.height = height || '48px';
      shapeStyle.borderRadius = '50%';
      break;
    case 'card':
      shapeStyle.width = width || '100%';
      shapeStyle.height = height || '200px';
      shapeStyle.borderRadius = '16px';
      shapeStyle.border = `1px solid ${borderColor}`;
      break;
    case 'bento':
      shapeStyle.width = width || '100%';
      shapeStyle.height = height || '100%';
      shapeStyle.minHeight = '150px';
      shapeStyle.borderRadius = '24px';
      shapeStyle.border = `1px solid ${borderColor}`;
      break;
    case 'text':
    default:
      shapeStyle.width = width || '100%';
      shapeStyle.height = height || '16px';
      shapeStyle.borderRadius = '8px';
      break;
  }

  // Using Tailwind's animate-pulse provides the subtle, soft pulsing animation requested.
  return (
    <div 
      className={`animate-pulse ${className}`} 
      style={shapeStyle}
    />
  );
};

export default SkeletonLoader;
