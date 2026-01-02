import { auth } from "@/auth";
import { validateApiKey } from "./mcp-auth";

export type AuthContext = 
  | { type: 'session'; user: { id: string; name?: string | null; email?: string | null }; teamId?: undefined }
  | { type: 'apiKey'; teamId: string; user?: undefined }
  | { type: 'none' };

export async function getAuthContext(request?: Request): Promise<AuthContext> {
  // 1. Check for Session
  const session = await auth();
  if (session?.user?.id) {
    return { 
      type: 'session', 
      user: { 
        id: session.user.id, 
        name: session.user.name, 
        email: session.user.email 
      } 
    };
  }

  // 2. Check for API Key if request is provided
  if (request) {
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (apiKey) {
      const validKey = await validateApiKey(apiKey);
      if (validKey) {
        return { type: 'apiKey', teamId: validKey.teamId };
      }
    }
  }

  return { type: 'none' };
}
