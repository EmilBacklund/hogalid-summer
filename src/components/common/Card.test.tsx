import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>hej</Card>);
    expect(screen.getByText('hej')).toBeInTheDocument();
  });

  it('fires onClick and becomes interactive', () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>klick</Card>);
    const el = screen.getByText('klick');
    fireEvent.click(el);
    expect(onClick).toHaveBeenCalledOnce();
    expect(el.className).toContain('cursor-pointer');
  });
});
