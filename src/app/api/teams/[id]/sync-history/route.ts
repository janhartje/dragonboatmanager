import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Await params
  const { id: teamId } = await params;

  // Verify Team Membership & Role
  const member = await prisma.paddler.findFirst({
        where: {
            teamId: teamId,
            userId: session.user.id,
        },
        select: {
            role: true
        }
    });

  if (!member || member.role !== 'CAPTAIN') {
      return new Response('Forbidden: Captains only', { status: 403 });
  }

  try {

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
        prisma.syncLog.findMany({
            where: { teamId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: skip,
        }),
        prisma.syncLog.count({ where: { teamId } }),
    ]);

    return Response.json({
        data: logs,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }
    });
  } catch (error) {
    console.error('Error fetching sync logs:', error);
    return new Response('Failed to fetch sync logs', { status: 500 });
  }
}
