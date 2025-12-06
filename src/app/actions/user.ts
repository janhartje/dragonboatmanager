"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function updateProfile(data: { name: string; weight: number; skills?: string[] }, teamId?: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Not authenticated")
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name,
      weight: data.weight,
    },
  })

  // Update ALL paddler records for this user (Name & Weight only)
  await prisma.paddler.updateMany({
    where: { userId: session.user.id },
    data: {
      name: data.name,
      weight: data.weight,
      // Skills are NOT synchronized globally
    },
  })

  // If provided, update skills for the specific team
  if (teamId && data.skills) {
    // Find the paddler for this user and team
    const currentPaddler = await prisma.paddler.findFirst({
      where: {
        userId: session.user.id,
        teamId: teamId
      }
    })

    if (currentPaddler) {
      await prisma.paddler.update({
        where: { id: currentPaddler.id },
        data: {
          skills: data.skills
        }
      })
    }
  }
}
