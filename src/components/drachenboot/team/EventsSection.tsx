import React from 'react';
import { useRouter } from 'next/navigation';
import { useDrachenboot } from '@/context/DrachenbootContext';
import { useLanguage } from '@/context/LanguageContext';
import { Event, Paddler } from '@/types';
import EventList from './EventList';

interface EventsSectionProps {
  sortedPaddlers: Paddler[];
  onEdit: (event: Event) => void;
}

export const EventsSection: React.FC<EventsSectionProps> = ({ sortedPaddlers, onEdit }) => {
  const router = useRouter();
  const { t } = useLanguage();
  const { 
    events, 
    deleteEvent,
    updateAttendance, 
  } = useDrachenboot();

  const handleDeleteEvent = (id: string) => {
    deleteEvent(id);
  };

  const handlePlanEvent = (eid: number | string) => {
    router.push(`/app/planner?id=${eid}`);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <EventList 
        events={events} 
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
