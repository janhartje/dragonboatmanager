import React, { useState } from 'react';
import { Calendar, Plus } from 'lucide-react';

interface NewEventFormProps {
  onCreate: (title: string, date: string, type: 'training' | 'regatta', boatSize: 'standard' | 'small') => void;
  t: (key: string) => string;
}

const NewEventForm: React.FC<NewEventFormProps> = ({ onCreate, t }) => {
  const [title, setTitle] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [type, setType] = useState<'training' | 'regatta'>('training');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;
    onCreate(title, date, type, 'standard');
    setTitle('');
    setDate('');
    setType('training');
  };

  return (
    <div id="tour-new-event" className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 h-full">
      <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
        <Calendar size={16} className="text-slate-700 dark:text-slate-200" /> {t('newTermin')}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 block">{t('title')}</label>
          <input 
            className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm outline-none text-slate-800 dark:text-white placeholder:text-slate-400" 
            placeholder={t('eventPlaceholder')} 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
          />
        </div>
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 block">{t('date')}</label>
          <input 
            type="date" 
            className={`w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm outline-none dark:[color-scheme:dark] ${date ? 'text-slate-800 dark:text-white' : 'text-slate-400'} [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 transition-opacity`} 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
          />
        </div>
        <div className="pt-2">
          <button type="submit" className="w-full h-9 bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2">
            <Plus size={16} /> {t('add')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewEventForm;
