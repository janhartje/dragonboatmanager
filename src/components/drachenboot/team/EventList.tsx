import React, { memo, useState } from 'react';
import { Calendar, ChevronRight, Check, HelpCircle, X, Trash2, Pencil, ChevronDown, ChevronUp, ChevronLeft } from 'lucide-react';
import { Event, Paddler } from '@/types';
import { useDrachenboot } from '@/context/DrachenbootContext';
import { useTeam } from '@/context/TeamContext';
import { useLocale } from 'next-intl';
import { THEME_MAP, ThemeKey } from '@/constants/themes';
import { Card } from '@/components/ui/core/Card';
import { IconButton } from '@/components/ui/core/IconButton';
import { Badge } from '@/components/ui/core/Badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarUrl, getInitials } from '@/lib/avatar-utils';

// --- Sub-Component: EventCard ---
// Extracting this allows each card to manage its own "expanded" state independently,
// preventing a re-render of the entire list when one toggle changes.
interface EventCardProps {
  evt: Event;
  sortedPaddlers: Paddler[];
  onPlan: (eventId: number | string) => void;
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
  onUpdateAttendance: (eventId: string, paddlerId: number | string, status: 'yes' | 'no' | 'maybe') => void;
  t: (key: string) => string;
  userRole: string | null;
  currentPaddler: Paddler | null;
  theme: (typeof THEME_MAP)[keyof typeof THEME_MAP] | null;
  locale: string;
}

const EventCard: React.FC<EventCardProps> = memo(({
  evt,
  sortedPaddlers,
  onPlan,
  onEdit,
  onDelete,
  onUpdateAttendance,
  t,
  userRole,
  currentPaddler,
  theme,
  locale
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const triggerDelete = () => {
    if (deleteConfirmId === evt.id) {
      onDelete(evt.id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(evt.id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };


  const isConfirming = deleteConfirmId === evt.id;

  return (
    <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200">
      {/* Header Row: Title & Type Badge + Plan Button */}
      {/* Header Row: Title & Type Badge + Plan Button */}
      <div className="flow-root mb-2">
        {/* Buttons (Floated Right) */}
        <div className="float-right ml-4 flex items-center gap-2">
          {userRole === 'CAPTAIN' && (
            <>
              <button
                onClick={() => onEdit(evt)}
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Bearbeiten"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={triggerDelete}
                className={`h-9 w-9 flex items-center justify-center rounded-lg border transition-colors ${isConfirming
                    ? 'bg-red-100 dark:bg-red-900/50 border-red-400 dark:border-red-700 text-red-600 dark:text-red-400'
                    : 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800'
                  }`}
                title={isConfirming ? "Bestätigen" : "Löschen"}
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
          <button
            onClick={() => onPlan(evt.id)}
            className={`${theme?.button || 'bg-blue-600 hover:bg-blue-500'} text-white px-3 h-9 rounded-lg font-medium text-sm flex items-center gap-1 transition-colors whitespace-nowrap`}
          >
            {userRole === 'CAPTAIN' ? t('plan') : t('viewPlan')}
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Text Content (Flows around buttons) */}
        <div className="flex items-center gap-3 flex-wrap mb-1">
          <h3 className="font-bold text-xl text-slate-900 dark:text-white">{evt.title}</h3>
          <Badge
            className="bg-slate-200 dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-slate-300 dark:hover:bg-slate-700 border-none uppercase text-xs font-bold tracking-wider px-2 py-0.5"
          >
            {evt.type === 'regatta' ? t('regatta') : t('training')}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-0.5">
          <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
          <span>{new Date(evt.date).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US')}</span>
          <span className="text-slate-400 dark:text-slate-600">•</span>
          <span>{new Date(evt.date).toLocaleTimeString(locale === 'de' ? 'de-DE' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <div className="flex items-center gap-2">
          {evt.comment && (
            <span className="text-slate-400 dark:text-slate-500 italic text-sm">{evt.comment}</span>
          )}
        </div>
      </div>

      {/* "Ich" Section */}
      {currentPaddler && (
        <div className="mb-2">
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); onUpdateAttendance(evt.id, currentPaddler.id, 'yes'); }}
              className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-lg border font-medium text-sm transition-all min-w-0 ${evt.attendance[currentPaddler.id] === 'yes'
                  ? 'bg-green-100 dark:bg-green-900/40 border-green-500 dark:border-green-700 text-green-700 dark:text-green-400'
                  : 'bg-transparent border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-green-500 dark:hover:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/10'
                }`}
            >
              <div className={`flex-shrink-0 p-0.5 rounded-full ${evt.attendance[currentPaddler.id] === 'yes' ? 'bg-green-500 text-white dark:text-black' : 'border border-current'}`}>
                <Check size={12} strokeWidth={3} />
              </div>
              <span className="truncate">{t('attend')}</span>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); onUpdateAttendance(evt.id, currentPaddler.id, 'maybe'); }}
              className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-lg border font-medium text-sm transition-all min-w-0 ${evt.attendance[currentPaddler.id] === 'maybe'
                  ? 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-500 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400'
                  : 'bg-transparent border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-yellow-500 dark:hover:border-yellow-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/10'
                }`}
            >
              <div className={`flex-shrink-0 p-0.5 rounded-full ${evt.attendance[currentPaddler.id] === 'maybe' ? 'bg-yellow-500 text-white dark:text-black' : 'border border-current'}`}>
                <HelpCircle size={12} strokeWidth={3} />
              </div>
              <span className="truncate">{t('unsure')}</span>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); onUpdateAttendance(evt.id, currentPaddler.id, 'no'); }}
              className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-lg border font-medium text-sm transition-all min-w-0 ${evt.attendance[currentPaddler.id] === 'no'
                  ? 'bg-red-100 dark:bg-red-900/40 border-red-500 dark:border-red-700 text-red-700 dark:text-red-400'
                  : 'bg-transparent border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-red-500 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/10'
                }`}
            >
              <div className={`flex-shrink-0 p-0.5 rounded-full ${evt.attendance[currentPaddler.id] === 'no' ? 'bg-red-500 text-white dark:text-black' : 'border border-current'}`}>
                <X size={12} strokeWidth={3} />
              </div>
              <span className="truncate">{t('decline')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Participants Accordion */}
      <div className="border border-slate-300 dark:border-white/20 rounded-xl overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-3 h-9 bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="font-medium text-sm text-slate-900 dark:text-white">{t('participants')}</span>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-green-400" title="Zugesagt">
                <Check size={12} strokeWidth={3} /> {Object.values(evt.attendance).filter(s => s === 'yes').length}
              </span>
              <span className="flex items-center gap-1 text-yellow-400" title="Unsicher">
                <HelpCircle size={12} strokeWidth={3} /> {Object.values(evt.attendance).filter(s => s === 'maybe').length}
              </span>
              <span className="flex items-center gap-1 text-red-400" title="Abgesagt">
                <X size={12} strokeWidth={3} /> {Object.values(evt.attendance).filter(s => s === 'no').length}
              </span>
              <span className="flex items-center gap-1 text-slate-500" title="Offen">
                <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-current" />
                {sortedPaddlers.filter(p => !evt.attendance[p.id]).length}
              </span>
            </div>
          </div>
          {isExpanded ? <ChevronUp size={16} className="text-slate-500 dark:text-slate-400" /> : <ChevronDown size={16} className="text-slate-500 dark:text-slate-400" />}
        </button>

        {isExpanded && (
          <div className="bg-transparent px-3 pb-3 space-y-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {sortedPaddlers
              .filter(p => userRole === 'CAPTAIN' || evt.attendance[p.id])
              .map((p) => {
                const status = evt.attendance[p.id];
                const canEdit = userRole === 'CAPTAIN' || (currentPaddler && currentPaddler.id === p.id);
                const getStatusColor = (s: string) => {
                  if (status === s) {
                    if (s === 'yes') return 'bg-green-100 dark:bg-green-900/50 border-green-500 dark:border-green-600 text-green-700 dark:text-green-400';
                    if (s === 'maybe') return 'bg-yellow-100 dark:bg-yellow-900/50 border-yellow-500 dark:border-yellow-600 text-yellow-700 dark:text-yellow-400';
                    if (s === 'no') return 'bg-red-100 dark:bg-red-900/50 border-red-500 dark:border-red-600 text-red-700 dark:text-red-400';
                  }
                  return 'border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5';
                };

                return (
                  <div key={p.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-3">
                      {/* Avatar with profile picture or initials fallback */}
                      <Avatar className="w-8 h-8 border border-slate-300 dark:border-slate-700">
                        {p.user?.id && <AvatarImage src={getAvatarUrl(p.user.id, p.user.image) || ''} alt={p.name} />}
                        <AvatarFallback className="bg-slate-200 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400">
                          {getInitials(p.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className={`font-medium ${status === 'no' ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>
                        {p.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        disabled={!canEdit}
                        onClick={() => onUpdateAttendance(evt.id, p.id, 'yes')}
                        className={`w-8 h-8 rounded border flex items-center justify-center transition-all ${getStatusColor('yes')}`}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        disabled={!canEdit}
                        onClick={() => onUpdateAttendance(evt.id, p.id, 'maybe')}
                        className={`w-8 h-8 rounded border flex items-center justify-center transition-all ${getStatusColor('maybe')}`}
                      >
                        <HelpCircle size={16} />
                      </button>
                      <button
                        disabled={!canEdit}
                        onClick={() => onUpdateAttendance(evt.id, p.id, 'no')}
                        className={`w-8 h-8 rounded border flex items-center justify-center transition-all ${getStatusColor('no')}`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </Card>
  );
});

EventCard.displayName = 'EventCard';

// --- Main EventList Component ---

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
  const { currentTeam } = useTeam();
  const theme = currentTeam?.plan === 'PRO' ? THEME_MAP[currentTeam.primaryColor as ThemeKey] : null;
  const locale = useLocale();

  const sortedEvents = React.useMemo(() => {
    return [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const totalPages = Math.ceil(sortedEvents.length / itemsPerPage);

  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  const paginatedEvents = sortedEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      <div id="tour-event-list" className="space-y-4">
        {paginatedEvents.map((evt) => (
          <EventCard
            key={evt.id}
            evt={evt}
            sortedPaddlers={sortedPaddlers}
            onPlan={onPlan}
            onEdit={onEdit}
            onDelete={onDelete}
            onUpdateAttendance={onUpdateAttendance}
            t={t}
            userRole={userRole}
            currentPaddler={currentPaddler}
            theme={theme}
            locale={locale}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center px-2">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {t('page')} {currentPage} {t('of')} {totalPages}
          </div>
          <div className="flex gap-2">
            <IconButton
              icon={ChevronLeft}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              className="bg-white dark:bg-slate-800"
            />
            <IconButton
              icon={ChevronRight}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              className="bg-white dark:bg-slate-800"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default EventList;
