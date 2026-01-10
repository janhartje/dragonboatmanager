/**
 * Get the URL for a user's avatar image
 * This function prioritizes custom uploaded images over OAuth provider images
 * and uses the optimized avatar endpoint to avoid payload bloat
 * 
 * @param userId - The user's ID (required for custom images via API endpoint)
 * @param image - OAuth provider image URL (from Google/GitHub)
 * @returns The avatar URL or null if no image is available
 */
export function getAvatarUrl(userId: string | null | undefined, image: string | null | undefined): string | null {
  if (!userId) {
    // If no userId, can only use OAuth image if available
    return image || null;
  }

  // Always use the dedicated avatar endpoint which handles priority:
  // 1. Custom uploaded image (if exists)
  // 2. OAuth provider image (if exists)
  // 3. 404 if neither exists
  return `/api/users/${userId}/avatar`;
}

/**
 * Get initials from a name for fallback avatar display
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
