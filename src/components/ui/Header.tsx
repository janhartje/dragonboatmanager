import React, { useState, useEffect } from 'react';
import { Sun, Moon, Info } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface HeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  logo?: React.ReactNode;
  leftAction?: React.ReactNode;
  children?: React.ReactNode;
  showHelp?: boolean;
  onHelp?: () => void;
  showThemeToggle?: boolean;
  isDarkMode?: boolean;
  toggleDarkMode?: () => void;
  showLanguageToggle?: boolean;
  showInstallButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  subtitle, 
  logo = null, 
  leftAction = null, 
  children = null, 
  showHelp = true, 
  onHelp, 
  showThemeToggle = true, 
  isDarkMode, 
  toggleDarkMode,
  showLanguageToggle = true,
  showInstallButton = false
}) => {
  const { language, changeLanguage } = useLanguage();

  return (
    <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 sticky top-0 z-50">
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

      <div className="flex gap-2 items-center justify-end md:justify-start w-full md:w-auto">
        {children}
        
        {(children && (showHelp || showThemeToggle)) && <div className="w-px h-8 bg-slate-100 dark:bg-slate-800 mx-2"></div>}

        {showHelp && onHelp && (
          <button onClick={onHelp} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors">
            <Info size={20} />
          </button>
        )}
        
        {showThemeToggle && toggleDarkMode && (
          <button onClick={toggleDarkMode} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        )}
        
        {showLanguageToggle && (
          <button 
            onClick={() => changeLanguage(language === 'de' ? 'en' : 'de')} 
            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors font-bold text-sm w-10 h-10 flex items-center justify-center"
          >
            {language.toUpperCase()}
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
