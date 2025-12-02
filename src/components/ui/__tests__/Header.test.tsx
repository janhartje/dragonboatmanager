import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Header from '../Header';
import { useLanguage } from '@/context/LanguageContext';

// Mock the hook
jest.mock('@/context/LanguageContext', () => ({
  useLanguage: jest.fn(),
}));

describe('Header', () => {
  const mockChangeLanguage = jest.fn();
  const mockT = (key: string) => key;

  beforeAll(() => {
    // Global mock for window.matchMedia (needed for PWA functionality)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
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
  });

  beforeEach(() => {
    (useLanguage as jest.Mock).mockReturnValue({
      language: 'de',
      changeLanguage: mockChangeLanguage,
      t: mockT,
    });
  });

  const renderHeader = (props = {}) => {
    return render(<Header title="Test Title" {...props} />);
  };

  it('renders the title', () => {
    renderHeader();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders the subtitle if provided', () => {
    renderHeader({ subtitle: 'Test Subtitle' });
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('calls onHelp when help button is clicked', () => {
    const onHelp = jest.fn();
    renderHeader({ onHelp, showHelp: true });
    const helpButton = screen.getByRole('button', { name: '' }); // Info icon button might not have accessible name, checking structure
    // Actually, let's find by the icon or class if needed, but usually role button is good.
    // Since there are multiple buttons (theme, lang), we need to be specific.
    // The help button is the first one if showHelp is true.
    // Let's use a more robust way: checking for the Info icon or just clicking the first button.
    // Better: Header implementation uses Lucide icons.
    
    // Let's just click all buttons and see if onHelp is called, or find by index.
    // The help button is rendered when showHelp && onHelp is true.
    
    // We can rely on the order or add data-testid in the component, but for now let's try to find by role.
    const buttons = screen.getAllByRole('button');
    // Assuming Help is the first one (before Theme and Lang)
    fireEvent.click(buttons[0]);
    expect(onHelp).toHaveBeenCalled();
  });

  it('toggles language when language button is clicked', () => {
    renderHeader();
    const langButton = screen.getByText('DE');
    fireEvent.click(langButton);
    expect(mockChangeLanguage).toHaveBeenCalledWith('en');
  });

  describe('PWA Install Button', () => {
    let mockBeforeInstallPrompt: any;

    beforeEach(() => {
      // Mock the beforeinstallprompt event
      mockBeforeInstallPrompt = {
        preventDefault: jest.fn(),
        prompt: jest.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      };

      // Mock window.matchMedia for standalone mode detection
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
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
    });

    it('shows install button when showInstallButton is true and beforeinstallprompt fires', async () => {
      renderHeader({ showInstallButton: true });

      // Simulate beforeinstallprompt event
      const event = new Event('beforeinstallprompt') as any;
      Object.assign(event, mockBeforeInstallPrompt);
      window.dispatchEvent(event);

      // Wait for state update and check if install button appears
      await waitFor(() => {
        const installButton = screen.queryByTitle('installPWA');
        expect(installButton).toBeInTheDocument();
      });
    });

    it('does not show install button when showInstallButton is false', () => {
      renderHeader({ showInstallButton: false });

      // Simulate beforeinstallprompt event
      const event = new Event('beforeinstallprompt') as any;
      Object.assign(event, mockBeforeInstallPrompt);
      window.dispatchEvent(event);

      const installButton = screen.queryByText('installPWA');
      expect(installButton).not.toBeInTheDocument();
    });

    it('does not show install button in standalone mode', () => {
      // Mock standalone mode
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
          matches: query === '(display-mode: standalone)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      renderHeader({ showInstallButton: true });

      const installButton = screen.queryByText('installPWA');
      expect(installButton).not.toBeInTheDocument();
    });
  });
});
