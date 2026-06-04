import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AvatarBuilder } from './AvatarBuilder';

const starterOptions = {
  hair: ['long01', 'short01'],
  skinColor: ['f2d3b1', 'aa8866'],
};

describe('AvatarBuilder', () => {
  it('switches category and selects an option', () => {
    const onChange = vi.fn();
    render(<AvatarBuilder avatarConfig={{}} onChange={onChange} starterOptions={starterOptions} />);

    // Default tab is hair (variant) — switch to the color category.
    fireEvent.click(screen.getByRole('button', { name: 'Hudfärg' }));
    const swatch = screen.getByRole('button', { name: 'Färg #f2d3b1' });
    fireEvent.click(swatch);
    expect(onChange).toHaveBeenCalledWith({ skinColor: 'f2d3b1' });
  });

  it('offers a "none" option for optional categories', () => {
    const onChange = vi.fn();
    render(
      <AvatarBuilder
        avatarConfig={{ glasses: 'variant01' }}
        onChange={onChange}
        starterOptions={{ glasses: ['variant01', 'variant02'] }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Glasögon' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ingen' }));
    expect(onChange).toHaveBeenCalledWith({ glasses: null });
  });
});
