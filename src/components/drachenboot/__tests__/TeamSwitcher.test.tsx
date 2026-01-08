import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import TeamSwitcher from '../TeamSwitcher';
import { DrachenbootProvider } from '@/context/DrachenbootContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { useTeam } from '@/context/TeamContext';
import { SessionProvider } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useRouter, usePathname } from '@/i18n/routing';
import { Session } from 'next-auth';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

// Mock i18n routing
jest.mock('@/i18n/routing', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  Link: ({ children, href }: { children: React.ReactNode, href: string }) => <a href={href}>{children}</a>,
  redirect: jest.fn(),
}));

// Mock useTeam
// Mock useTeam
const mockTeamMethods = {
  currentTeam: { id: 'team-1', name: 'Team 1', primaryColor: 'blue', plan: 'FREE' },
  teams: [{ id: 'team-1', name: 'Team 1' }],
  switchTeam: jest.fn(),
  createTeam: jest.fn(),
};

jest.mock('@/context/TeamContext', () => ({
  useTeam: jest.fn(() => mockTeamMethods),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock fetch
global.fetch = jest.fn();

const mockTeams = [
  { id: '1', name: 'Team 1', plan: 'FREE' }
];

const mockSession: Session = {
  user: { id: 'user-1', name: 'Test User' },
  expires: '2025-01-01',
};

describe('TeamSwitcher', () => {
  const mockPush = jest.fn();
  const mockPathname = '/app/teams/1';

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (usePathname as jest.Mock).mockReturnValue(mockPathname);
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/teams') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockTeams),
        });
      }
      if (url === '/api/user/preferences') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ activeTeamId: '1' }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it('should redirect to new team after creation if on team detail page', async () => {
    const newTeam = { id: '2', name: 'Team 2', plan: 'FREE' };
    (global.fetch as jest.Mock).mockImplementation((url: string, options: RequestInit) => {
      if (url === '/api/teams' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(newTeam),
        });
      }
      if (url === '/api/teams') return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTeams) });
      if (url === '/api/user/preferences') return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      if (url.includes('/api/paddlers')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      if (url.includes('/api/events')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    const { createTeam } = useTeam();
    (createTeam as jest.Mock).mockResolvedValue(newTeam);

    render(
      <SessionProvider session={mockSession}>
        <LanguageProvider>
          <DrachenbootProvider>
            <TeamSwitcher />
          </DrachenbootProvider>
        </LanguageProvider>
      </SessionProvider>
    );

    // Wait for initial load
    const teamButton = await screen.findByRole('button', { name: /Team 1/i });
    fireEvent.click(teamButton);

    // Find and click "Create Team" in Switcher dropdown
    const createTeamNavItem = await screen.findByText(/Create Team/i);
    fireEvent.click(createTeamNavItem);

    // Enter name
    const input = await screen.findByPlaceholderText(/e\.g\. Drachenboot A/i);
    fireEvent.change(input, { target: { value: 'Team 2' } });

    // Submit the form directly
    const form = document.getElementById('create-team-form');
    if (!form) throw new Error('Form not found');
    fireEvent.submit(form);

    // Check if redirect was called for Team 2
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/app/teams/2'));
    }, { timeout: 4000 });
  });
});
