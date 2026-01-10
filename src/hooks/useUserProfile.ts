import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { getUserProfile } from '@/app/actions/user'

/**
 * Custom event name for profile refresh events
 * Using browser-native CustomEvent API instead of module-level state
 * to avoid memory leaks and SSR issues
 */
const PROFILE_REFRESH_EVENT = 'userProfileRefresh'

/**
 * Trigger a refresh of all active useUserProfile hooks
 * Uses CustomEvent API which is:
 * - Memory-safe (no manual cleanup needed)
 * - SSR-compatible (only fires in browser)
 * - Standard browser API (no external dependencies)
 */
export function triggerProfileRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PROFILE_REFRESH_EVENT))
  }
}

/**
 * Hook to load and cache user profile data (including custom images)
 * Automatically refreshes when triggerProfileRefresh() is called
 * 
 * This approach avoids storing images in JWT tokens which would cause
 * REQUEST_HEADER_TOO_LARGE errors with base64 data
 */
export function useUserProfile() {
  const { data: session } = useSession()
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  // Listen for profile refresh events using browser-native API
  useEffect(() => {
    const handleRefresh = () => setRefreshKey(k => k + 1)
    
    if (typeof window !== 'undefined') {
      window.addEventListener(PROFILE_REFRESH_EVENT, handleRefresh)
      return () => {
        window.removeEventListener(PROFILE_REFRESH_EVENT, handleRefresh)
      }
    }
  }, [])

  useEffect(() => {
    const loadProfile = async () => {
      if (session?.user?.id) {
        setIsLoading(true)
        try {
          const profile = await getUserProfile()
          if (profile) {
            setProfileImage(profile.customImage || profile.image || null)
          }
        } catch (error) {
          console.error('Failed to load profile', error)
          // Fallback to session image
          setProfileImage(session.user.image || null)
        } finally {
          setIsLoading(false)
        }
      }
    }
    loadProfile()
  }, [session?.user?.id, session?.user?.image, refreshKey])

  return { profileImage, isLoading }
}
