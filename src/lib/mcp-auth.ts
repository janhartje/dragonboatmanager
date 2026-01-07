import { randomBytes, createHash } from 'crypto';
import prisma from './prisma';

/**
 * Generate a secure API key
 * Returns the full key (to show once) and the hash (to store)
 */
export function generateApiKey(): { key: string; hash: string, displayKey: string } {
  const prefix = 'dbm_live_';
  const randomPart = randomBytes(24).toString('hex'); // Increased entropy
  const key = prefix + randomPart;

  const hash = createHash('sha256').update(key).digest('hex');
  const displayKey = `${prefix}...${randomPart.slice(-4)}`;

  return { key, hash, displayKey };
}

/**
 * Validate an API key and return team information
 * @param key The API key to validate
 * @returns Team information if valid, null otherwise
 */
export async function validateApiKey(key: string) {
  try {
    const hash = createHash('sha256').update(key).digest('hex');

    const apiKey = await prisma.apiKey.findUnique({
      where: { hashedKey: hash },
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

    // Update last used timestamp
    try {
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsed: new Date() },
      });
    } catch (error: unknown) {
      console.error('Failed to update API key last used timestamp:', error);
    }

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

    // MCP access is only available for PRO teams
    return team.plan === 'PRO';
  } catch (error) {
    console.error('Error checking MCP access:', error);
    return false;
  }
}
