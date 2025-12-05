import '@testing-library/jest-dom'

jest.mock('next-auth/react', () => {
  const mockSession = {
    expires: new Date(Date.now() + 2 * 86400).toISOString(),
    user: { username: "admin" }
  };
  return {
    __esModule: true,
    useSession: jest.fn(() => ({ data: mockSession, status: 'authenticated' })),
    SessionProvider: jest.fn(({ children }) => children),
    signIn: jest.fn(),
    signOut: jest.fn(),
  };
});
