'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDrachenboot } from '@/context/DrachenbootContext';
import { useLanguage } from '@/context/LanguageContext';
import { Edit2, Plus, ArrowLeft } from 'lucide-react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import DragonLogo from '@/components/ui/DragonLogo';
import { CreateTeamModal } from '@/components/ui/modals/CreateTeamModal';

export default function TeamManagementPage() {
  const router = useRouter();
  const { teams, currentTeam, switchTeam, createTeam, isDarkMode, toggleDarkMode } = useDrachenboot();
  const { t } = useLanguage();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateTeam = (name: string) => {
    createTeam(name);
    setShowCreateModal(false);
  };

  return (
    <div className="min-h-screen font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 bg-slate-100 dark:bg-slate-950 p-2 md:p-4 pb-20">
      <div className="max-w-6xl mx-auto">
        <Header
          title={t('manageTeams') || 'Manage Teams'}
          logo={
            <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
              <DragonLogo className="w-10 h-10" />
            </Link>
          }
          leftAction={
            <button 
              onClick={() => router.push('/app')} 
              className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          }
          showThemeToggle={true}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        >
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
          >
            <Plus size={16} />
            <span>{t('createTeam') || 'Create Team'}</span>
          </button>
        </Header>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">
              {t('teams') || 'Teams'}
            </h2>
            
            {teams.length === 0 ? (
              <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                {t('noTeams') || 'No teams available.'}
              </div>
            ) : (
              <div className="space-y-3">
                {teams.map((team) => (
                  <div 
                    key={team.id} 
                    onClick={() => switchTeam(team.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all flex items-center justify-between group ${
                      currentTeam?.id === team.id 
                        ? 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20 shadow-sm' 
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="font-medium text-lg text-slate-800 dark:text-slate-200 truncate">
                        {team.name}
                      </span>
                      {currentTeam?.id === team.id && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                          {t('active') || 'Active'}
                        </span>
                      )}
                    </div>
                    
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        router.push(`/app/teams/${team.id}`); 
                      }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title={t('edit') || 'Edit'}
                    >
                      <Edit2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
  );
}
