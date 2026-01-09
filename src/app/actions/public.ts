"use server"

import prisma from "@/lib/prisma"

export interface PublicTeam {
  name: string;
  icon?: string;
  website?: string;
}

/**
 * Fetch teams that have opted-in to be displayed on the public landing page.
 * Only returns minimal public data (name, logo, website).
 */
export async function getPublicTeams(): Promise<PublicTeam[]> {
  try {
    const teams = await prisma.team.findMany({
      where: {
        showOnWebsite: true,
      },
      select: {
        name: true,
        icon: true,
        website: true,
      },
      orderBy: [
        // Sort teams with logos first (icon IS NOT NULL)
        { icon: 'desc' },
        // Then by name alphabetically
        { name: 'asc' },
      ],
    })

    return teams
  } catch (error) {
    console.error("Failed to fetch public teams:", error)
    return []
  }
}
