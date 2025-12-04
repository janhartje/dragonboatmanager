import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PaddlerForm from '../PaddlerForm';

describe('PaddlerForm', () => {
  const mockSave = jest.fn();
  const mockCancel = jest.fn();
  const mockT = (key: string) => key;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty form for new paddler', () => {
    render(<PaddlerForm paddlerToEdit={null} onSave={mockSave} onCancel={mockCancel} t={mockT} />);
    expect(screen.getByText('newMember')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('name')).toHaveValue('');
    expect(screen.getByPlaceholderText('kg')).toHaveValue(null);
  });

  it('renders existing data for edit mode', () => {
    const paddler = { id: 'p1', name: 'Test', weight: 80, skills: ['left'] };
    render(<PaddlerForm paddlerToEdit={paddler} onSave={mockSave} onCancel={mockCancel} t={mockT} />);
    expect(screen.getByText('editPaddler')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
    expect(screen.getByDisplayValue('80')).toBeInTheDocument();
  });

  it('calls onSave with correct data', () => {
    render(<PaddlerForm paddlerToEdit={null} onSave={mockSave} onCancel={mockCancel} t={mockT} />);
    
    fireEvent.change(screen.getByPlaceholderText('name'), { target: { value: 'New Paddler' } });
    fireEvent.change(screen.getByPlaceholderText('kg'), { target: { value: '75' } });
    
    // Select a skill (Left)
    fireEvent.click(screen.getByText('left'));
    
    fireEvent.click(screen.getByText('add'));
    
    expect(mockSave).toHaveBeenCalledWith({
      name: 'New Paddler',
      weight: 75,
      skills: ['left'],
      userId: null
    });
  });

  it('validates input before save', () => {
    render(<PaddlerForm paddlerToEdit={null} onSave={mockSave} onCancel={mockCancel} t={mockT} />);
    
    // Try submit without data
    fireEvent.click(screen.getByText('add'));
    expect(mockSave).not.toHaveBeenCalled();
    
    // Add only name (no weight)
    fireEvent.change(screen.getByPlaceholderText('name'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByText('add'));
    expect(mockSave).not.toHaveBeenCalled();
    
    // Add weight too - now it should work (skills are optional)
    fireEvent.change(screen.getByPlaceholderText('kg'), { target: { value: '80' } });
    fireEvent.click(screen.getByText('add'));
    expect(mockSave).toHaveBeenCalledWith({
      name: 'Test',
      weight: 80,
      skills: [],
      userId: null
    });
  });
});
