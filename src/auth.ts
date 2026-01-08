import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Resend from "next-auth/providers/resend"
import Credentials from "next-auth/providers/credentials"
import { sendEmail } from "@/lib/email"
import MagicLinkEmail from "@/emails/templates/MagicLinkEmail"
import TeamInviteEmail from "@/emails/templates/TeamInviteEmail"
import { t, Language } from "@/emails/utils/i18n"
import type { Adapter, AdapterUser } from "@auth/core/adapters"
import { getBaseUrl } from "@/utils/url"

// Create a custom adapter that normalizes emails to lowercase
function CaseInsensitivePrismaAdapter(prismaClient: typeof prisma): Adapter {
  const baseAdapter = PrismaAdapter(prismaClient)

  return {
    ...baseAdapter,
    // Override createUser to normalize email to lowercase
    createUser: async (data) => {
      const normalizedData = {
        ...data,
        email: data.email?.toLowerCase() ?? data.email,
      }
      return baseAdapter.createUser!(normalizedData)
    },
    // Override getUserByEmail to search case-insensitively
    getUserByEmail: async (email: string) => {
      const normalizedEmail = email.toLowerCase()
      const user = await prismaClient.user.findFirst({
        where: {
          email: {
            equals: normalizedEmail,
            mode: 'insensitive',
          },
        },
      })
      if (!user) return null
      return user as AdapterUser
    },
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: CaseInsensitivePrismaAdapter(prisma),
  providers: [
    Google,
    GitHub,
    Resend({
      from: "Drachenboot Manager <no-reply@drachenbootmanager.de>",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sendVerificationRequest: async ({ identifier: email, url }) => {
        // Normalize email to lowercase for consistent lookup
        email = email.toLowerCase();

        // Try to detect user's language preference
        let lang: Language = 'de'; // Default to German

        // Check if there is a pending invite for this email (Paddler with inviteEmail)
        // OR if the user is a member of a team (to send welcome back email)
        // OR if the user is a member of a team (to send welcome back email)
        // We prioritize the TeamInviteEmail if we find a pending invite
        let teamName = '';

        let shouldUseTeamInvite = false;
        let invitedPaddlerFound = false;

        try {
          // First check for pending invite (Paddler with inviteEmail) - case insensitive
          const invitedPaddler = await prisma.paddler.findFirst({
            where: {
              inviteEmail: {
                equals: email,
                mode: 'insensitive',
              }
            },
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
                const baseUrl = getBaseUrl();
                // Redirect to main app with teamId param
                const teamRedirect = `${baseUrl}/${lang}/app?teamId=${invitedPaddler.teamId}`;

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
            // Case-insensitive user lookup
            const user = await prisma.user.findFirst({
              where: {
                email: {
                  equals: email,
                  mode: 'insensitive',
                }
              },
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
    // Test User Provider (Development/Test only)
    Credentials({
      id: 'credentials',
      name: 'Test Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // ONLY allow in development or test environment
        const isDev = process.env.NODE_ENV === 'development';
        const isTest = process.env.NODE_ENV === 'test';
        const isLocalProduction = process.env.ENABLE_TEST_USER === 'true';

        if (!isDev && !isTest && !isLocalProduction) {
          return null;
        }

        const testEmail = 'test@drachenbootmanager.de';
        const testPassword = process.env.TEST_USER_PASSWORD || 'testuser123';

        if (credentials.email !== testEmail || credentials.password !== testPassword) {
          return null;
        }

        // Create or update the test user
        const user = await prisma.user.upsert({
          where: { email: testEmail },
          update: {
            name: "Test User",
            emailVerified: new Date(),
          },
          create: {
            email: testEmail,
            name: "Test User",
            emailVerified: new Date(),
            weight: 85, // Default weight for test user
            language: 'de',
          }
        });

        // FORCE ONBOARDING:
        // 1. Update all existing records to have valid weight but empty skills
        //    This ensures that for ANY team the user is in, they trigger onboarding
        const updateResult = await prisma.paddler.updateMany({
          where: { userId: user.id },
          data: { skills: [] }
        });

        // 2. If no records updated (user is new to all teams), create one in the first team
        if (updateResult.count === 0) {
          const firstTeam = await prisma.team.findFirst();
          if (firstTeam) {
            await prisma.paddler.create({
              data: {
                name: "Test User",
                weight: 85,
                skills: [],
                userId: user.id,
                teamId: firstTeam.id,
                role: 'PADDLER'
              }
            });
          }
        }

        return user;
      }
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login?verify=1",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.weight = user.weight
        const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
        if (user.email && adminEmails.includes(user.email.toLowerCase())) {
          token.isAdmin = true;
        }
      }

      // Handle updates (e.g. when user updates profile)
      if (trigger === "update" && session?.user) {
        token.weight = session.user.weight;
      }

      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.weight = token.weight as number | null
        session.user.isAdmin = token.isAdmin as boolean
      }
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

        // Check if there are any paddlers with this email in inviteEmail field (case-insensitive)
        const invitedPaddlers = await prisma.paddler.findMany({
          where: {
            inviteEmail: {
              equals: user.email,
              mode: 'insensitive',
            }
          },
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

        // Check if there are any paddlers with this email in inviteEmail field (case-insensitive)
        const invitedPaddlers = await prisma.paddler.findMany({
          where: {
            inviteEmail: {
              equals: user.email,
              mode: 'insensitive',
            }
          },
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
