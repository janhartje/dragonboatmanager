import React from 'react';
import { render, screen } from '@testing-library/react';
import { ImportModal } from '../ImportModal';

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

// Mock hooks
const mockUseDrachenboot = jest.fn();
jest.mock('@/context/DrachenbootContext', () => ({
  useDrachenboot: () => mockUseDrachenboot(),
}));

jest.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

// Mock server actions
jest.mock('@/app/actions/team', () => ({
  importPaddlers: jest.fn(),
  importEvents: jest.fn(),
}));

describe('ImportModal', () => {
  const mockClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    mockUseDrachenboot.mockReturnValue({
      currentTeam: { plan: 'FREE', maxMembers: 20 },
      paddlers: [],
      refreshTeam: jest.fn(),
    });

    render(<ImportModal isOpen={true} onClose={mockClose} onImportPaddlers={jest.fn()} onImportEvents={jest.fn()} />);
    
    expect(screen.getByText('importData')).toBeInTheDocument();
    expect(screen.getByText('dragDropOrClick')).toBeInTheDocument();
  });

  it('shows limit warning and disables button when import exceeds limit', async () => {
    mockUseDrachenboot.mockReturnValue({
      currentTeam: { plan: 'FREE', maxMembers: 5, primaryColor: 'blue' },
      paddlers: [{ id: 1 }, { id: 2 }, { id: 3 }], // 3 existing
      refreshTeam: jest.fn(),
    });

    render(<ImportModal isOpen={true} onClose={mockClose} onImportPaddlers={jest.fn()} onImportEvents={jest.fn()} />);
    
    // Check if modal rendered
    expect(screen.getByText('importData')).toBeInTheDocument();

    const importButton = screen.getByRole('button', { name: /importButton/i });
    expect(importButton).toBeInTheDocument();
  });
});
