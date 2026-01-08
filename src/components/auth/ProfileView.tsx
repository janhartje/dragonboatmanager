'use client';

import React from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/context/ThemeContext';
import DragonLogo from '@/components/ui/DragonLogo';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { UserProfile } from '@/components/auth/UserProfile';
import { ArrowLeft } from 'lucide-react';
import { UserMenu } from '@/components/auth/UserMenu';

const ProfileView: React.FC = () => {
  const t = useTranslations();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const router = useRouter();

  return (
    <div className="min-h-screen font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 bg-slate-100 dark:bg-slate-950 p-2 md:p-4 pb-20">
      <div className="max-w-6xl mx-auto">
        <Header
          title={t('appTitle')}
          subtitle={t('profileSubtitle')}
          logo={
            <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
              <DragonLogo className="w-10 h-10" />
            </Link>
          }
          leftAction={
            <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </button>
          }
          showHelp={false}
          showThemeToggle={true}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          showInstallButton={false}
        >
          <UserMenu />
        </Header>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <UserProfile />
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default ProfileView;
