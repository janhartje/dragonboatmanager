"use server"

import { auth, signIn } from "@/auth"
import prisma from "@/lib/prisma"



// Helper function to send team invite - triggers NextAuth magic link
async function sendTeamInviteEmail(
  email: string,
  teamName: string,
  teamId: string,
  inviterName?: string,
  lang: 'de' | 'en' = 'de'
) {
  // Trigger NextAuth's signIn to send the actual magic link email
  // auth.ts is configured to intercept this and send a TeamInviteEmail
  // if it finds a pending invite for this email.
  try {

    await signIn('resend', { 
      email, 
      redirect: false,
      redirectTo: `/app/teams/${teamId}?lang=${lang}`,
    })
  } catch {
    // signIn throws a redirect error but the email is sent
    // We can safely ignore this
  }
}

export async function inviteMember(teamId: string, email: string) {
  // Normalize email to lowercase
  email = email.toLowerCase().trim();
  
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Not authenticated")
  }

  // Fetch inviter's language
  const inviter = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { language: true }
  })
  const inviterLang = (inviter?.language as 'de' | 'en') || 'de'

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

  // Get team info
  const team = await prisma.team.findUnique({
    where: { id: teamId },
  })

  if (!team) {
    throw new Error("Team not found")
  }

  // Find user by email to check if they are already a member (case-insensitive)
  const userToInvite = await prisma.user.findFirst({
    where: { 
      email: {
        equals: email,
        mode: 'insensitive',
      }
    },
  })

  // Check if user is already a member
  if (userToInvite) {
    const existingMember = await prisma.paddler.findFirst({
      where: {
        userId: userToInvite.id,
        teamId: teamId,
      },
    })

    if (existingMember) {
      throw new Error("USER_ALREADY_MEMBER")
    }
  }

  // Check if already invited by email (pending invite) - case-insensitive
  const existingInvite = await prisma.paddler.findFirst({
    where: {
      inviteEmail: {
        equals: email,
        mode: 'insensitive',
      },
      teamId: teamId,
      // Ensure we don't count fully linked members (userId not null) as pending invites here
      // But typically inviteEmail is cleared when linked.
    },
  })

  if (existingInvite) {
    throw new Error("EMAIL_ALREADY_INVITED")
  }

  // Create placeholder paddler with invite email (PENDING STATE)
  // We do NOT set userId here, even if userToInvite exists.
  // This forces the user to confirm via email link (auth.ts handles the linking).
  await prisma.paddler.create({
    data: {
      name: userToInvite?.name || email.split("@")[0], // Suggest name but don't link identity yet
      weight: userToInvite?.weight || 0, // Use user's weight if known, otherwise 0
      inviteEmail: email,
      inviteLanguage: inviterLang, // Save language preference
      teamId: teamId,
      role: "PADDLER",
      skills: [],
    },
  })

  // Send invite email with magic link
  try {
    await sendTeamInviteEmail(email, team.name, team.id, session.user.name || undefined, inviterLang)
  } catch (e) {
    console.error("Failed to send invite email:", e)
  }
}

export async function linkPaddlerToAccount(paddlerId: string, email: string) {
  // Normalize email to lowercase
  email = email.toLowerCase().trim();
  
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Not authenticated")
  }

  // Fetch inviter's language
  const inviter = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { language: true }
  })
  const inviterLang = (inviter?.language as 'de' | 'en') || 'de'

  // Get the paddler
  const paddler = await prisma.paddler.findUnique({
    where: { id: paddlerId },
    include: { team: true }
  })

  if (!paddler || !paddler.teamId) {
    throw new Error("Paddler not found")
  }

  // Check if user is captain of the team
  const membership = await prisma.paddler.findFirst({
    where: {
      userId: session.user.id,
      teamId: paddler.teamId,
      role: "CAPTAIN",
    },
  })

  if (!membership) {
    throw new Error("Not authorized")
  }

  // Check if paddler is already linked
  if (paddler.userId) {
    throw new Error("PADDLER_ALREADY_LINKED")
  }

  // Find user by email (case-insensitive)
  const existingUser = await prisma.user.findFirst({
    where: { 
      email: {
        equals: email,
        mode: 'insensitive',
      }
    },
  })

  if (existingUser) {
    // Check if this user is already a member of the team
    const existingMember = await prisma.paddler.findFirst({
      where: {
        userId: existingUser.id,
        teamId: paddler.teamId,
      },
    })

    if (existingMember) {
      throw new Error("USER_ALREADY_MEMBER")
    }

    // Link paddler to existing user - BUT AS PENDING INVITE
    // We do NOT connect userId yet, and do NOT update name/weight yet.
    // Auth.ts will handle this upon sign-in.
    await prisma.paddler.update({
      where: { id: paddlerId },
      data: {
        // user: { connect: { id: existingUser.id } }, // REMOVED to enforce pending state
        inviteEmail: email, // Set invite email so auth.ts sends TeamInviteEmail
        inviteLanguage: inviterLang, // Save language preference
        // name: existingUser.name || paddler.name, // REMOVED - sync later
        // weight: existingUser.weight || paddler.weight, // REMOVED - sync later
      },
    })

    // Notify existing user about joining the team
    if (paddler.team) {
      try {
        await sendTeamInviteEmail(email, paddler.team.name, paddler.team.id, session.user.name || undefined, inviterLang)
      } catch (e) {
        console.error("Failed to send invite email:", e)
      }
    }

    return { linked: true, userExists: true }
  } else {
    // Create new user account with paddler's data
    const newUser = await prisma.user.create({
      data: {
        email: email,
        name: paddler.name,
        weight: paddler.weight > 0 ? paddler.weight : null,
      },
    })

    // Link paddler to new user
    await prisma.paddler.update({
      where: { id: paddlerId },
      data: {
        userId: newUser.id,
        inviteEmail: email, // Set invite email for auth.ts
        inviteLanguage: inviterLang, // Save language preference
      },
    })

    // Send invite email with magic link
    if (paddler.team) {
      try {
        await sendTeamInviteEmail(email, paddler.team.name, paddler.team.id, session.user.name || undefined, inviterLang)
      } catch (e) {
        console.error("Failed to send invitation email:", e)
      }
    }

    return { linked: true, userExists: false, emailSent: true }
  }
}

