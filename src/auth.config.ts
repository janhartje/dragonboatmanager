import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/login",
        verifyRequest: "/login?verify=1",
    },
    session: {
        strategy: "jwt",
    },
    providers: [], // Providers are configured in auth.ts
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const onApp = /^\/(?:[a-z]{2}\/)?app(?:\/|$)/.test(nextUrl.pathname);

            if (onApp) {
                if (isLoggedIn) return true;
                return false; // Redirect to login
            }
            return true;
        },
        async redirect({ url, baseUrl }) {
            // Allows relative callback URLs
            if (url.startsWith("/")) return `${baseUrl}${url}`

            // Allows callback URLs on the same origin
            if (new URL(url).origin === baseUrl) return url

            try {
                const urlObj = new URL(url);
                return `${baseUrl}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
            } catch {
                return baseUrl;
            }
        },
    },
} satisfies NextAuthConfig;
