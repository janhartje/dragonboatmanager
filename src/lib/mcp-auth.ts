import { randomBytes } from 'crypto';
import prisma from './prisma';

/**
 * Generate a secure API key
 * Format: dbm_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (40 characters total)
 */
export function generateApiKey(): string {
  const prefix = 'dbm_live_';
  const randomPart = randomBytes(20).toString('hex'); // 40 hex characters
  return prefix + randomPart;
}

/**
 * Validate an API key and return team information
 * @param key The API key to validate
 * @returns Team information if valid, null otherwise
 */
export async function validateApiKey(key: string) {
  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { key },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            plan: true,
          },
        },
      },
    });

    if (!apiKey) {
      return null;
    }

    // Update last used timestamp (fire and forget)
    prisma.apiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsed: new Date() },
      })
      .catch((error: unknown) => {
        console.error('Failed to update API key last used timestamp:', error);
      });

    return {
      teamId: apiKey.teamId,
      teamName: apiKey.team.name,
      teamPlan: apiKey.team.plan,
    };
  } catch (error) {
    console.error('Error validating API key:', error);
    return null;
  }
}

/**
 * Check if a team has MCP access (currently requires PRO plan)
 * @param teamId The team ID to check
 * @returns True if the team has MCP access, false otherwise
 */
export async function checkMcpAccess(teamId: string): Promise<boolean> {
  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { plan: true },
    });

    if (!team) {
      return false;
    }

    // MCP access is only available for PRO and ENTERPRISE teams
    return team.plan === 'PRO' || team.plan === 'ENTERPRISE';
  } catch (error) {
    console.error('Error checking MCP access:', error);
    return false;
  }
}
