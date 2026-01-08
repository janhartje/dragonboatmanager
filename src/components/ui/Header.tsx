import { Sun, Moon, Info } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { IconButton } from './core/IconButton';
import { Divider } from './core/Divider';
import { Card } from './core/Card';

interface HeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
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
  badge,
  logo = null, 
  leftAction = null, 
  children = null, 
  showHelp = true, 
  onHelp, 
  showThemeToggle = true, 
  isDarkMode, 
  toggleDarkMode,
  showLanguageToggle = true,
  // showInstallButton = false
}) => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const changeLanguage = (lang: string) => {
    router.replace({ pathname }, { locale: lang as 'de' | 'en' });
  };

  return (
    <Card 
      padding="none" 
      className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sticky top-0 z-50"
    >
      <div className="flex items-center gap-3">
        {leftAction && (
          <>
            {leftAction}
            <Divider vertical className="h-8" />
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
            {badge}
          </div>
          {subtitle && <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase tracking-wider">{subtitle}</p>}
        </div>
      </div>

      <div className="flex gap-2 items-center justify-end md:justify-start w-full md:w-auto">
        {children}
        
        {(children && (showHelp || showThemeToggle)) && <Divider vertical className="h-8" />}

        {showHelp && onHelp && (
          <IconButton icon={Info} onClick={onHelp} variant="soft" />
        )}
        
        {showThemeToggle && toggleDarkMode && (
          <IconButton icon={isDarkMode ? Sun : Moon} onClick={toggleDarkMode} variant="soft" />
        )}
        
        {showLanguageToggle && (
          <button 
            onClick={() => changeLanguage(locale === 'de' ? 'en' : 'de')} 
            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all font-bold text-sm w-10 h-10 flex items-center justify-center shrink-0 active:scale-95"
          >
            {locale.toUpperCase()}
          </button>
        )}
      </div>
    </Card>
  );
};

export default Header;
