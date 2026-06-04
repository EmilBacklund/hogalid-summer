import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AvatarSVG } from './AvatarSVG';

describe('AvatarSVG', () => {
  it('renders an SVG data-URI image from a config', () => {
    render(<AvatarSVG avatarConfig={{ hair: 'long01', skinColor: 'f2d3b1' }} size={48} />);
    const img = screen.getByAltText('Avatar') as HTMLImageElement;
    expect(img.getAttribute('src')).toMatch(/^data:image\/svg\+xml/);
    expect(img).toHaveAttribute('width', '48');
  });
});
