import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Resend from "next-auth/providers/resend"
import { sendEmail } from "@/lib/email"
import MagicLinkEmail from "@/emails/templates/MagicLinkEmail"
import TeamInviteEmail from "@/emails/templates/TeamInviteEmail"
import { t, Language } from "@/emails/utils/i18n"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google,
    GitHub,
    Resend({
      from: "Drachenboot Manager <no-reply@drachenbootmanager.de>",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sendVerificationRequest: async ({ identifier: email, url }) => {
        console.log("[Auth] SendVerificationRequest URL:", url);
        // Try to detect user's language preference
        let lang: Language = 'de'; // Default to German
        
        // Check if there is a pending invite for this email (Paddler with inviteEmail)
        // OR if the user is a member of a team (to send welcome back email)
        // We prioritize the TeamInviteEmail if we find a pending invite
        let teamName = '';
        let inviterName = undefined;
        let shouldUseTeamInvite = false;
        let invitedPaddlerFound = false;

        try {
            // First check for pending invite (Paddler with inviteEmail)
            const invitedPaddler = await prisma.paddler.findFirst({
                where: { inviteEmail: email },
                include: { team: true }
            });

            if (invitedPaddler) {
                invitedPaddlerFound = true;
                // Use the persisted language from the invite
                if (invitedPaddler.inviteLanguage === 'en') {
                    lang = 'en';
                }
                
                if (invitedPaddler.team) {
                    teamName = invitedPaddler.team.name;
                    shouldUseTeamInvite = true;

                    // FORCE the redirect to the invited team
                    // We modify the magic link URL to ensure the callbackUrl points to the specific team
                    try {
                        const targetUrl = new URL(url);
                        const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || targetUrl.origin;
                        // Redirect to main app with teamId param
                        const teamRedirect = `${baseUrl}/app?teamId=${invitedPaddler.teamId}`;
                        
                        targetUrl.searchParams.set('callbackUrl', teamRedirect);
                        url = targetUrl.toString();
                    } catch (e) {
                         console.error("Failed to construct team redirect URL", e);
                    }
                }
            }
        } catch (e) {
            console.error("Error finding pending invite:", e);
        }

        // If no invited paddler was found, try to get user's language preference
        if (!invitedPaddlerFound) {
            try {
                const user = await prisma.user.findUnique({
                    where: { email },
                    select: { language: true }
                });

                if (user?.language === 'en') {
                    lang = 'en';
                }
            } catch (e) {
                console.error("Error finding user language:", e);
            }
        }

        const ReactEmailComponent = shouldUseTeamInvite 
            ? TeamInviteEmail({ url, teamName, lang }) // inviterName unavailable here efficiently
            : MagicLinkEmail({ url, lang });

        const subjectKey = shouldUseTeamInvite ? 'emailTeamInviteSubject' : 'emailMagicLinkSubject';
        
        // If team invite, append team name to subject?
        // t(lang, 'emailTeamInviteSubject') is "Du wurdest zum Team eingeladen"
        // Let's manually construct subject for Team Invite to match previous one
        const subject = shouldUseTeamInvite
            ? (lang === 'en' ? `You've been invited to join "${teamName}" 🐉` : `Du wurdest zum Team "${teamName}" eingeladen 🐉`)
            : t(lang, 'emailMagicLinkSubject');

        const result = await sendEmail({
          to: email,
          subject: subject,
          react: ReactEmailComponent,
          template: shouldUseTeamInvite ? 'TeamInviteEmail' : 'MagicLinkEmail',
          props: { url, lang, teamName },
        });
        
        if (!result.success) {
          console.error("Error sending magic link email:", result.error);
          throw new Error("Failed to send verification email");
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login?verify=1",
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
  events: {
    // Link invited paddlers when a new user is created or signs in
    async signIn({ user }) {
      if (user.email && user.id) {
        // Fetch full user to get weight (as it might not be in the session user object)
        const fullUser = await prisma.user.findUnique({
          where: { id: user.id },
        });

        // Check if there are any paddlers with this email in inviteEmail field
        const invitedPaddlers = await prisma.paddler.findMany({
          where: { inviteEmail: user.email },
        });
        
        // Link all invited paddlers to this user
        for (const paddler of invitedPaddlers) {
          await prisma.paddler.update({
            where: { id: paddler.id },
            data: {
              userId: user.id,
              inviteEmail: null, // Clear the invite email
              name: fullUser?.name || user.name || paddler.name, // Use user's name if available
              weight: fullUser?.weight || paddler.weight, // Sync weight
            },
          });
        }
      }
    },
    async createUser({ user }) {
        if (user.email && user.id) {
          // Fetch full user to get weight
          const fullUser = await prisma.user.findUnique({
            where: { id: user.id },
          });

          // Check if there are any paddlers with this email in inviteEmail field
          const invitedPaddlers = await prisma.paddler.findMany({
            where: { inviteEmail: user.email },
          });
          
          // Link all invited paddlers to this user
          for (const paddler of invitedPaddlers) {
            await prisma.paddler.update({
              where: { id: paddler.id },
              data: {
                userId: user.id,
                inviteEmail: null, // Clear the invite email
                name: fullUser?.name || user.name || paddler.name, // Use user's name if available
                weight: fullUser?.weight || paddler.weight, // Sync weight
              },
            });
          }
        }
    }
  },
})
