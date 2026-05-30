import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LevelUpModal } from './LevelUpModal';

const level = { name: 'Guld', min: 100, icon: '🥇' };

describe('LevelUpModal', () => {
  it('renders nothing without a level', () => {
    const { container } = render(<LevelUpModal level={null} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows the level name and closes on button click', () => {
    const onClose = vi.fn();
    render(<LevelUpModal level={level} onClose={onClose} />);
    expect(screen.getByText('Guld')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Toppen!' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
