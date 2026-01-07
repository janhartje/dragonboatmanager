import React, { useState } from 'react';
import { Calendar, Plus, Save } from 'lucide-react';
import { FormInput } from '@/components/ui/FormInput';
import { useLanguage } from '@/context/LanguageContext';
import { THEME_MAP, ThemeKey } from '@/constants/themes';

import { useTeam } from '@/context/TeamContext';
import { Modal } from '@/components/ui/core/Modal';
import { SegmentedControl } from '@/components/ui/core/SegmentedControl';

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
  const { currentTeam } = useTeam();
  const theme = currentTeam?.plan === 'PRO' ? THEME_MAP[currentTeam.primaryColor as ThemeKey] : null;
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Calendar className={theme?.text || 'text-blue-600 dark:text-blue-400'} />
          {initialData ? t('editEvent') || 'Termin bearbeiten' : t('newTermin')}
        </span>
      }
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 rounded-lg transition-colors hover:text-slate-700 dark:hover:text-slate-200"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-all flex items-center gap-2
              ${isFormValid
                ? (initialData ? 'bg-orange-500 hover:bg-orange-600' : (theme?.button || 'bg-blue-600 hover:bg-blue-700'))
                : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-70'
              }`}
          >
            {initialData ? <Save size={16} /> : <Plus size={16} />} {initialData ? t('save') : t('add')}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
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
            className={`w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 ${theme ? theme.ringBorder.replace('border-', 'ring-').replace('group-hover:', '') : 'focus:ring-blue-500'} dark:text-white resize-none`}
            rows={2}
            placeholder={t('commentPlaceholder') || 'Infos zum Training...'}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {/* Type Selection */}
        <div>
          <label className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 mb-2 block">{t('type') || 'Typ'}</label>
          <SegmentedControl
            options={[
              { label: 'Training', value: 'training' },
              { label: 'Regatta', value: 'regatta' }
            ]}
            value={type}
            onChange={(val) => setType(val as 'training' | 'regatta')}
            isFullWidth
          />
        </div>
      </form>
    </Modal>
  );
};
