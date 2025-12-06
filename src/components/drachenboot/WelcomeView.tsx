'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useDrachenboot } from '@/context/DrachenbootContext';
import DragonLogo from '../ui/DragonLogo';
import Footer from '../ui/Footer';
import Header from '../ui/Header';
import PageTransition from '../ui/PageTransition';
import { CreateTeamModal } from '../ui/modals/CreateTeamModal';
import { UserMenu } from '@/components/auth/UserMenu';
import { Plus, UserPlus } from 'lucide-react';

const WelcomeView: React.FC = () => {
  const { t } = useLanguage();
  const { isDarkMode, toggleDarkMode, createTeam } = useDrachenboot();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateTeam = (name: string) => {
    createTeam(name);
    setShowCreateModal(false);
  };

  return (
    <PageTransition>
      <div className="min-h-screen font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 bg-slate-100 dark:bg-slate-950 p-2 md:p-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <Header 
            title={t('appTitle')}
            logo={
              <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
                <DragonLogo className="w-10 h-10" />
              </Link>
            }
            showThemeToggle={true}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
          >
            <UserMenu />
          </Header>

          {/* Welcome Hero */}
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl shadow-xl p-8 md:p-12 text-center text-white mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {t('welcomeTitle')}
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
              {t('welcomeSubtitle')}
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Team */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
                <Plus className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                {t('welcomeCreateTitle')}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {t('welcomeCreateDesc')}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                {t('createTeam')}
              </button>
            </div>

            {/* Join Team */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
                <UserPlus className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                {t('welcomeJoinTitle')}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {t('welcomeJoinDesc')}
              </p>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  💡 {t('welcomeJoinHint')}
                </p>
              </div>
            </div>
          </div>

          <Footer />
        </div>

        {showCreateModal && (
          <CreateTeamModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateTeam}
          />
        )}
      </div>
    </PageTransition>
  );
};

export default WelcomeView;
