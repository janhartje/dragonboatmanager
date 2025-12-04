"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateProfile(data: { name: string; weight: number }) {
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

  // Also update all paddler records for this user
  await prisma.paddler.updateMany({
    where: { userId: session.user.id },
    data: {
      name: data.name,
      weight: data.weight,
    },
  })

  revalidatePath("/profile")
}
