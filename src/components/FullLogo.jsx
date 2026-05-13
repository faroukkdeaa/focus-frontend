import React from 'react';
import { Link } from 'react-router-dom';
import TargetIcon from './TargetIcon';

export const FullLogo = ({ className = 'text-4xl', showTagline = false }) => {
  return (
    <Link 
      to="/" 
      className={`flex items-center justify-center px-5 py-2.5 rounded-2xl bg-white/80 dark:bg-[#1A2744]/60 backdrop-blur-md border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-pointer no-underline text-inherit ${className}`}
    >
      <div className="inline-flex flex-col items-center" dir="ltr">
        <div className="inline-flex items-center font-black font-['Cairo','sans-serif'] leading-none tracking-tight select-none whitespace-nowrap text-[#1C2540] dark:text-white">
          <span className="mr-1">F</span>
          <TargetIcon className="w-[0.73em] h-[1em] shrink-0" disableLink={true} />
          <span className="ml-1">CUS</span>
        </div>
        {showTagline && (
          <div className="mt-2 font-['Cairo','sans-serif'] font-semibold tracking-widest uppercase text-[#17C8F0] select-none text-[0.15em] relative w-full text-center">
            Digital Learning Platform
          </div>
        )}
      </div>
    </Link>
  );
};

export default FullLogo;
