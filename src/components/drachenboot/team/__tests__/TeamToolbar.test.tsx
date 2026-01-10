import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TeamToolbar from '../TeamToolbar';

// Mock lucide-react
jest.mock('lucide-react', () => {
  return new Proxy({}, {
    get: (target, prop) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const React = require('react');
      return () => React.createElement('div', { 'data-testid': `icon-${String(prop).toLowerCase()}` });
    }
  });
});

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock Card component
jest.mock('@/components/ui/core/Card', () => {
  const MockCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  );
  MockCard.displayName = 'MockCard';
  return { Card: MockCard };
});

describe('TeamToolbar', () => {
  const mockOnSearchChange = jest.fn();
  const mockOnFilterChange = jest.fn();
  const mockOnSortChange = jest.fn();

  const defaultProps = {
    searchTerm: '',
    onSearchChange: mockOnSearchChange,
    filterSkills: [],
    onFilterChange: mockOnFilterChange,
    sortBy: 'name',
    sortOrder: 'asc' as 'asc' | 'desc',
    onSortChange: mockOnSortChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search input', () => {
    render(<TeamToolbar {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('searchPlaceholder');
    expect(searchInput).toBeInTheDocument();
  });

  it('calls onSearchChange when typing in search input', () => {
    render(<TeamToolbar {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('searchPlaceholder');

    fireEvent.change(searchInput, { target: { value: 'John' } });

    expect(mockOnSearchChange).toHaveBeenCalledWith('John');
  });

  it('renders filter button', () => {
    render(<TeamToolbar {...defaultProps} />);
    const filterButton = screen.getByText('filter');
    expect(filterButton).toBeInTheDocument();
  });

  it('shows filter count badge when filters are applied', () => {
    render(<TeamToolbar {...defaultProps} filterSkills={['left', 'drum']} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('toggles filter visibility when filter button is clicked', () => {
    render(<TeamToolbar {...defaultProps} />);
    const filterButton = screen.getByText('filter');

    // Initially, skill filters should not be visible
    expect(screen.queryByText(/filterBySkills/)).not.toBeInTheDocument();

    // Click to show filters
    fireEvent.click(filterButton);
    expect(screen.getByText(/filterBySkills/)).toBeInTheDocument();

    // Click again to hide filters
    fireEvent.click(filterButton);
    expect(screen.queryByText(/filterBySkills/)).not.toBeInTheDocument();
  });

  it('renders sort dropdown with options', () => {
    render(<TeamToolbar {...defaultProps} />);
    const sortSelect = screen.getByDisplayValue('sortNameAsc');
    expect(sortSelect).toBeInTheDocument();
  });

  it('calls onSortChange when sort option is selected', () => {
    render(<TeamToolbar {...defaultProps} />);
    const sortSelect = screen.getByDisplayValue('sortNameAsc');

    fireEvent.change(sortSelect, { target: { value: 'weight-desc' } });

    expect(mockOnSortChange).toHaveBeenCalledWith('weight', 'desc');
  });

  it('renders clear button when filters are active', () => {
    render(<TeamToolbar {...defaultProps} searchTerm="John" />);
    expect(screen.getByTitle('clearFilters')).toBeInTheDocument();
  });

  it('does not render clear button when no filters are active', () => {
    render(<TeamToolbar {...defaultProps} />);
    expect(screen.queryByTitle('clearFilters')).not.toBeInTheDocument();
  });

  it('calls clear handlers when clear button is clicked', () => {
    render(<TeamToolbar {...defaultProps} searchTerm="John" filterSkills={['left']} />);
    const clearButton = screen.getByTitle('clearFilters');

    fireEvent.click(clearButton);

    expect(mockOnSearchChange).toHaveBeenCalledWith('');
    expect(mockOnFilterChange).toHaveBeenCalledWith([]);
  });

  it('toggles skill filter when skill button is clicked', () => {
    render(<TeamToolbar {...defaultProps} />);
    const filterButton = screen.getByText('filter');

    // Show filters
    fireEvent.click(filterButton);

    const leftButton = screen.getByText('left');
    fireEvent.click(leftButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith(['left']);
  });

  it('removes skill from filter when already selected skill is clicked', () => {
    render(<TeamToolbar {...defaultProps} filterSkills={['left', 'drum']} />);
    const filterButton = screen.getByText('filter');

    // Show filters
    fireEvent.click(filterButton);

    const leftButton = screen.getByText('left');
    fireEvent.click(leftButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith(['drum']);
  });
});
