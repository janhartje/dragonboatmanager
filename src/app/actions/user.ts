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
      // Preserve special roles that users cannot edit themselves
      // These roles are usually assigned by captains and aren't visible in the user profile form
      const SPECIAL_ROLES = ['stroke', 'steer_preferred'];
      const existingSpecialRoles = (currentPaddler.skills || []).filter(s => SPECIAL_ROLES.includes(s));
      
      // Filter out special roles from the incoming data just in case (though UI shouldn't send them)
      // Then re-add the existing special roles
      const newSkills = [
        ...(data.skills || []).filter(s => !SPECIAL_ROLES.includes(s)), 
        ...existingSpecialRoles
      ];

      // Remove duplicates
      const uniqueSkills = Array.from(new Set(newSkills));

      await prisma.paddler.update({
        where: { id: currentPaddler.id },
        data: {
          skills: uniqueSkills
        }
      })
    }
  }
}
