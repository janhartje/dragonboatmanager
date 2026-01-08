import React from 'react';
import { useRouter } from '@/i18n/routing';
import { useDrachenboot } from '@/context/DrachenbootContext';
import { useTranslations } from 'next-intl';
import { Event, Paddler } from '@/types';
import EventList from './EventList';

import { filterFutureEvents } from '@/utils/event-utils';

interface EventsSectionProps {
  sortedPaddlers: Paddler[];
  onEdit: (event: Event) => void;
}

export const EventsSection: React.FC<EventsSectionProps> = ({ sortedPaddlers, onEdit }) => {
  const router = useRouter();
  const t = useTranslations();
  const { 
    events, 
    deleteEvent,
    updateAttendance, 
  } = useDrachenboot();

  const filteredEvents = React.useMemo(() => filterFutureEvents(events), [events]);

  const handleDeleteEvent = (id: string) => {
    deleteEvent(id);
  };

  const handlePlanEvent = (eid: number | string) => {
    router.push(`/app/planner?id=${eid}`);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <EventList 
        events={filteredEvents} 
        sortedPaddlers={sortedPaddlers} 
        onPlan={handlePlanEvent}
        onEdit={onEdit}
        onDelete={handleDeleteEvent}
        onUpdateAttendance={updateAttendance} 
        t={t} 
      />
    </div>
  );
};
