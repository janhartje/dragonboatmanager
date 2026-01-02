import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

/**
 * DELETE /api/teams/[teamId]/api-keys/[keyId]
 * Revoke (delete) an API key
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; keyId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId, keyId } = await params;

    // Check if user is captain of this team
    const paddler = await prisma.paddler.findFirst({
      where: {
        teamId,
        userId: session.user.id,
        role: 'CAPTAIN',
      },
    });

    if (!paddler) {
      return NextResponse.json(
        { error: 'Only team captains can revoke API keys' },
        { status: 403 }
      );
    }

    // Verify the API key belongs to this team before deleting
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    if (apiKey.teamId !== teamId) {
      return NextResponse.json(
        { error: 'API key does not belong to this team' },
        { status: 403 }
      );
    }

    // Delete the API key
    await prisma.apiKey.delete({
      where: { id: keyId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to revoke API key:', error);
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    );
  }
}
