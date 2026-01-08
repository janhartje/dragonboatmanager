import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Footer from '../Footer';
import { usePWAInstall } from '@/hooks/usePWAInstall';
// Mock the hooks
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/context/DrachenbootContext', () => ({
  useDrachenboot: jest.fn(),
}));

jest.mock('@/hooks/usePWAInstall', () => ({
  usePWAInstall: jest.fn(),
}));

// Mock Modals
jest.mock('../Modals', () => ({
  ImprintModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="imprint-modal">
      Imprint Modal <button onClick={onClose}>Close</button>
    </div>
  ),
  ChangelogModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="changelog-modal">
      Changelog Modal <button onClick={onClose}>Close</button>
    </div>
  ),
}));

describe('Footer', () => {
  const mockPromptInstall = jest.fn();

  beforeEach(() => {

    (usePWAInstall as jest.Mock).mockReturnValue({
      canInstall: false,
      promptInstall: mockPromptInstall,
    });
  });

  it('renders footer links', () => {
    render(<Footer />);
    expect(screen.getByText('legal.common.imprint')).toBeInTheDocument();
    expect(screen.getByText('legal.common.tos')).toBeInTheDocument();
    expect(screen.getByText('legal.common.privacy')).toBeInTheDocument();
  });

  it('opens modals when links are clicked', () => {
    render(<Footer />);
    fireEvent.click(screen.getByText('legal.common.imprint'));
    expect(screen.getByTestId('imprint-modal')).toBeInTheDocument();
  });

  it('opens changelog modal when clicked', () => {
    render(<Footer />);
    fireEvent.click(screen.getByText('changelog'));
    expect(screen.getByTestId('changelog-modal')).toBeInTheDocument();
  });

  it('shows install button when canInstall is true', () => {
    (usePWAInstall as jest.Mock).mockReturnValue({
      canInstall: true,
      promptInstall: mockPromptInstall,
    });

    render(<Footer />);
    const installButton = screen.getByText('installPWA');
    expect(installButton).toBeInTheDocument();
    
    fireEvent.click(installButton);
    expect(mockPromptInstall).toHaveBeenCalled();
  });

  it('does not show install button when canInstall is false', () => {
    (usePWAInstall as jest.Mock).mockReturnValue({
      canInstall: false,
      promptInstall: mockPromptInstall,
    });

    render(<Footer />);
    expect(screen.queryByText('installPWA')).not.toBeInTheDocument();
  });
});
