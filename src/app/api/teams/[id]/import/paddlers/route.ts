import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth, signIn } from '@/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId } = await params;

    // Verify team membership/ownership and get inviter language
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        paddlers: {
          where: { teamId },
        },
      },
    });

    const isCaptain = user?.paddlers[0]?.role === 'CAPTAIN';
    const inviterLang = (user?.language as 'de' | 'en') || 'de';
    
    // Allow if captain
    if (!isCaptain) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { paddlers } = body;

    if (!Array.isArray(paddlers)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Separate paddlers into batch (no email) and invite (with email)
    // Separate paddlers into batch (no email) and invite (with email)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paddlersToBatch: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paddlersToInvite: any[] = [];

    for (const p of paddlers) {
      let skillsArray: string[] = [];
      if (Array.isArray(p.skills)) {
          skillsArray = p.skills;
      } else if (typeof p.skills === 'string') {
          // Split by comma and trim
          skillsArray = p.skills.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
      }
      // Also check legacy 'side' if present and valid
      if (p.side && typeof p.side === 'string') {
          const sides = p.side.split(',').map((s: string) => s.trim().toLowerCase());
          skillsArray = [...skillsArray, ...sides];
      }
      // Deduplicate
      skillsArray = Array.from(new Set(skillsArray));

      const paddlerData = {
        name: p.name,
        weight: parseFloat(p.weight) || 0,

        skills: skillsArray,
        teamId: teamId,
      };

      if (p.inviteEmail && typeof p.inviteEmail === 'string' && p.inviteEmail.includes('@')) {
        const inviteData = {
           ...paddlerData,
           inviteEmail: p.inviteEmail.trim(),
           inviteLanguage: inviterLang
        };
        paddlersToInvite.push(inviteData);
      } else {
        paddlersToBatch.push(paddlerData);
      }
    }

    // 1. Create paddlers without email (individually to avoid PostgreSQL array issues with createMany)
    let count = 0;
    for (const paddlerData of paddlersToBatch) {
      try {
        await prisma.paddler.create({
          data: paddlerData,
        });
        count++;
      } catch (dbError) {
        console.error("Failed to import paddler:", paddlerData.name, dbError);
        // Continue with next paddler
      }
    }

    // 2. Create and Invite those with email
    // We do this individually to handle the invite flow
    for (const p of paddlersToInvite) {
      // Check if already invited or member? 
      // Ideally we should check strict duplicates but for import we trust constraints or let it fail?
      // Prisma create will throw if unique constraint fails (none on inviteEmail usually unless enforced?)
      // Actually inviteEmail is not unique. Only userId + teamId is unique.
      // So we can have multiple pending invites? No, logic usually prevents.
      // We will try create.
      try {
        await prisma.paddler.create({ data: p });
        count++;

        // Send invite
        try {
          await signIn("resend", {
            email: p.inviteEmail,
            redirect: false,
            redirectTo: `/app/teams/${teamId}?lang=${inviterLang}`,
          });
        } catch {
          // signIn throws redirect error on success in some versions, or we just catch it.
          // We ignore it to continue the loop.
        }
      } catch (dbError) {
        console.error("Failed to import individual paddler:", p.name, dbError);
        // Continue with next
      }
    }

    return NextResponse.json({ count }, { status: 201 });
  } catch (error) {
    console.error('Error importing paddlers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
