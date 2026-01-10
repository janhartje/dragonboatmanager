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

        // Detect from callbackUrl (reflects current UI state)
        try {
          const magicLinkUrl = new URL(url);
          const callbackUrl = magicLinkUrl.searchParams.get('callbackUrl');
          if (callbackUrl) {
            let urlToScan = callbackUrl;
            // Decode potential double-encoding (common in OAuth/Redirect flows)
            if (urlToScan.includes('%')) {
              try {
                urlToScan = decodeURIComponent(urlToScan);
              } catch {
                // ignore decoding errors
              }
            }

            // Check path segments
            const isEnPath = /\/en(\/|\?|$)/.test(urlToScan);
            const isDePath = /\/de(\/|\?|$)/.test(urlToScan);

            // Check query params
            const isEnQuery = /[?&](lang|locale)=en(&|$)/.test(urlToScan);
            const isDeQuery = /[?&](lang|locale)=de(&|$)/.test(urlToScan);

            if (isEnPath || isEnQuery) lang = 'en';
            else if (isDePath || isDeQuery) lang = 'de';
          }
        } catch (e) {
          console.error("Error detecting language from URL:", e);
        }

        // Check if there is a pending invite for this email (Paddler with inviteEmail)
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
              try {
                const targetUrl = new URL(url);
                const baseUrl = getBaseUrl();
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

            // Default to app dashboard if not a team invite
            // This ensures users land in the app after login, not on the landing page
            const targetUrl = new URL(url);
            const callbackUrl = targetUrl.searchParams.get('callbackUrl');
            const baseUrl = getBaseUrl();

            // If callback is home page or empty/default, redirect to app
            // We check for various forms of "home"
            const isHomeRedirect = !callbackUrl ||
              callbackUrl === baseUrl ||
              callbackUrl === `${baseUrl}/` ||
              callbackUrl === `${baseUrl}/${lang}` ||
              callbackUrl === `${baseUrl}/${lang}/`;

            if (isHomeRedirect) {
              const appRedirect = `${baseUrl}/${lang}/app`;
              targetUrl.searchParams.set('callbackUrl', appRedirect);
              url = targetUrl.toString();
            }
          } catch (e) {
            console.error("Error setting default app redirect:", e);
          }
        }

        // Wrap the magic link URL with a verification landing page
        // to prevent email scanners from consuming the token.
        const baseUrl = getBaseUrl();

        // Convert the target URL to a relative path to ensure origin-independence
        // This solves issues with localhost vs 127.0.0.1 and Vercel Preview URLs
        const targetUrlObj = new URL(url);
        const relativeTarget = targetUrlObj.pathname + targetUrlObj.search + targetUrlObj.hash;

        const verificationUrl = `${baseUrl}/${lang}/login/verify?url=${encodeURIComponent(relativeTarget)}`;
        const emailUrl = verificationUrl;

        // Use emailUrl for the email template
        const ReactEmailComponent = shouldUseTeamInvite
          ? TeamInviteEmail({ url: emailUrl, teamName, lang })
          : MagicLinkEmail({ url: emailUrl, lang });

        const subject = shouldUseTeamInvite
          ? (lang === 'en' ? `You've been invited to join "${teamName}" 🐉` : `Du wurdest zum Team "${teamName}" eingeladen 🐉`)
          : t(lang, 'emailMagicLinkSubject');

        const result = await sendEmail({
          to: email,
          subject: subject,
          react: ReactEmailComponent,
          template: shouldUseTeamInvite ? 'TeamInviteEmail' : 'MagicLinkEmail',
          props: { url: emailUrl, lang, teamName },
        });

        if (!result.success) {
          console.error("Error sending magic link email:", result.error);
          throw new Error("Failed to send verification email");
        }
      },
    }),
    Credentials({
      id: 'credentials',
      name: 'Test Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
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
            weight: 85,
            language: 'de',
          }
        });

        await prisma.paddler.updateMany({
          where: { userId: user.id },
          data: { skills: [] }
        });

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
        // Fetch fresh user data to get weight
        const freshUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { weight: true }
        })
        if (freshUser) {
          token.weight = freshUser.weight
        }
        const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
        if (user.email && adminEmails.includes(user.email.toLowerCase())) {
          token.isAdmin = true;
        }
      }
      if (trigger === "update") {
        // Refresh weight from session if provided, otherwise from database
        if (session?.user?.weight !== undefined) {
          token.weight = session.user.weight;
        } else if (token.id) {
          const freshUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { weight: true }
          })
          if (freshUser) {
            token.weight = freshUser.weight
          }
        }
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
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`

      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url

      // For Vercel Previews or cross-origin mismatches where we want to keep the path
      // but stay on the current domain (to ensure session cookie validity).
      // We accept the pathname from the callbackUrl but force the current baseUrl.
      try {
        const urlObj = new URL(url);
        return `${baseUrl}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
      } catch {
        return baseUrl;
      }
    },
  },
  events: {
    async signIn({ user }) {
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
