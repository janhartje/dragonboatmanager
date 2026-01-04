
import React from 'react';
import { render, screen } from '@testing-library/react';
import PaddlerModal from '../PaddlerModal';

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

const mockUseDrachenboot = jest.fn();
jest.mock('@/context/DrachenbootContext', () => ({
  useDrachenboot: () => mockUseDrachenboot(),
}));

jest.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

// Mock server actions to avoid importing auth.ts which breaks in Jest
jest.mock('@/app/actions/team', () => ({
  linkPaddlerToAccount: jest.fn(),
  inviteMember: jest.fn(),
}));

// Mock child form to inspect props
jest.mock('../PaddlerForm', () => {
  return function MockPaddlerForm({ disabled }: { disabled: boolean }) {
    return <div data-testid="paddler-form" data-disabled={disabled.toString()} />;
  };
});

describe('PaddlerModal', () => {
  const mockClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes disabled prop to form when limit is reached', () => {
    mockUseDrachenboot.mockReturnValue({
      currentTeam: { plan: 'FREE', maxMembers: 5 },
      paddlers: [{}, {}, {}, {}, {}], // 5 paddlers (full)
    });

    render(<PaddlerModal isOpen={true} onClose={mockClose} paddlerToEdit={null} onSave={jest.fn()} t={(k) => k} />);
    
    const form = screen.getByTestId('paddler-form');
    expect(form).toHaveAttribute('data-disabled', 'true');
  });


});
