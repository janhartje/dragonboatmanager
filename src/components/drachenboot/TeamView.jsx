import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ChevronRight, Check, HelpCircle, X, User, Pencil, Save, Plus, Users, Trash2, Drum, ShipWheel, Sun, Moon, Info, Ship } from 'lucide-react';
import { useDrachenboot } from '@/context/DrachenbootContext';
import { useLanguage } from '@/context/LanguageContext';
import SkillBadges from '../ui/SkillBadges';
import { HelpModal } from '../ui/Modals';
import DragonLogo from '../ui/DragonLogo';
import Header from '../ui/Header';
import Footer from '../ui/Footer';

const TeamView = () => {
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
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [paddlerFormName, setPaddlerFormName] = useState('');
  const [paddlerFormWeight, setPaddlerFormWeight] = useState('');
  const [paddlerFormSkills, setPaddlerFormSkills] = useState({ left: false, right: false, drum: false, steer: false });
  const [editingPaddlerId, setEditingPaddlerId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  // --- COMPUTED ---
  const sortedPaddlers = useMemo(() => 
    [...paddlers].filter((p) => !p.isCanister).sort((a, b) => a.name.localeCompare(b.name)), 
  [paddlers]);

  // --- ACTIONS ---
  const handleCreateEvent = (e) => {
    e.preventDefault();
    if (!newEventTitle || !newEventDate) return;
    createEvent(newEventTitle, newEventDate);
    setNewEventTitle('');
    setNewEventDate('');
  };

  const handlePlanEvent = (eid) => {
    router.push(`/planner?id=${eid}`);
  };

  const toggleSkill = (skill) => {
    setPaddlerFormSkills((prev) => ({ ...prev, [skill]: !prev[skill] }));
  };

  const resetPaddlerForm = () => {
    setEditingPaddlerId(null);
    setPaddlerFormName('');
    setPaddlerFormWeight('');
    setPaddlerFormSkills({ left: false, right: false, drum: false, steer: false });
  };

  const handleSavePaddler = (e) => {
    e.preventDefault();
    if (!paddlerFormName || !paddlerFormWeight) return;
    const skillsArray = Object.keys(paddlerFormSkills).filter((k) => paddlerFormSkills[k]);
    if (skillsArray.length === 0) { alert(t('pleaseChooseRole')); return; }
    
    const pData = { name: paddlerFormName, weight: parseFloat(paddlerFormWeight), skills: skillsArray };
    
    if (editingPaddlerId) {
      updatePaddler(editingPaddlerId, pData);
      setEditingPaddlerId(null);
    } else {
      addPaddler(pData);
    }
    resetPaddlerForm();
  };

  const handleEditPaddler = (p) => {
    setEditingPaddlerId(p.id);
    setPaddlerFormName(p.name);
    setPaddlerFormWeight(p.weight);
    const sObj = { left: false, right: false, drum: false, steer: false };
    if (p.skills) p.skills.forEach((s) => sObj[s] = true);
    setPaddlerFormSkills(sObj);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const triggerDelete = (id) => {
    if (deleteConfirmId === id) { 
      deletePaddler(id); 
      setDeleteConfirmId(null); 
      if (editingPaddlerId === id) resetPaddlerForm();
    } else { 
      setDeleteConfirmId(id); 
      setTimeout(() => setDeleteConfirmId(null), 3000); 
    }
  };

  return (
    <div className="min-h-screen font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 bg-slate-100 dark:bg-slate-950 p-2 md:p-4 pb-20">
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      
      <div className="max-w-6xl mx-auto">
        <Header 
          title={t('appTitle')}
          subtitle={t('teamManager')}
          logo={<DragonLogo className="w-10 h-10" />}
          showHelp={true}
          onHelp={() => setShowHelp(true)}
          showThemeToggle={true}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Neuer Termin */}
          <div className="lg:col-span-1 lg:order-1 flex flex-col">
            <div id="tour-new-event" className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 h-full">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                <Calendar size={16} className="text-slate-700 dark:text-slate-200" /> {t('newTermin')}
              </h3>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 block">{t('title')}</label>
                  <input className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm outline-none text-slate-800 dark:text-white placeholder:text-slate-400" placeholder={t('eventPlaceholder')} value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 block">{t('date')}</label>
                  <input type="date" className={`w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm outline-none dark:[color-scheme:dark] ${newEventDate ? 'text-slate-800 dark:text-white' : 'text-slate-400'} [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 transition-opacity`} value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} />
                </div>
                <div className="pt-2">
                  <button type="submit" className="w-full h-9 bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2">
                    <Plus size={16} /> {t('add')}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Paddler Form */}
          <div className="lg:col-span-2 lg:order-2 flex flex-col">
            <div id="tour-paddler-form" className={`p-6 rounded-xl shadow-sm border transition-all h-full ${editingPaddlerId ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 ring-1 ring-orange-200 dark:ring-orange-900' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
              <h3 className={`font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wide ${editingPaddlerId ? 'text-orange-800 dark:text-orange-200' : 'text-slate-700 dark:text-slate-200'}`}>
                {editingPaddlerId ? <Pencil size={16} /> : <User size={16} />} {editingPaddlerId ? t('editPaddler') : t('newMember')}
              </h3>
              <form onSubmit={handleSavePaddler} className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 block">{t('name')}</label>
                    <input className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm outline-none dark:text-white" value={paddlerFormName} onChange={(e) => setPaddlerFormName(e.target.value)} placeholder={t('name')} />
                  </div>
                  <div className="w-full md:w-32">
                    <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 block">{t('weight')}</label>
                    <input type="number" className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm outline-none dark:text-white" value={paddlerFormWeight} onChange={(e) => setPaddlerFormWeight(e.target.value)} placeholder="kg" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-2 block">{t('skills')}</label>
                  <div className="flex gap-2 flex-wrap">
                    <button type="button" onClick={() => toggleSkill('left')} className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${paddlerFormSkills.left ? 'bg-red-500 border-red-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>{t('left')}</button>
                    <button type="button" onClick={() => toggleSkill('right')} className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${paddlerFormSkills.right ? 'bg-green-500 border-green-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>{t('right')}</button>
                    <button type="button" onClick={() => toggleSkill('drum')} className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-1 ${paddlerFormSkills.drum ? 'bg-yellow-400 border-yellow-500 text-yellow-900' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}><Drum size={12} /> {t('drum')}</button>
                    <button type="button" onClick={() => toggleSkill('steer')} className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-1 ${paddlerFormSkills.steer ? 'bg-purple-500 border-purple-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}><ShipWheel size={12} /> {t('steer')}</button>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  {editingPaddlerId && <button type="button" onClick={resetPaddlerForm} className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded text-sm">{t('cancel')}</button>}
                  <button type="submit" className={`text-white h-9 px-6 py-2 rounded text-sm font-medium flex items-center gap-2 ${editingPaddlerId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {editingPaddlerId ? <Save size={16} /> : <Plus size={16} />} {editingPaddlerId ? t('save') : t('add')}
                  </button>
                </div>
              </form>
            </div>
          </div>
            
          {/* Event Liste */}
          <div className="lg:col-span-1 lg:order-3 flex flex-col">
            <div id="tour-event-list" className="space-y-4 h-full">
              {events.sort((a, b) => new Date(a.date) - new Date(b.date)).map((evt) => {
                const yesCount = Object.values(evt.attendance).filter((s) => s === 'yes').length;
                return (
                  <div key={evt.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-white text-lg">{evt.title}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1"><Calendar size={14} /> {new Date(evt.date).toLocaleDateString('de-DE')}</div>
                      </div>
                      <div className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${evt.type === 'race' ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200' : 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200'}`}>
                        {evt.type === 'race' ? t('regatta') : t('training')}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg"><span className="text-green-600 dark:text-green-400 font-bold">{yesCount}</span> {t('promises')}</div>
                      <button onClick={() => handlePlanEvent(evt.id)} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-1">{t('plan')} <ChevronRight size={16} /></button>
                    </div>
                    <div className="mt-2 max-h-60 overflow-y-auto space-y-1 pt-2">
                      {sortedPaddlers.map((p) => {
                        const status = evt.attendance[p.id];
                        return (
                          <div key={p.id} className="flex justify-between items-center py-1 text-sm border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800 px-1 rounded">
                            <span className={`font-medium ${status === 'no' ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{p.name}</span>
                            <div className="flex gap-1">
                              <button onClick={() => updateAttendance(evt.id, p.id, 'yes')} className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${status === 'yes' ? 'bg-green-500 text-white border-green-600' : 'bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}><Check size={16} /></button>
                              <button onClick={() => updateAttendance(evt.id, p.id, 'maybe')} className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${status === 'maybe' ? 'bg-yellow-400 text-white border-yellow-500' : 'bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}><HelpCircle size={16} /></button>
                              <button onClick={() => updateAttendance(evt.id, p.id, 'no')} className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${status === 'no' ? 'bg-red-500 text-white border-red-600' : 'bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}><X size={16} /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Paddler Grid */}
          <div className="lg:col-span-2 lg:order-4 flex flex-col">
            <div id="tour-paddler-grid" className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 h-full">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide"><Users size={16} /> {t('squad')} ({paddlers.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sortedPaddlers.map((p) => (
                  <div key={p.id} className={`p-3 border rounded-xl transition-all relative group ${editingPaddlerId === p.id ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-750'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{p.name}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-mono">{p.weight} kg</div>
                      </div>
                      <SkillBadges skills={p.skills} />
                    </div>
                    <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditPaddler(p)} className="bg-white dark:bg-slate-700 text-slate-400 hover:text-orange-500 p-1.5 rounded-lg border dark:border-slate-600 shadow-sm"><Pencil size={12} /></button>
                      <button onClick={() => triggerDelete(p.id)} className={`p-1.5 rounded-lg border shadow-sm transition-colors ${deleteConfirmId === p.id ? 'bg-red-600 text-white border-red-700' : 'bg-white dark:bg-slate-700 text-slate-400 hover:text-red-500 dark:border-slate-600'}`}><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default TeamView;
