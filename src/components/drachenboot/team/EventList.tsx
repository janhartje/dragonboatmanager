import React from 'react';
import { Calendar, ChevronRight, Check, HelpCircle, X, Trash2, Pencil } from 'lucide-react';
import { Event, Paddler } from '@/types';
import { useDrachenboot } from '@/context/DrachenbootContext';
import { useLanguage } from '@/context/LanguageContext';

interface EventListProps {
  events: Event[];
  sortedPaddlers: Paddler[];
  onPlan: (eventId: number | string) => void;
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
  onUpdateAttendance: (eventId: string, paddlerId: number | string, status: 'yes' | 'no' | 'maybe') => void;
  t: (key: string) => string;
}

const EventList: React.FC<EventListProps> = ({ events, sortedPaddlers, onPlan, onEdit, onDelete, onUpdateAttendance, t }) => {
  const { userRole, currentPaddler } = useDrachenboot();
  const { language } = useLanguage();
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

  const triggerDelete = (id: string) => {
    if (deleteConfirmId === id) {
      onDelete(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  return (
    <div id="tour-event-list" className="space-y-4 h-full">
      {events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((evt) => {
        const yesCount = Object.values(evt.attendance).filter((s) => s === 'yes').length;
        const isConfirming = deleteConfirmId === evt.id;
        return (
          <div key={evt.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-bold text-slate-800 dark:text-white text-lg">{evt.title}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} /> 
                    {new Date(evt.date).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')} 
                    <span className="text-slate-400">•</span>
                    {new Date(evt.date).toLocaleTimeString(language === 'de' ? 'de-DE' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {evt.comment && (
                    <div className="text-slate-500 dark:text-slate-500 text-xs italic">
                      {evt.comment}
                    </div>
                  )}
                </div>
              </div>
              <div className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${evt.type === 'regatta' ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200' : 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200'}`}>
                {evt.type === 'regatta' ? t('regatta') : t('training')}
              </div>
            </div>
            <div className="flex justify-between items-center mt-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg"><span className="text-green-600 dark:text-green-400 font-bold">{yesCount}</span> {t('promises')}</div>
              <div className="flex gap-2">
                {userRole === 'CAPTAIN' && (
                <button 
                  onClick={() => onEdit(evt)}
                  className="p-1 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                  title={t('edit') || 'Bearbeiten'}
                >
                  <Pencil size={16} />
                </button>
                )}
                {userRole === 'CAPTAIN' && (
                <button 
                  onClick={() => triggerDelete(evt.id)}
 
                  className={`text-sm px-3 py-2 rounded-lg transition-colors ${isConfirming ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'}`} 
                  title={t('delete')}
                >
                  <Trash2 size={16} />
                </button>
                )}
                <button onClick={() => onPlan(evt.id)} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-1">{userRole === 'CAPTAIN' ? t('plan') : t('viewPlan')} <ChevronRight size={16} /></button>
              </div>
            </div>
            <div className="mt-2 max-h-60 overflow-y-auto space-y-1 pt-2">
              {sortedPaddlers.map((p) => {
                const status = evt.attendance[p.id];
                const canEdit = userRole === 'CAPTAIN' || (currentPaddler && currentPaddler.id === p.id);
                const containerClass = canEdit ? '' : 'pointer-events-none cursor-not-allowed';
                
                const getButtonStyle = (btnStatus: 'yes' | 'maybe' | 'no') => {
                    const isSelected = status === btnStatus;
                    const base = "w-8 h-8 flex items-center justify-center rounded-lg border transition-all";
                    
                    // If read-only and this button is NOT selected, fade it out significantly
                    // If read-only and selected, keep it visible (but maybe slight visual cue it's locked? User asked for "same color", so keep it standard)
                    const opacity = (!canEdit && !isSelected) ? 'opacity-20' : ''; 
                    
                    let colors = "";
                    if (btnStatus === 'yes') {
                        colors = isSelected 
                            ? 'bg-green-500 text-white border-green-600' 
                            : 'bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700 hover:border-slate-300';
                    } else if (btnStatus === 'maybe') {
                         colors = isSelected 
                            ? 'bg-yellow-400 text-white border-yellow-500' 
                            : 'bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700 hover:border-slate-300';
                    } else { // no
                         colors = isSelected 
                            ? 'bg-red-500 text-white border-red-600' 
                            : 'bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700 hover:border-slate-300';
                    }
                    
                    return `${base} ${colors} ${opacity}`;
                };

                return (
                  <div key={p.id} className="flex justify-between items-center py-1 text-sm border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800 px-1 rounded">
                    <span className={`font-medium ${status === 'no' ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{p.name}</span>
                    <div className={`flex gap-1 ${containerClass}`}>
                      <button disabled={!canEdit} onClick={() => onUpdateAttendance(evt.id, p.id, 'yes')} className={getButtonStyle('yes')}><Check size={16} /></button>
                      <button disabled={!canEdit} onClick={() => onUpdateAttendance(evt.id, p.id, 'maybe')} className={getButtonStyle('maybe')}><HelpCircle size={16} /></button>
                      <button disabled={!canEdit} onClick={() => onUpdateAttendance(evt.id, p.id, 'no')} className={getButtonStyle('no')}><X size={16} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EventList;
