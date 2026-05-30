import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PenaltyGame, resetPenaltyToday } from './PenaltyGame';

describe('PenaltyGame', () => {
  beforeEach(() => resetPenaltyToday('maja'));

  it('starts at the intro and can begin a round', () => {
    render(<PenaltyGame alias="maja" onClose={vi.fn()} />);
    expect(screen.getByText('Hemlig penaltyround!')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Starta/ }));
    expect(screen.getByText(/Välj riktning/)).toBeInTheDocument();
  });

  it('records a shot and shows a result', () => {
    render(<PenaltyGame alias="maja" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Starta/ }));
    fireEvent.click(screen.getByRole('button', { name: '← Vänster' }));
    // After shooting, either MÅL or Räddad is shown.
    expect(screen.getByText(/MÅL!|Räddad!/)).toBeInTheDocument();
  });
});
