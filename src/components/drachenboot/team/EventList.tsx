import React from 'react';
import { Calendar, ChevronRight, Check, HelpCircle, X } from 'lucide-react';
import { Event, Paddler } from '@/types';

interface EventListProps {
  events: Event[];
  sortedPaddlers: Paddler[];
  onPlan: (eventId: number) => void;
  onUpdateAttendance: (eventId: number, paddlerId: number | string, status: 'yes' | 'no' | 'maybe') => void;
  t: (key: string) => string;
}

const EventList: React.FC<EventListProps> = ({ events, sortedPaddlers, onPlan, onUpdateAttendance, t }) => {
  return (
    <div id="tour-event-list" className="space-y-4 h-full">
      {events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((evt) => {
        const yesCount = Object.values(evt.attendance).filter((s) => s === 'yes').length;
        return (
          <div key={evt.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-bold text-slate-800 dark:text-white text-lg">{evt.title}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1"><Calendar size={14} /> {new Date(evt.date).toLocaleDateString('de-DE')}</div>
              </div>
              <div className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${evt.type === 'regatta' ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200' : 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200'}`}>
                {evt.type === 'regatta' ? t('regatta') : t('training')}
              </div>
            </div>
            <div className="flex justify-between items-center mt-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg"><span className="text-green-600 dark:text-green-400 font-bold">{yesCount}</span> {t('promises')}</div>
              <button onClick={() => onPlan(evt.id)} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-1">{t('plan')} <ChevronRight size={16} /></button>
            </div>
            <div className="mt-2 max-h-60 overflow-y-auto space-y-1 pt-2">
              {sortedPaddlers.map((p) => {
                const status = evt.attendance[p.id];
                return (
                  <div key={p.id} className="flex justify-between items-center py-1 text-sm border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800 px-1 rounded">
                    <span className={`font-medium ${status === 'no' ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{p.name}</span>
                    <div className="flex gap-1">
                      <button onClick={() => onUpdateAttendance(evt.id, p.id, 'yes')} className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${status === 'yes' ? 'bg-green-500 text-white border-green-600' : 'bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}><Check size={16} /></button>
                      <button onClick={() => onUpdateAttendance(evt.id, p.id, 'maybe')} className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${status === 'maybe' ? 'bg-yellow-400 text-white border-yellow-500' : 'bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}><HelpCircle size={16} /></button>
                      <button onClick={() => onUpdateAttendance(evt.id, p.id, 'no')} className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${status === 'no' ? 'bg-red-500 text-white border-red-600' : 'bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}><X size={16} /></button>
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
