import { unstable_setRequestLocale } from 'next-intl/server';
import LandingPageClient from './LandingPageClient';
import prisma from '@/lib/prisma';

interface PublicTeam {
  name: string;
  icon: string | null;
  website: string | null;
}

async function getPublicTeams(): Promise<PublicTeam[]> {
  try {
    // Fetch directly from database for optimal server-side rendering and SEO
    const teams = await prisma.team.findMany({
      take: 50,
      where: {
        showOnWebsite: true,
      },
      select: {
        name: true,
        icon: true,
        website: true,
      },
      orderBy: [
        // Sort teams with logos first
        { icon: 'desc' },
        // Then by name alphabetically
        { name: 'asc' },
      ],
    });

    return teams;
  } catch (error) {
    console.error("Failed to fetch public teams:", error);
    return [];
  }
}

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  unstable_setRequestLocale(locale);
  
  // Fetch public teams server-side for SEO and performance
  const publicTeams = await getPublicTeams();

  return <LandingPageClient publicTeams={publicTeams} />;
}
