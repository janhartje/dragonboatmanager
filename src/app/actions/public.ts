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
        // Sort teams with icons first (teams with icon values come before nulls in descending order)
        { icon: 'desc' },
        // Then by name alphabetically
        { name: 'asc' },
      ],
    })

    // Convert null values to undefined to match TypeScript interface
    return teams.map(team => ({
      name: team.name,
      icon: team.icon ?? undefined,
      website: team.website ?? undefined,
    }))
  } catch (error) {
    console.error("Failed to fetch public teams:", error)
    return []
  }
}
