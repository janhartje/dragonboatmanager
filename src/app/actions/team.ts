"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function inviteMember(teamId: string, email: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Not authenticated")
  }

  // Check if user is captain of the team
  const membership = await prisma.paddler.findFirst({
    where: {
      userId: session.user.id,
      teamId: teamId,
      role: "CAPTAIN",
    },
  })

  if (!membership) {
    throw new Error("Not authorized")
  }

  // Find user by email
  const userToInvite = await prisma.user.findUnique({
    where: { email },
  })

  if (!userToInvite) {
    // In a real app, we would send an email invitation here.
    // For now, we'll just throw an error or handle it gracefully.
    throw new Error("USER_NOT_FOUND")
  }

  // Check if already a member
  const existingMember = await prisma.paddler.findFirst({
    where: {
      userId: userToInvite.id,
      teamId: teamId,
    },
  })

  if (existingMember) {
    throw new Error("USER_ALREADY_MEMBER")
  }

  // Create paddler entry
  await prisma.paddler.create({
    data: {
      name: userToInvite.name || email.split("@")[0],
      weight: userToInvite.weight || 75, // Default weight
      userId: userToInvite.id,
      teamId: teamId,
      role: "PADDLER",
    },
  })

  revalidatePath("/")
}
