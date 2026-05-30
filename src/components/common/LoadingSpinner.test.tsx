import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner, SkeletonBar, ButtonLoader } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('shows its text', () => {
    render(<LoadingSpinner text="Laddar lag..." />);
    expect(screen.getByText('Laddar lag...')).toBeInTheDocument();
  });

  it('shows the brand wordmark in splash mode', () => {
    render(<LoadingSpinner size="splash" />);
    expect(screen.getByText('Högalid F15')).toBeInTheDocument();
  });

  it('SkeletonBar and ButtonLoader render', () => {
    const { container: a } = render(<SkeletonBar />);
    expect(a.querySelector('.animate-shimmer')).toBeTruthy();
    const { container: b } = render(<ButtonLoader />);
    expect(b.querySelectorAll('.animate-dot-pulse')).toHaveLength(3);
  });
});
