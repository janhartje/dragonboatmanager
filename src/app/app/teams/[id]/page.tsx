'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDrachenboot } from '@/context/DrachenbootContext';
import { useLanguage } from '@/context/LanguageContext';
import { ArrowLeft, Save, Trash2, AlertTriangle, Check } from 'lucide-react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import DragonLogo from '@/components/ui/DragonLogo';

export default function TeamDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { teams, updateTeam, deleteTeam, isDarkMode, toggleDarkMode, currentTeam, switchTeam } = useDrachenboot();
  const { t } = useLanguage();
  
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const team = teams.find(t => t.id === params.id);

  useEffect(() => {
    if (teams.length > 0) {
      if (team) {
        setName(team.name);
        setIsLoading(false);
      } else {
        // Team not found, redirect
        router.push('/app/teams');
      }
    }
  }, [teams, team, router, params.id]);

  const handleSave = async () => {
    if (team && name.trim() && name !== team.name) {
      await updateTeam(team.id, name);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleDelete = async () => {
    if (team) {
      await deleteTeam(team.id);
      router.push('/app/teams');
    }
  };

  if (isLoading || !team) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 bg-slate-100 dark:bg-slate-950 p-2 md:p-4 pb-20">
      <div className="max-w-6xl mx-auto">
        <Header
          title={t('editTeam') || 'Edit Team'}
          logo={
            <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
              <DragonLogo className="w-10 h-10" />
            </Link>
          }
          leftAction={
            <button 
              onClick={() => router.push('/app/teams')} 
              className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          }
          showThemeToggle={true}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        />

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden max-w-2xl mx-auto">
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('teamName') || 'Team Name'}
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder={t('teamNamePlaceholder') || 'Enter team name'}
                />
                <button
                  onClick={handleSave}
                  disabled={!name.trim() || name === team.name}
                  className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-all whitespace-nowrap ${
                    saveSuccess 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : !name.trim() || name === team.name
                        ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow'
                  }`}
                >
                  {saveSuccess ? <Check size={18} /> : <Save size={18} />}
                  <span>{saveSuccess ? (t('saved') || 'Saved') : (t('save') || 'Save')}</span>
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">
                {t('dangerZone') || 'Danger Zone'}
              </h3>
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800 dark:text-red-400">
                      {t('deleteTeam') || 'Delete Team'}
                    </h4>
                    <p className="text-sm text-red-600 dark:text-red-300/80 mt-1">
                      {t('deleteTeamWarning') || 'Deleting a team will permanently remove all its paddlers and events. This action cannot be undone.'}
                    </p>
                  </div>
                </div>
                
                {deleteConfirm ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                      onClick={handleDelete}
                      className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                    >
                      {t('confirmDelete') || 'Yes, delete team'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                    >
                      {t('cancel') || 'Cancel'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="px-4 py-2 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={18} />
                    <span>{t('deleteTeam') || 'Delete Team'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
