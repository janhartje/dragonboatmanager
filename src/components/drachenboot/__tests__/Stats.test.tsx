import React from 'react';
import { render, screen } from '@testing-library/react';
import { BalanceBar, TrimBar } from '../Stats';

describe('Stats', () => {
  describe('BalanceBar', () => {
    it('renders correct values', () => {
      render(<BalanceBar left={400} right={420} diff={-20} />);
      expect(screen.getByText('Links')).toBeInTheDocument();
      expect(screen.getByText('Rechts')).toBeInTheDocument();
      expect(screen.getByText('Diff: 20')).toBeInTheDocument();
    });
  });

  describe('TrimBar', () => {
    it('renders Buglastig state', () => {
      render(<TrimBar front={450} back={400} diff={50} />);
      expect(screen.getByText('Bug: 450')).toBeInTheDocument();
      expect(screen.getByText('Heck: 400')).toBeInTheDocument();
      expect(screen.getByText('Buglastig')).toBeInTheDocument();
      expect(screen.getByText('+50')).toBeInTheDocument();
    });

    it('renders Hecklastig state', () => {
      render(<TrimBar front={400} back={450} diff={-50} />);
      expect(screen.getByText('Hecklastig')).toBeInTheDocument();
      expect(screen.getByText('-50')).toBeInTheDocument();
    });
  });
});
