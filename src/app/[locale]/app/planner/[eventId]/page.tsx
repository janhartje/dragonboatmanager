

import PlannerView from '@/components/drachenboot/PlannerView';

interface PlannerPageProps {
  params: Promise<{
    eventId: string;
  }>;
}

export default async function PlannerPage({ params }: PlannerPageProps) {
    const { eventId } = await params;
    return <PlannerView eventId={eventId} />;
}
