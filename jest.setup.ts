import '@testing-library/jest-dom'
import React from 'react';
import { TextEncoder, TextDecoder } from 'util';

Object.assign(global, { TextDecoder, TextEncoder });

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

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  }),
) as jest.Mock;

// Mock next-intl
jest.mock('next-intl', () => ({
  useLocale: jest.fn(() => 'de'),
  useMessages: jest.fn(() => ({
    createTeam: 'Create Team',
    selectTeam: 'Select Team',
    teams: 'Teams',
    teamSettings: 'Team Settings',
    general: 'General',
    members: 'Members',
    name: 'Name',
    completeProfile: 'Complete Profile',
    left: 'Left',
    right: 'Right',
    drum: 'Drum',
    steer: 'Steer',
  })),
  useTranslations: jest.fn(() => (key: string) => key),
  useFormatter: jest.fn(() => ({
    dateTime: jest.fn((d) => d.toString()),
    number: jest.fn((n) => n.toString()),
  })),
}));

// Mock next-intl/navigation
jest.mock('next-intl/navigation', () => ({
  createNavigation: jest.fn(() => ({
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => React.createElement('a', { href }, children),
    redirect: jest.fn(),
    usePathname: jest.fn(() => '/'),
    useRouter: jest.fn(() => ({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    })),
  })),
}));

// Mock next-intl/routing
jest.mock('next-intl/routing', () => ({
  defineRouting: jest.fn((config) => config),
}));
