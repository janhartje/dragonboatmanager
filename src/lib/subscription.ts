import prisma from './prisma';

export async function checkTeamPlan(teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { plan: true, maxMembers: true },
  });

  if (!team) {
    throw new Error('Team not found');
  }

  const isPro = team.plan === 'PRO' || team.plan === 'ENTERPRISE';

  return {
    isPro,
    maxMembers: team.maxMembers,
    features: {
      canUseICal: isPro,
      canUseSeriesEvents: isPro,
      canExportPdf: isPro,
    },
  };
}
