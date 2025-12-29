import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from "next-auth/react";
import { useDrachenboot } from '@/context/DrachenbootContext';
import { useLanguage } from '@/context/LanguageContext';
import { HelpModal, AlertModal } from '../ui/Modals';
import { OnboardingModal } from '../auth/OnboardingModal';
import DragonLogo from '../ui/DragonLogo';
import Header from '../ui/Header';
import Footer from '../ui/Footer';
import TeamSwitcher from './TeamSwitcher';
import { UserMenu } from '@/components/auth/UserMenu';
import { updateProfile } from '@/app/actions/user';

import { Globe, Instagram, Plus, FileUp, Calendar } from 'lucide-react';
import { InfoCard } from '@/components/ui/InfoCard';


import { Event, Paddler } from '@/types';
import { EventModal } from './team/EventModal';
import PaddlerModal from './team/PaddlerModal';
import { EventsSection } from './team/EventsSection';
import PaddlerGrid from './team/PaddlerGrid';
import LoadingSkeleton from '../ui/LoadingScreens';
import PageTransition from '../ui/PageTransition';
import WelcomeView from './WelcomeView';
import { ImportModal } from './team/ImportModal';

const TeamView: React.FC = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const { 
    teams,
    paddlers,
    currentTeam,
    // updateTeam,
    addPaddler, 
    updatePaddler, 
    deletePaddler,
    isDarkMode,
    toggleDarkMode,
    userRole,
    isLoading,
    isDataLoading,
    refetchPaddlers,
    refetchEvents,
    importPaddlers,
    importEvents,
    createEvent,
    updateEvent,
  } = useDrachenboot();

  // --- REFRESH DATA ON MOUNT ---
  React.useEffect(() => {
    refetchPaddlers();
    refetchEvents();
  }, [refetchPaddlers, refetchEvents]);

  // --- LOCAL UI STATE ---
  const [editingPaddlerId, setEditingPaddlerId] = useState<number | string | null>(null);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showImport, setShowImport] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  
  // --- UPGRADE SUCCESS HANDLING ---
  const searchParams = useSearchParams();
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState<boolean>(false);
  
  React.useEffect(() => {
    if (searchParams.get('upgrade_success') === 'true') {
      setShowUpgradeSuccess(true);
      // Clean URL without reload
      window.history.replaceState({}, '', '/app');
    }
  }, [searchParams]);

  const handleCreateEvent = (title: string, date: string, type: 'training' | 'regatta', boatSize: 'standard' | 'small', comment?: string) => {
    createEvent(title, date, type, boatSize, comment);
  };

  const handleUpdateEvent = (id: string, title: string, date: string, type: 'training' | 'regatta', boatSize: 'standard' | 'small', comment?: string) => {
    updateEvent(id, { title, date, type, boatSize, comment });
  };


  // --- COMPUTED ---
  const sortedPaddlers = useMemo(() => 
    [...paddlers].filter((p) => !p.isCanister && !p.isGuest).sort((a, b) => a.name.localeCompare(b.name)), 
  [paddlers]);

  const paddlerToEdit = useMemo(() => 
    editingPaddlerId ? paddlers.find(p => p.id === editingPaddlerId) || null : null,
  [editingPaddlerId, paddlers]);

  const { data: session } = useSession(); // Get session to identify current user
  
  // --- ONBOARDING LOGIC ---
  const myPaddler = useMemo(() => {
    if (session?.user?.id && paddlers.length) {
      return paddlers.find(p => p.userId === session.user.id);
    }
    return null;
  }, [session, paddlers]);

  const showOnboarding = useMemo(() => {
    if (!myPaddler) return false;
    // Check if critical data is missing: Name, Weight (<=0), or Skills (empty)
    // We ignore Guest/Canister (they don't log in anyway)
    // We only force onboarding if they are actual members (userId exists, which myPaddler implies)
    
    // Check missing name
    if (!myPaddler.name || myPaddler.name.trim() === '') return true;

    // Check missing weight
    if (!myPaddler.weight || myPaddler.weight <= 0) return true;
    
    // Check missing skills (optional, but requested by user)
    // A user might legit have no skills preference, but usually left/right is min.
    // Let's enforce at least one skill to ensure seat planning works.
    if (!myPaddler.skills || myPaddler.skills.length === 0) return true;

    return false;
  }, [myPaddler]);


  // --- ACTIONS ---
  const handleOnboardingSave = async (data: Partial<import('@/types').Paddler>) => {
    if (!myPaddler) return;
    if (!data.name || !data.weight) return;
    try {
      // Use updateProfile to sync Name/Weight globally and set Skills efficiently
      // Pass currentTeam.id to ensure skills are updated for this team context
      await updateProfile(
        { 
          name: data.name, 
          weight: data.weight, 
          skills: data.skills || []
        }, 
        currentTeam?.id
      );
      
      // Refresh local data
      await updatePaddler(myPaddler.id, data); // Keep this to trigger context refresh if needed, roughly redundant but safe
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : t('errorSavingPaddler'));
    }
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
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : t('errorSavingPaddler'));
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



    const handleImportPaddlers = async (rows: Record<string, unknown>[]) => {
      // Expected: Name | Weight | Side | Skills | Email
      // Backend expects: { name, weight, side, skills, ... }
      // We map the rows to match backend expectation
      const mappedPaddlers = rows.map(row => {
        const keys = Object.keys(row);
        const nameKey = keys.find(k => k.toLowerCase().includes('name'));
        const weightKey = keys.find(k => k.toLowerCase().includes('weight') || k.toLowerCase().includes('gewicht'));
        const sideKey = keys.find(k => k.toLowerCase().includes('side') || k.toLowerCase().includes('seite') || k.toLowerCase().includes('rolle'));
        const emailKey = keys.find(k => k.toLowerCase().includes('email') || k.toLowerCase().includes('mail'));
        
        if (!nameKey || !row[nameKey]) return null;

        const name = row[nameKey];
        const weight = weightKey ? parseFloat(String(row[weightKey])) : 0;
        
        // Parse Side/Role
        // Valid: left, right, drum, steer (case insensitive)
        // multiple values can be comma separated
        const sideStrRaw = sideKey ? String(row[sideKey]).toLowerCase() : '';
        

        
        // Dictionary for multilingual support
        const dict = {
          left: ['left', 'links', 'l', 'gauche', 'sinistra', 'izquierda', 'lewa'],
          right: ['right', 'rechts', 'r', 'droite', 'destra', 'derecha', 'prawa'],
          drum: ['drum', 'trommel', 'drummer', 'trommler', 'd', 'tambour', 'cox', 'canister'], // canister logic handles weight, but role might be drum?
          steer: ['steer', 'steuer', 'steuermann', 'helm', 's', 'barreur', 'timoniere', 'timonel'],
          both: ['both', 'beide', 'b', 'l/r', 'r/l', 'l+r', 'r+l', 'lr', 'rl']
        };

        const foundRoles = new Set<string>();

        const parts = sideStrRaw.split(/[,/|&+\s]+/).filter((p: string) => p.trim().length > 0);

        parts.forEach(part => {
             const p = part.trim();
             // Check against dictionaries
             if (dict.both.some(term => p === term || p.includes(term))) {
                foundRoles.add('left');
                foundRoles.add('right');
             }
             else {
               if (dict.left.some(term => p === term || (term.length > 2 && p.includes(term)))) foundRoles.add('left');
               if (dict.right.some(term => p === term || (term.length > 2 && p.includes(term)))) foundRoles.add('right');
               if (dict.drum.some(term => p === term || (term.length > 1 && p.includes(term)))) foundRoles.add('drum');
               if (dict.steer.some(term => p === term || (term.length > 1 && p.includes(term)))) foundRoles.add('steer');
             }
        });

        // Determine main 'side' property for UI preference


        // Skills MUST contain 'left'/'right' for the algorithm to work, plus drum/steer
        let skills = Array.from(foundRoles);

        // Fallback: If no side detected, default to 'left' for safety (or keep null if pure special role?)
        // Algorithm needs side in skills. If we have drum but no side, they can't paddle.
        // But maybe that's intended (pure drummer).
        // If nothing at all:
        if (skills.length === 0) {
 
             skills = ['left'];
        }
        


        return {
           name,
           weight: isNaN(weight) ? 0 : weight,

           skills,
           inviteEmail: emailKey ? row[emailKey] : undefined
        } as unknown as import('@/types').Paddler;
      }).filter((p): p is import('@/types').Paddler => p !== null);

      if (mappedPaddlers.length > 0) {
         await importPaddlers(mappedPaddlers as unknown as Record<string, unknown>[]);
      }
    };

    const handleImportEvents = async (rows: Record<string, unknown>[]) => {
      // Expected: Title | Date | Time | Type | BoatSize
      const mappedEvents = rows.map(row => {
        const keys = Object.keys(row);
        const titleKey = keys.find(k => k.toLowerCase().includes('title') || k.toLowerCase().includes('titel') || k.toLowerCase().includes('name'));
        const dateKey = keys.find(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('datum'));
        const timeKey = keys.find(k => k.toLowerCase().includes('time') || k.toLowerCase().includes('zeit') || k.toLowerCase().includes('uhr')); 
        const typeKey = keys.find(k => k.toLowerCase().includes('type') || k.toLowerCase().includes('typ'));
        const boatKey = keys.find(k => k.toLowerCase().includes('boat') || k.toLowerCase().includes('boot'));
        const commentKey = keys.find(k => k.toLowerCase().includes('comment') || k.toLowerCase().includes('kommentar') || k.toLowerCase().includes('bemerkung') || k.toLowerCase().includes('hinweis'));

        if (!titleKey || !row[titleKey] || !dateKey || !row[dateKey]) return null;

        const title = row[titleKey];
        let dateStr = row[dateKey];
        
        // Quick normalization for DD.MM.YYYY
        if (typeof dateStr === 'string' && dateStr.includes('.')) {
          const parts = dateStr.split('.');
          if (parts.length === 3) dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        
        // Excel often returns 5-digit number for dates. We might need a helper if we want to be robust,
        // but for now relying on string input or standard ISO.
        // If it's a number (Excel serial date), we skip simplistic conversion here to save space, 
        // assuming user provides string or basic format.

        let dateTimeStr = String(dateStr);
        if (timeKey && row[timeKey]) {
           dateTimeStr += `T${row[timeKey]}`;
        } else {
           dateTimeStr += 'T19:00:00'; 
        }

        const dateObj = new Date(dateTimeStr);
        if (isNaN(dateObj.getTime())) return null;

        const typeRaw = typeKey ? String(row[typeKey]).toLowerCase() : 'training';
        const type = typeRaw.includes('regatta') ? 'regatta' : 'training';

        const boatRaw = boatKey ? String(row[boatKey]).toLowerCase() : 'standard';
        const boatSize = boatRaw.includes('small') || boatRaw.includes('klein') || boatRaw.includes('10') ? 'small' : 'standard';

        const comment = commentKey ? row[commentKey] : null;

        return { title, date: dateTimeStr, type, boatSize, comment } as Event;
      }).filter((e): e is Event => e !== null);

      if (mappedEvents.length > 0) {
        await importEvents(mappedEvents as unknown as Record<string, unknown>[]);
      }
    };

  if (isLoading || isDataLoading) {
    return <LoadingSkeleton />;
  }

  // Show welcome page for users with no teams
  if (teams.length === 0) {
    return <WelcomeView />;
  }

  return (
    <PageTransition>
      <div id="tour-welcome" className="min-h-screen font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 bg-slate-100 dark:bg-slate-950 p-2 md:p-4 pb-20">
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        
        <div className="max-w-6xl mx-auto">
          <Header 
            title={t('appTitle')}
            subtitle={t('teamManager')}
            badge={
              currentTeam?.plan === 'PRO' ? (
                <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/50">PRO</span>
              ) : (
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">FREE</span>
              )
            }
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

          {/* Team Metadata / Social Links */}
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
              {/* ... other social links skipped for brevity if not changed ... */}
            </div>
          )}

          {userRole === 'CAPTAIN' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Event Liste (Now full height or spanned if needed, but keeping layout similar to before but without form) */}
              {/* Used to have NewEventForm in col 1. Now we can span EventList? Or keep layout. 
                  Actually EventList is col-1 order-3. NewEventForm was col-1 order-1.
                  Let's make EventList take full column for now or just remove the hole?
                  If I remove the hole, PaddlerGrid takes 2 cols and EventList takes 1 col.
                  That works.
              */}
              
              <div className="lg:col-span-1 flex flex-col">
                <EventsSection sortedPaddlers={sortedPaddlers} onEdit={setEditingEvent} />
                 {(currentTeam?.plan === 'FREE' || !currentTeam?.plan) && (
                    <InfoCard 
                      id={`upgrade_prompt_team_${currentTeam?.id}`}
                      className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6"
                      allowedRoles={['CAPTAIN']}
                    >
                      <h3 className="text-lg font-bold text-amber-800 dark:text-amber-500 mb-2 pr-6">
                        {t('pro.upgradeTitle')} 🔗
                      </h3>
                      <p className="text-sm text-amber-700 dark:text-amber-400 mb-4">
                        {t('pro.upgradeDescription')}
                      </p>
                      <button
                        onClick={() => router.push(`/app/teams/${currentTeam?.id}/upgrade`)}
                        className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-lg shadow-sm transition-all transform hover:scale-[1.02]"
                      >
                        {t('pro.upgradeButton')}
                      </button>
                    </InfoCard>
                 )}
              </div>

              {/* Paddler Grid */}
              <div className="lg:col-span-2 flex flex-col">
                <PaddlerGrid 
                  paddlers={sortedPaddlers} 
                  editingId={editingPaddlerId === 'new' ? null : editingPaddlerId} 
                  onEdit={handleEditPaddler} 
                  onDelete={handleDeletePaddler} 
                  t={t}
                  headerAction={
                    <div className="flex gap-2 flex-wrap justify-end">
                      <button 
                        onClick={() => setShowImport(true)}
                        className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 h-8 rounded text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                      >
                         <FileUp size={16} />
                         {t('import') || 'Import'}
                      </button>

                       <button 
                          id="tour-new-event"
                         onClick={() => setShowEventModal(true)}
                         className="bg-blue-600 hover:bg-blue-700 text-white px-3 h-8 rounded text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                       >
                          <Calendar size={16} />
                          {t('newTermin')}
                       </button>
                      <button 
                        id="tour-paddler-form"
                        onClick={() => setEditingPaddlerId('new')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 h-8 rounded text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                      >
                        <Plus size={16} />
                        {t('addPaddler')}
                      </button>
                    </div>
                  }
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Event Liste */}
              <div className="lg:col-span-1 flex flex-col">
                <EventsSection sortedPaddlers={sortedPaddlers} onEdit={setEditingEvent} />

              </div>

              {/* Paddler Grid */}
              <div className="lg:col-span-2 flex flex-col">
                <PaddlerGrid 
                  paddlers={sortedPaddlers} 
                  editingId={null} 
                  onEdit={handleEditPaddler} 
                  onDelete={handleDeletePaddler} 
                  t={t}
                />
              </div>
            </div>
          )}
          
          {/* Paddler Modal */}
          {userRole === 'CAPTAIN' && (
            <>
              <PaddlerModal
                isOpen={!!editingPaddlerId}
                onClose={() => setEditingPaddlerId(null)}
                paddlerToEdit={editingPaddlerId === 'new' ? null : paddlerToEdit}
                onSave={handleSavePaddler}
                t={t}
                teamMembers={paddlers.filter(p => p.userId).map(p => ({ userId: p.userId, name: p.name, email: p.user?.email || '' }))}
                errorMessage={errorMessage}
              />

              <EventModal
                isOpen={showEventModal || !!editingEvent}
                onClose={() => { setShowEventModal(false); setEditingEvent(null); }}
                onCreate={handleCreateEvent}
                onUpdate={handleUpdateEvent}
                initialData={editingEvent}
              />
            </>
          )}
          <Footer />
        </div>
        
        {/* Import Modal */}
        <ImportModal 
          isOpen={showImport} 
          onClose={() => setShowImport(false)}
          onImportPaddlers={handleImportPaddlers}
          onImportEvents={handleImportEvents}
        />
      </div>
      
      {/* Onboarding Modal */}
      {showOnboarding && myPaddler && (
        <OnboardingModal
          paddler={myPaddler}
          onClose={() => {}} // Mandatory modal, cannot be closed without saving
          onSave={handleOnboardingSave}
        />
      )}
      
      {/* Upgrade Success Modal */}
      <AlertModal
        isOpen={showUpgradeSuccess}
        message={t('pro.upgradeSuccessMessage')}
        onClose={() => setShowUpgradeSuccess(false)}
        type="info"
        title={t('pro.upgradeSuccessTitle')}
      />
    </PageTransition>
  );
};

export default TeamView;
