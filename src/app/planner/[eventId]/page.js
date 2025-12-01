'use client';

import PlannerView from '@/components/drachenboot/PlannerView';

export default function PlannerPage({ params }) {
    return <PlannerView eventId={params.eventId} />;
}
