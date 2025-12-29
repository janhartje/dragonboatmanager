import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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


});
