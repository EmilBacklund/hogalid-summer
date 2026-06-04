import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { IntroCarousel } from './IntroCarousel';

function swipe(el: Element, fromX: number, toX: number) {
  fireEvent.touchStart(el, { touches: [{ clientX: fromX }] });
  fireEvent.touchEnd(el, { changedTouches: [{ clientX: toX }] });
}

describe('IntroCarousel swipe navigation', () => {
  it('advances to the next page on a left swipe', () => {
    render(<IntroCarousel onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    expect(screen.getByText('1/9')).toBeInTheDocument();
    swipe(dialog, 200, 120); // left
    expect(screen.getByText('2/9')).toBeInTheDocument();
  });

  it('goes back on a right swipe', () => {
    render(<IntroCarousel onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    swipe(dialog, 200, 120); // to page 2
    expect(screen.getByText('2/9')).toBeInTheDocument();
    swipe(dialog, 120, 220); // right → back to 1
    expect(screen.getByText('1/9')).toBeInTheDocument();
  });

  it('ignores a swipe shorter than the threshold', () => {
    render(<IntroCarousel onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    swipe(dialog, 200, 175); // 25px < 50px threshold
    expect(screen.getByText('1/9')).toBeInTheDocument();
  });

  it('does not page back before the first page', () => {
    render(<IntroCarousel onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    swipe(dialog, 120, 220); // right on first page
    expect(screen.getByText('1/9')).toBeInTheDocument();
  });

  it('closes when swiping left past the last page', () => {
    const onClose = vi.fn();
    render(<IntroCarousel onClose={onClose} />);
    const dialog = screen.getByRole('dialog');
    for (let i = 0; i < 8; i++) swipe(dialog, 200, 120); // walk to last page (9/9)
    expect(screen.getByText('9/9')).toBeInTheDocument();
    swipe(dialog, 200, 120); // one more left swipe → close
    expect(onClose).toHaveBeenCalledOnce();
  });
});
