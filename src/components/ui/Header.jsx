import React from 'react';
import { Sun, Moon, Info } from 'lucide-react';

const Header = ({ 
  title, 
  subtitle, 
  logo, 
  leftAction, 
  children, 
  showHelp = true, 
  onHelp, 
  showThemeToggle = true, 
  isDarkMode, 
  toggleDarkMode 
}) => {
  return (
    <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {leftAction && (
          <>
            {leftAction}
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
          </>
        )}
        
        {logo && (
           <div className="flex items-center justify-center">
             {logo}
           </div>
        )}

        <div>
          <div className="font-bold text-xl text-slate-800 dark:text-white leading-tight flex items-center gap-2">
            {title}
          </div>
          {subtitle && <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase tracking-wider">{subtitle}</p>}
        </div>
      </div>

      <div className="flex gap-2 items-center">
        {children}
        
        {(children && (showHelp || showThemeToggle)) && <div className="w-px h-8 bg-slate-100 dark:bg-slate-800 mx-2"></div>}

        {showHelp && (
          <button onClick={onHelp} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors">
            <Info size={20} />
          </button>
        )}
        
        {showThemeToggle && (
          <button onClick={toggleDarkMode} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
