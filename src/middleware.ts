import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const { auth } = NextAuth(authConfig);
const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  return intlMiddleware(req);
});

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
