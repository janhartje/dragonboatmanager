import { renderHook, waitFor, act } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useUserProfile, triggerProfileRefresh } from '../useUserProfile'
import { getUserProfile } from '@/app/actions/user'

// Mock dependencies
jest.mock('next-auth/react')
jest.mock('@/app/actions/user')

const mockUseSession = useSession as jest.Mock
const mockGetUserProfile = getUserProfile as jest.Mock

describe('useUserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Clean up any event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('userProfileRefresh', jest.fn())
    }
  })

  it('should return loading state initially', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } }
    })
    mockGetUserProfile.mockResolvedValue({ customImage: null, image: null })

    const { result } = renderHook(() => useUserProfile())

    expect(result.current.isLoading).toBe(true)
    // Wait for the hook to finish to avoid act warnings (state updates after test ends)
    // The hook will eventually settle when expectations are met or promises resolve
    // Since we only care about initial state, we can leave it, OR better: wait for it to settle even if we don't check result
    // But since we want to check INITIAL state, we check it immediately. 
    // To suppress the warning, we need to ensure the async part resolves inside the test.
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('should load custom profile image when available', async () => {
    const customImage = 'data:image/webp;base64,custom123'
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', email: 'test@example.com', image: 'oauth-image.jpg' } }
    })
    mockGetUserProfile.mockResolvedValue({
      customImage,
      image: 'oauth-image.jpg'
    })

    const { result } = renderHook(() => useUserProfile())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.profileImage).toBe(customImage)
    expect(mockGetUserProfile).toHaveBeenCalledTimes(1)
  })

  it('should fallback to OAuth image when no custom image', async () => {
    const oauthImage = 'https://example.com/oauth-image.jpg'
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', email: 'test@example.com', image: oauthImage } }
    })
    mockGetUserProfile.mockResolvedValue({
      customImage: null,
      image: oauthImage
    })

    const { result } = renderHook(() => useUserProfile())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.profileImage).toBe(oauthImage)
  })

  it('should return null when no images available', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } }
    })
    mockGetUserProfile.mockResolvedValue({
      customImage: null,
      image: null
    })

    const { result } = renderHook(() => useUserProfile())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.profileImage).toBeNull()
  })

  it('should fallback to session image on error', async () => {
    const sessionImage = 'session-fallback.jpg'
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', email: 'test@example.com', image: sessionImage } }
    })
    mockGetUserProfile.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useUserProfile())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.profileImage).toBe(sessionImage)
  })

  it('should refresh profile when triggerProfileRefresh is called', async () => {
    const initialImage = 'data:image/webp;base64,initial'
    const updatedImage = 'data:image/webp;base64,updated'

    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } }
    })
    mockGetUserProfile
      .mockResolvedValueOnce({ customImage: initialImage, image: null })
      .mockResolvedValueOnce({ customImage: updatedImage, image: null })

    const { result } = renderHook(() => useUserProfile())

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.profileImage).toBe(initialImage)

    // Trigger refresh
    // Trigger refresh
    act(() => {
      triggerProfileRefresh()
    })

    // Wait for refresh to complete
    await waitFor(() => {
      expect(result.current.profileImage).toBe(updatedImage)
    })

    expect(mockGetUserProfile).toHaveBeenCalledTimes(2)
  })

  it('should not trigger refresh in SSR environment', () => {
    const originalWindow = global.window
    // @ts-expect-error - Simulating SSR
    delete global.window

    // Should not throw error
    expect(() => triggerProfileRefresh()).not.toThrow()

    global.window = originalWindow
  })

  it('should clean up event listener on unmount', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } }
    })
    mockGetUserProfile.mockResolvedValue({ customImage: null, image: null })

    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useUserProfile())

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'userProfileRefresh',
      expect.any(Function)
    )

    removeEventListenerSpy.mockRestore()
  })

  it('should handle missing session gracefully', async () => {
    mockUseSession.mockReturnValue({ data: null })

    renderHook(() => useUserProfile())

    // Should not call getUserProfile without session
    await waitFor(() => {
      expect(mockGetUserProfile).not.toHaveBeenCalled()
    })
  })

  it('should reload when session user ID changes', async () => {
    mockGetUserProfile.mockResolvedValue({ customImage: 'image1', image: null })

    const { rerender } = renderHook(() => useUserProfile())

    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } }
    })
    rerender()

    await waitFor(() => {
      expect(mockGetUserProfile).toHaveBeenCalledTimes(1)
    })

    // Change user
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-2', email: 'test2@example.com' } }
    })
    rerender()

    await waitFor(() => {
      expect(mockGetUserProfile).toHaveBeenCalledTimes(2)
    })
  })
})

describe('triggerProfileRefresh', () => {
  it('should dispatch custom event in browser environment', () => {
    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent')

    act(() => {
      triggerProfileRefresh()
    })

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'userProfileRefresh'
      })
    )

    dispatchEventSpy.mockRestore()
  })

  it('should handle SSR environment without errors', () => {
    const originalWindow = global.window
    // @ts-expect-error - Simulating SSR
    delete global.window

    expect(() => triggerProfileRefresh()).not.toThrow()

    global.window = originalWindow
  })
})
