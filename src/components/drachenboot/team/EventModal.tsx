import React, { useState } from 'react';
import { X, Calendar, Plus, Save } from 'lucide-react';
import { FormInput } from '@/components/ui/FormInput';
import { useLanguage } from '@/context/LanguageContext';

import { Event } from '@/types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (title: string, date: string, type: 'training' | 'regatta', boatSize: 'standard' | 'small', comment?: string) => void;
  onUpdate?: (id: string, title: string, date: string, type: 'training' | 'regatta', boatSize: 'standard' | 'small', comment?: string) => void;
  initialData?: Event | null;
}

export const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onCreate, onUpdate, initialData }) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(''); // Stores YYYY-MM-DDTHH:mm
  const [comment, setComment] = useState('');
  const [type, setType] = useState<'training' | 'regatta'>('training');
  const [boatSize, setBoatSize] = useState<'standard' | 'small'>('standard');
  const [touched, setTouched] = useState(false);

  // Initialize from initialData when modal opens
  React.useEffect(() => {
    if (isOpen && initialData) {
      setTitle(initialData.title);
      setComment(initialData.comment || '');
      setType((initialData.type as 'training' | 'regatta') || 'training');
      setBoatSize((initialData.boatSize as 'standard' | 'small') || 'standard');
      
      // Convert UTC timestamp to local YYYY-MM-DDTHH:mm for datetime-local input
      if (initialData.date) {
        const d = new Date(initialData.date);
        // Format to local ISO-like string
        const localIso = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        setDate(localIso);
      }
    } else if (isOpen && !initialData) {
       // Reset for new event
       setTitle('');
       setDate('');
       setComment('');
       setType('training');
       setBoatSize('standard');
    }
  }, [isOpen, initialData]);

  // Initialize date with default time if empty (optional, or leave empty)
  // Or better: don't force default, let user pick.

  if (!isOpen) return null;

  const isFormValid = title.trim() !== '' && date.trim() !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    
    if (!isFormValid) return;

    // date is "YYYY-MM-DDTHH:mm" (Local)
    // Create Date object and convert to ISO (UTC)
    const dateObj = new Date(date);
    const fullDate = dateObj.toISOString();

    if (initialData && onUpdate) {
      onUpdate(initialData.id, title, fullDate, type, boatSize, comment);
    } else if (onCreate) {
      onCreate(title, fullDate, type, boatSize, comment);
    }
    
    // Reset and close
    setTouched(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="text-blue-600 dark:text-blue-400" />
            {initialData ? t('editEvent') || 'Termin bearbeiten' : t('newTermin')}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 block">{t('title')}</label>
            <FormInput
              placeholder={t('eventPlaceholder')} 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              error={touched && !title.trim()}
              autoFocus
            />
          </div>

            {/* Date & Time */}
            <div className="col-span-2">
              <label className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 block">{t('dateAndTime') || 'Datum & Uhrzeit'}</label>
              <FormInput
                type="datetime-local" 
                className={`dark:[color-scheme:dark] ${date ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`} 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                error={touched && !date.trim()}
              />
            </div>

          {/* Comment */}
          <div>
            <label className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 block">{t('comment') || 'Kommentar'}</label>
            <textarea
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
              rows={2}
              placeholder={t('commentPlaceholder') || 'Infos zum Training...'}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {/* Type Selection */}
          <div>
             <label className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 mb-2 block">{t('type') || 'Typ'}</label>
             <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
               <button
                 type="button"
                 onClick={() => setType('training')}
                 className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                   type === 'training' 
                     ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                     : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                 }`}
               >
                 Training
               </button>
               <button
                 type="button"
                 onClick={() => setType('regatta')}
                 className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                   type === 'regatta' 
                     ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                     : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                 }`}
               >
                 Regatta
               </button>
             </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-slate-100 dark:border-slate-800">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg transition-colors hover:text-slate-700 dark:hover:text-slate-200"
            >
              {t('cancel')}
            </button>
            <button 
              type="submit" 
              disabled={!isFormValid}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-all flex items-center gap-2
                ${isFormValid 
                  ? (initialData ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700')
                  : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-70'
                }`}
            >
              {initialData ? <Save size={16} /> : <Plus size={16} />} {initialData ? t('save') : t('add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
