import React from 'react';
import { render, screen } from '@testing-library/react';
import PaddlerList from '../PaddlerList';
import { useDrachenboot } from '@/context/DrachenbootContext';
import { useSession } from 'next-auth/react';

// Mocks
jest.mock('lucide-react', () => {
  return new Proxy({}, {
    get: (target, prop) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const React = require('react');
      return () => React.createElement('div', { 'data-testid': `icon-${String(prop).toLowerCase()}` });
    }
  });
});

jest.mock('@/context/DrachenbootContext');
jest.mock('@/context/TeamContext', () => ({
  useTeam: jest.fn(() => ({
    currentTeam: { id: 'team-1', name: 'Team 1', plan: 'PRO', maxMembers: 50 },
  })),
}));
jest.mock('next-auth/react');
jest.mock('../../../ui/SkillBadges', () => {
  const MockSkillBadges = () => <div data-testid="skill-badges" />;
  MockSkillBadges.displayName = 'MockSkillBadges';
  return MockSkillBadges;
});

const mockUseDrachenboot = useDrachenboot as jest.Mock;
const mockUseSession = useSession as jest.Mock;
const mockOnEdit = jest.fn();
const mockOnDelete = jest.fn();
const mockT = (key: string) => key;

describe('PaddlerList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDrachenboot.mockReturnValue({
      userRole: 'CAPTAIN',
      currentTeam: { plan: 'PRO', maxMembers: 50 },
    });
    mockUseSession.mockReturnValue({
      data: { user: { id: 'captain-id' } },
      status: 'authenticated',
    });
  });

  it('displays pending status for invited users', () => {
    const pendingPaddler = {
      id: 'p-pending',
      name: 'Pending User',
      weight: 75,
      inviteEmail: 'test@example.com',
      skills: [] as string[],
      userId: undefined // Changed null to undefined
    };

    render(
      <PaddlerList
        paddlers={[pendingPaddler]}
        editingId={null}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        t={mockT}
      />
    );

    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.queryByTestId('skill-badges')).not.toBeInTheDocument();
  });
});
