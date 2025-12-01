import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SeatBox from '../SeatBox';
import { BoatConfigItem, Paddler } from '@/types';

// Mock SkillBadges to simplify test
jest.mock('../../ui/SkillBadges', () => () => <div data-testid="skill-badges" />);

describe('SeatBox', () => {
  const mockSeat: BoatConfigItem = { id: 'row-1-left', type: 'paddler', side: 'left', row: 1 };
  const mockPaddler: Paddler = { id: 'p1', name: 'Test Paddler', weight: 80, skills: ['left'] };

  it('renders empty state correctly', () => {
    render(<SeatBox seat={mockSeat} />);
    expect(screen.getByText('Frei')).toBeInTheDocument();
  });

  it('renders paddler info when assigned', () => {
    render(<SeatBox seat={mockSeat} paddler={mockPaddler} />);
    expect(screen.getByText('Test Paddler')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
  });

  it('renders canister state correctly', () => {
    const canister: Paddler = { ...mockPaddler, isCanister: true, name: 'Canister' };
    render(<SeatBox seat={mockSeat} paddler={canister} />);
    expect(screen.getByText('Canister')).toBeInTheDocument();
    // Should not render skill badges for canister
    expect(screen.queryByTestId('skill-badges')).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<SeatBox seat={mockSeat} onClick={onClick} />);
    fireEvent.click(screen.getByText('Frei').closest('div')!);
    expect(onClick).toHaveBeenCalled();
  });
});
