import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch paddler to check team ownership
    const existingPaddler = await prisma.paddler.findUnique({
      where: { id },
      select: { teamId: true }
    });

    if (!existingPaddler?.teamId) {
      return NextResponse.json({ error: 'Paddler not found' }, { status: 404 });
    }

    // Check if user is a member of the team
    const membership = await prisma.paddler.findFirst({
      where: {
        teamId: existingPaddler.teamId,
        userId: session.user.id,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    
    // Authorization Logic
    const isCaptain = membership.role === 'CAPTAIN';
    const isSelfUpdate = membership.id === id;

    if (!isCaptain) {
        if (!isSelfUpdate) {
             return NextResponse.json({ error: 'Unauthorized - Only Captains can edit other members' }, { status: 403 });
        }
        // If self-update, prevent modifying sensitive fields like 'role'
        // Using 'delete' on body (any) or destructing
        delete body.role; 
    }

    const paddler = await prisma.paddler.update({
      where: { id },
      data: {
        name: body.name,
        weight: body.weight,

        skills: body.skills,
        isGuest: body.isGuest,
        role: body.role, // Will be undefined if deleted above, Prisma ignores undefined in update
      },
    });

    // If the paddler is linked to a user, sync changes to the user profile and other paddler entries
    if (paddler.userId) {
      // Update User profile
      await prisma.user.update({
        where: { id: paddler.userId },
        data: {
          name: paddler.name,
          weight: paddler.weight,
        },
      });

      // Update other Paddler records for this user
      await prisma.paddler.updateMany({
        where: { 
          userId: paddler.userId,
          id: { not: paddler.id } 
        },
        data: {
          name: paddler.name,
          weight: paddler.weight,
        },
      });
    }
    return NextResponse.json(paddler);
  } catch {
    return NextResponse.json({ error: 'Failed to update paddler' }, { status: 500 });
  }
}

import { sendEmail } from '@/lib/email';
import TeamRemovalEmail from '@/emails/templates/TeamRemovalEmail';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch paddler to be deleted with necessary relations for checks and email
    const targetPaddler = await prisma.paddler.findUnique({
      where: { id },
      include: { 
        team: true,
        user: true 
      }
    });

    if (!targetPaddler || !targetPaddler.teamId) {
      return NextResponse.json({ error: 'Paddler not found' }, { status: 404 });
    }

    // Check if the requester is a member of the team
    const requesterMembership = await prisma.paddler.findFirst({
      where: {
        teamId: targetPaddler.teamId,
        userId: session.user.id,
      },
    });

    if (!requesterMembership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // LOGIC SPLIT: Leaving vs Removing
    const isSelfDelete = targetPaddler.userId === session.user.id;

    if (isSelfDelete) {
      // --- LEAVE TEAM ---
      // Captains cannot leave directly
      if (targetPaddler.role === 'CAPTAIN') {
        return NextResponse.json({ 
          error: 'CAPTAIN_CANNOT_LEAVE',
          message: 'Captains cannot leave the team. Promote another captain or delete the team.' 
        }, { status: 403 });
      }
      // Allowed to leave
    } else {
      // --- REMOVE MEMBER ---
      // Only Captains can remove others
      if (requesterMembership.role !== 'CAPTAIN') {
        return NextResponse.json({ error: 'Unauthorized - Only Captains can remove members' }, { status: 403 });
      }

      // Send Notification Email
      const targetEmail = targetPaddler.user?.email || targetPaddler.inviteEmail;
      
      if (targetEmail && targetPaddler.team) {
        try {
          // Use inviteLanguage or default to 'de'
          const lang = (targetPaddler.inviteLanguage as 'de' | 'en') || 'de';
          
          await sendEmail({
            to: targetEmail,
            subject: lang === 'en' ? 'You have been removed from the team' : 'Du wurdest aus dem Team entfernt',
            react: TeamRemovalEmail({ 
              teamName: targetPaddler.team.name, 
              userName: targetPaddler.name,
              lang
            })
          });
        } catch (e) {
          console.error("Failed to send removal email:", e);
          // Don't block deletion if email fails
        }
      }
    }

    await prisma.paddler.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete paddler' }, { status: 500 });
  }
}
