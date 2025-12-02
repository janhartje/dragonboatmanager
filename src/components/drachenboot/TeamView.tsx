import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDrachenboot } from '@/context/DrachenbootContext';
import { useLanguage } from '@/context/LanguageContext';
import { HelpModal } from '../ui/Modals';
import DragonLogo from '../ui/DragonLogo';
import Header from '../ui/Header';
import Footer from '../ui/Footer';

// Sub-components
import NewEventForm from './team/NewEventForm';
import PaddlerForm from './team/PaddlerForm';
import EventList from './team/EventList';
import PaddlerGrid from './team/PaddlerGrid';
import { Paddler } from '@/types';

const TeamView: React.FC = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const { 
    events, 
    paddlers, 
    createEvent, 
    updateAttendance, 
    addPaddler, 
    updatePaddler, 
    deletePaddler,
    isDarkMode,
    toggleDarkMode
  } = useDrachenboot();

  // --- LOCAL UI STATE ---
  const [editingPaddlerId, setEditingPaddlerId] = useState<number | string | null>(null);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // --- COMPUTED ---
  const sortedPaddlers = useMemo(() => 
    [...paddlers].filter((p) => !p.isCanister).sort((a, b) => a.name.localeCompare(b.name)), 
  [paddlers]);

  const paddlerToEdit = useMemo(() => 
    editingPaddlerId ? paddlers.find(p => p.id === editingPaddlerId) || null : null,
  [editingPaddlerId, paddlers]);

  // --- ACTIONS ---
  const handleCreateEvent = (title: string, date: string) => {
    createEvent(title, date);
  };

  const handlePlanEvent = (eid: number) => {
    router.push(`/app/planner?id=${eid}`);
  };

  const handleSavePaddler = (data: Pick<Paddler, 'name' | 'weight' | 'skills'>) => {
    if (editingPaddlerId) {
      updatePaddler(editingPaddlerId, data);
      setEditingPaddlerId(null);
    } else {
      addPaddler(data);
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

  return (
    <div className="min-h-screen font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 bg-slate-100 dark:bg-slate-950 p-2 md:p-4 pb-20">
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      
      <div className="max-w-6xl mx-auto">
        <Header 
          title={t('appTitle')}
          subtitle={t('teamManager')}
          logo={
            <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
              <DragonLogo className="w-10 h-10" />
            </Link>
          }
          showHelp={true}
          onHelp={() => setShowHelp(true)}
          showThemeToggle={true}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          showInstallButton={true}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Neuer Termin */}
          <div className="lg:col-span-1 lg:order-1 flex flex-col">
            <NewEventForm onCreate={handleCreateEvent} t={t} />
          </div>

          {/* Paddler Form */}
          <div className="lg:col-span-2 lg:order-2 flex flex-col">
            <PaddlerForm 
              paddlerToEdit={paddlerToEdit} 
              onSave={handleSavePaddler} 
              onCancel={handleCancelEdit} 
              t={t} 
            />
          </div>
            
          {/* Event Liste */}
          <div className="lg:col-span-1 lg:order-3 flex flex-col">
            <EventList 
              events={events} 
              sortedPaddlers={sortedPaddlers} 
              onPlan={handlePlanEvent} 
              onUpdateAttendance={updateAttendance} 
              t={t} 
            />
          </div>

          {/* Paddler Grid */}
          <div className="lg:col-span-2 lg:order-4 flex flex-col">
            <PaddlerGrid 
              paddlers={sortedPaddlers} 
              editingId={editingPaddlerId} 
              onEdit={handleEditPaddler} 
              onDelete={handleDeletePaddler} 
              t={t} 
            />
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default TeamView;
