'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PlannerView from '@/components/drachenboot/PlannerView';

function PlannerContent() {
    const searchParams = useSearchParams();
    const eventId = searchParams.get('id');

    if (!eventId) return <div>Kein Event ausgewählt</div>;

    return <PlannerView eventId={eventId} />;
}

export default function PlannerPage() {
    return (
        <Suspense fallback={<div>Laden...</div>}>
            <PlannerContent />
        </Suspense>
    );
}
