import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDrachenboot } from '@/context/DrachenbootContext';
import { useLanguage } from '@/context/LanguageContext';
import { HelpModal } from '../ui/Modals';
import DragonLogo from '../ui/DragonLogo';
import Header from '../ui/Header';
import Footer from '../ui/Footer';
import TeamSwitcher from './TeamSwitcher';
import { UserMenu } from '@/components/auth/UserMenu';
import { Settings, Globe, Instagram, Facebook, Twitter, Mail, Plus } from 'lucide-react';
import { Team } from '@/types';

// Sub-components
import NewEventForm from './team/NewEventForm';
import PaddlerModal from './team/PaddlerModal';
import EventList from './team/EventList';
import PaddlerGrid from './team/PaddlerGrid';
import { Paddler } from '@/types';

const TeamView: React.FC = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const { 
    events, 
    paddlers, 
    currentTeam,
    updateTeam,
    createEvent, 
    deleteEvent,
    updateAttendance, 
    addPaddler, 
    updatePaddler, 
    deletePaddler,
    isDarkMode,
    toggleDarkMode,
    userRole
  } = useDrachenboot();

  // --- LOCAL UI STATE ---
  const [editingPaddlerId, setEditingPaddlerId] = useState<number | string | null>(null);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- COMPUTED ---
  const sortedPaddlers = useMemo(() => 
    [...paddlers].filter((p) => !p.isCanister && !p.isGuest).sort((a, b) => a.name.localeCompare(b.name)), 
  [paddlers]);

  const paddlerToEdit = useMemo(() => 
    editingPaddlerId ? paddlers.find(p => p.id === editingPaddlerId) || null : null,
  [editingPaddlerId, paddlers]);

  // --- ACTIONS ---
  const handleCreateEvent = (title: string, date: string, type: 'training' | 'regatta', boatSize: 'standard' | 'small') => {
    createEvent(title, date, type, boatSize);
  };

  const handleDeleteEvent = (id: string) => {
    deleteEvent(id);
  };

  const handlePlanEvent = (eid: number | string) => {
    router.push(`/app/planner?id=${eid}`);
  };

  const handleSavePaddler = async (data: Pick<Paddler, 'name' | 'weight' | 'skills'>) => {
    setErrorMessage(null);
    try {
      if (editingPaddlerId && editingPaddlerId !== 'new') {
        await updatePaddler(editingPaddlerId, data);
      } else {
        await addPaddler(data);
      }
      setEditingPaddlerId(null);
    } catch (e: any) {
      setErrorMessage(e.message || t('errorSavingPaddler'));
    }
  };

  const handleEditPaddler = (p: Paddler) => {
    setEditingPaddlerId(p.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePaddler = (id: number | string) => {
    deletePaddler(id);
    if (editingPaddlerId === id) setEditingPaddlerId(null);
  };

  const handleCancelEdit = () => {
    setEditingPaddlerId(null);
  };

  const handleUpdateTeam = async (data: Partial<Team>) => {
    if (currentTeam) {
      await updateTeam(currentTeam.id, data);
    }
  };

  return (
    <div className="min-h-screen font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 bg-slate-100 dark:bg-slate-950 p-2 md:p-4 pb-20">
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      
      <div className="max-w-6xl mx-auto">
        <Header 
          title={t('appTitle')}
          subtitle={t('teamManager')}
          logo={
            <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
              {currentTeam?.icon ? (
                <img src={currentTeam.icon} alt="Team Icon" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <DragonLogo className="w-10 h-10" />
              )}
            </Link>
          }
          showHelp={true}
          onHelp={() => setShowHelp(true)}
          showThemeToggle={true}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          showInstallButton={true}
        >

          <TeamSwitcher />
          <div className="w-px h-8 bg-slate-100 dark:bg-slate-800 mx-2"></div>
          <UserMenu />
        </Header>

        {/* Team Metadata / Social Links - only render if there are links */}
        {currentTeam && (currentTeam.website || currentTeam.instagram || currentTeam.facebook || currentTeam.twitter || currentTeam.email) && (
          <div className="-mt-4 mb-6 flex flex-wrap items-center gap-4 px-2">
            {currentTeam.website && (
              <a href={currentTeam.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                <Globe size={16} />
                <span className="hidden sm:inline">{new URL(currentTeam.website).hostname}</span>
              </a>
            )}
            {currentTeam.instagram && (
              <a href={currentTeam.instagram.startsWith('http') ? currentTeam.instagram : `https://instagram.com/${currentTeam.instagram}`} target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-slate-400 hover:text-pink-600 transition-colors">
                <Instagram size={20} />
              </a>
            )}
            {currentTeam.facebook && (
              <a href={currentTeam.facebook} target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors">
                <Facebook size={20} />
              </a>
            )}
            {currentTeam.twitter && (
              <a href={currentTeam.twitter} target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-slate-400 hover:text-sky-500 transition-colors">
                <Twitter size={20} />
              </a>
            )}
            {currentTeam.email && (
              <a href={`mailto:${currentTeam.email}`} className="text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                <Mail size={20} />
              </a>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Neuer Termin */}
          <div className="lg:col-span-1 lg:order-1 flex flex-col">
            {userRole === 'CAPTAIN' && <NewEventForm onCreate={handleCreateEvent} t={t} />}
          </div>

          {/* Event Liste */}
          <div className="lg:col-span-1 lg:order-3 flex flex-col">
            <EventList 
              events={events} 
              sortedPaddlers={sortedPaddlers} 
              onPlan={handlePlanEvent} 
              onDelete={handleDeleteEvent}
              onUpdateAttendance={updateAttendance} 
              t={t} 
            />
          </div>

          {/* Paddler Grid */}
          <div className="lg:col-span-2 lg:order-2 lg:row-span-2 flex flex-col">
            <PaddlerGrid 
              paddlers={sortedPaddlers} 
              editingId={editingPaddlerId === 'new' ? null : editingPaddlerId} 
              onEdit={handleEditPaddler} 
              onDelete={handleDeletePaddler} 
              t={t}
              headerAction={
                userRole === 'CAPTAIN' && (
                  <button 
                    onClick={() => setEditingPaddlerId('new')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 h-8 rounded text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                  >
                    <Plus size={16} />
                    {t('addPaddler')}
                  </button>
                )
              }
            />
          </div>
        </div>
        
        {/* Paddler Modal */}
        {userRole === 'CAPTAIN' && (
          <PaddlerModal
            isOpen={!!editingPaddlerId}
            onClose={() => setEditingPaddlerId(null)}
            paddlerToEdit={editingPaddlerId === 'new' ? null : paddlerToEdit}
            onSave={handleSavePaddler}
            t={t}
            teamMembers={paddlers.filter(p => p.userId).map(p => ({ userId: p.userId, name: p.name, email: p.user?.email || '' }))}
            errorMessage={errorMessage}
          />
        )}
        <Footer />
      </div>
    </div>
  );
};

export default TeamView;
