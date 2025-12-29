'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

/**
 * Dismisses an info card for the current user.
 * @param cardId The unique identifier for the card content.
 */
export async function dismissInfoCard(cardId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    await prisma.dismissedInfoCard.create({
      data: {
        userId: session.user.id,
        cardId: cardId,
      },
    });

    // Revalidate relevant paths - simplistic approach: revalidate everything or specific usage paths
    // Since InfoCards can be anywhere, we might want to just rely on client update or revalidate layout?
    // For now, let's revalidate the dashboard path if used there, or let the caller handle UI state.
    // Given the component will likely optimistically update, strict revalidation might not be needed for UX,
    // but ensures consistency on reload.
    revalidatePath('/app');
    revalidatePath('/app/teams/[id]', 'page');

  } catch (error) {
    // If unique constraint violation (already dismissed), just ignore
    if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
      return; 
    }
    console.error('Failed to dismiss info card:', error);
    throw error;
  }
}

/**
 * Checks if a specific card (or list of cards) is dismissed.
 * Useful for server-side rendering or initial state.
 */
export async function getDismissedCards(cardIds?: string[]) {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  // Prisma WhereInput type construction
  const whereClause: Prisma.DismissedInfoCardWhereInput = {
    userId: session.user.id,
  };
  
  if (cardIds && cardIds.length > 0) {
    whereClause.cardId = { in: cardIds };
  }

  const dismissed = await prisma.dismissedInfoCard.findMany({
    where: whereClause,
    select: { cardId: true },
  });

  return dismissed.map(d => d.cardId);
}
