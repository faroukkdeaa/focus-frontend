import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';

const Logo = ({ className = '' }) => {
  return (
    <Link
      to='/'
      className={`inline-flex items-center gap-2 hover:opacity-80 transition-opacity ${className}`.trim()}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#103B66] dark:bg-blue-600 shadow-sm flex-shrink-0">
        <Brain className="w-5 h-5 text-white" />
      </div>
      <span className="font-black text-[#103B66] dark:text-blue-400 text-lg tracking-tight select-none">
        FOCUS
      </span>
    </Link>
  );
};

export default Logo;
