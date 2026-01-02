/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen } from '@testing-library/react';
import PaddlerForm from '../PaddlerForm';

// Mocks to bypass ESM and dependency issues
jest.mock('@/app/actions/team', () => ({
  linkPaddlerToAccount: jest.fn(),
  inviteMember: jest.fn(),
}));

jest.mock('@/context/DrachenbootContext', () => ({
  useDrachenboot: jest.fn(() => ({
    refetchPaddlers: jest.fn(),
  })),
}));

jest.mock('lucide-react', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    User: () => React.createElement('div', { 'data-testid': 'icon-user' }),
    Pencil: () => React.createElement('div', { 'data-testid': 'icon-pencil' }),
    Save: () => React.createElement('div', { 'data-testid': 'icon-save' }),
    Plus: () => React.createElement('div', { 'data-testid': 'icon-plus' }),
    Link: () => React.createElement('div', { 'data-testid': 'icon-link' }),
    Mail: () => React.createElement('div', { 'data-testid': 'icon-mail' }),
    Loader2: () => React.createElement('div', { 'data-testid': 'icon-loader' }),
    Check: () => React.createElement('div', { 'data-testid': 'icon-check' }),
  };
});

// Mock child components to isolate unit test
jest.mock('@/components/ui/FormInput', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return { FormInput: ({ error, ...props }: any) => React.createElement('input', { ...props, 'data-testid': 'form-input', 'data-error': error ? 'true' : undefined }) };
});
jest.mock('@/components/ui/WeightInput', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return { WeightInput: (props: any) => React.createElement('input', { ...props, 'data-testid': 'weight-input' }) };
});
jest.mock('@/components/ui/SkillSelector', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return { SkillSelector: () => React.createElement('div', { 'data-testid': 'skill-selector' }) };
});

describe('PaddlerForm', () => {
  const mockSave = jest.fn();
  const mockCancel = jest.fn();
  const mockT = (key: string) => key;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<PaddlerForm paddlerToEdit={null} onSave={mockSave} onCancel={mockCancel} t={mockT} />);
    expect(screen.getByTestId('icon-user')).toBeInTheDocument(); // newMember icon
    // Check if form inputs are rendered (via mocks)
    expect(screen.getAllByTestId('form-input').length).toBeGreaterThan(0);
    expect(screen.getByTestId('weight-input')).toBeInTheDocument();
  });

  it('disables save button when disabled prop is true', () => {
    render(<PaddlerForm paddlerToEdit={null} onSave={mockSave} onCancel={mockCancel} t={mockT} disabled={true} />);
    const saveButton = screen.getByTestId('icon-plus').closest('button'); // Finding by child icon since button has no testid
    expect(saveButton).toBeDisabled();
  });
});
