import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CardBack, CardFront } from './CollectorCard';
import type { Card } from '@/types';

const card: Card = {
  id: 'p1',
  name: 'Test Spelare',
  image: '',
  type: 'player',
  number: 7,
  position: 'Mittfält',
  club: null,
  youthClub: null,
  blurb: null,
};

describe('CollectorCard', () => {
  it('CardBack shows the country wordmark', () => {
    render(<CardBack />);
    expect(screen.getByText('Sverige')).toBeInTheDocument();
  });

  it('CardFront shows name, number and position', () => {
    render(<CardFront card={card} />);
    expect(screen.getByText('Test Spelare')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Mittfält')).toBeInTheDocument();
  });

  it('CardFront marks legends', () => {
    render(<CardFront card={{ ...card, type: 'legend', emoji: '👑' }} />);
    expect(screen.getByText('Legend')).toBeInTheDocument();
  });
});
