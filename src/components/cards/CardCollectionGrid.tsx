'use client';

import { CardFront, CardBack } from '@/components/common';
import type { Card } from '@/types';

interface CardCollectionGridProps {
  cards: Card[];
  collectedIds: Set<string>;
  onView: (card: Card) => void;
}

/** 3-column grid of collected card fronts and locked (dimmed) backs. */
export function CardCollectionGrid({ cards, collectedIds, onView }: CardCollectionGridProps) {
  return (
    <div className="grid grid-cols-3 justify-items-center gap-2.5">
      {cards.map((card) =>
        collectedIds.has(card.id) ? (
          <CardFront key={card.id} card={card} size={0.6} onClick={() => onView(card)} />
        ) : (
          <CardBack key={card.id} size={0.6} style={{ opacity: 0.5 }} />
        ),
      )}
    </div>
  );
}
