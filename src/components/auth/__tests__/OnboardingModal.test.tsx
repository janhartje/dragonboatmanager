import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { OnboardingModal } from '../OnboardingModal';
import { LanguageProvider } from '@/context/LanguageContext';
import { Paddler } from '@/types';

const mockPaddler: Partial<Paddler> = {
  id: '1',
  name: '',
  weight: 0,
  skills: [],
};

describe('OnboardingModal', () => {
  const mockOnSave = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSave.mockResolvedValue(undefined);
  });

  it('should disable submit button if no skills are selected', () => {
    render(
      <LanguageProvider>
        <OnboardingModal 
          paddler={mockPaddler as Paddler} 
          onSave={mockOnSave} 
          onClose={mockOnClose} 
        />
      </LanguageProvider>
    );

    // Fill name
    const nameInput = screen.getByPlaceholderText(/Name/i);
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    
    // WeightInput: it's type="number", so it's 'spinbutton'
    const weightInput = screen.getByRole('spinbutton');
    fireEvent.change(weightInput, { target: { value: '75' } });

    const submitButton = screen.getByRole('button', { name: /complete profile|Profil vervollständigen/i });
    
    // It should be disabled because no skills selected
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button and allow saving when all fields are filled', async () => {
    render(
      <LanguageProvider>
        <OnboardingModal 
          paddler={mockPaddler as Paddler} 
          onSave={mockOnSave} 
          onClose={mockOnClose} 
        />
      </LanguageProvider>
    );

    fireEvent.change(screen.getByPlaceholderText(/Name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '75' } });
    
    // Select a skill
    const buttons = screen.getAllByRole('button');
    const leftButton = buttons.find(b => b.textContent?.match(/Left|Links/i));
    if (!leftButton) throw new Error('Left skill button not found');
    fireEvent.click(leftButton);

    const submitButton = screen.getByRole('button', { name: /complete profile|Profil vervollständigen/i });
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);
    
    // Use waitFor to handle the async onSave and subsequent state updates
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test User',
        weight: 75,
        skills: ['left']
      }));
    });

    // Verify onClose was called which happens after onSave
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
