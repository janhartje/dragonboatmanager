import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        theme: true,
        language: true,
        activeTeamId: true,
      },
    });

    return NextResponse.json(user || {});
  } catch (error) {
    console.error('Failed to fetch preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { theme, language, activeTeamId } = body;

    // Validate theme
    if (theme && !['light', 'dark', 'system'].includes(theme)) {
      return NextResponse.json({ error: 'Invalid theme value' }, { status: 400 });
    }

    // Validate language
    if (language && !['de', 'en'].includes(language)) {
      return NextResponse.json({ error: 'Invalid language value' }, { status: 400 });
    }

    // Validate activeTeamId if provided - check user is member of that team
    if (activeTeamId) {
      const membership = await prisma.paddler.findFirst({
        where: {
          teamId: activeTeamId,
          userId: session.user.id,
        },
      });

      if (!membership) {
        return NextResponse.json({ error: 'Not a member of this team' }, { status: 403 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(theme !== undefined && { theme }),
        ...(language !== undefined && { language }),
        ...(activeTeamId !== undefined && { activeTeamId }),
      },
      select: {
        theme: true,
        language: true,
        activeTeamId: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Failed to update preferences:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
