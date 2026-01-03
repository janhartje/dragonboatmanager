import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createSetupIntent } from '@/services/stripe';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { teamId } = body;

    if (!teamId) {
        return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const { clientSecret } = await createSetupIntent(
        teamId, 
        session.user.id, 
        session.user.email ?? null
    );

    return NextResponse.json({ clientSecret });

  } catch (error) {
    console.error('Create SetupIntent Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
