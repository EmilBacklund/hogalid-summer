import type { Photo } from '@/types';

/** One photo slot in a scrapbook page (12-col grid placement + tilt). */
export interface AlbumSlot {
  gridColumn: string;
  gridRow: string;
  aspectRatio: string;
  rotate: number;
  tape: number;
}

/** A built album page: a layout key + the photos that fill it. */
export interface AlbumPageData {
  layout: string;
  photos: Photo[];
}

const PAGE_PATTERNS: { key: string; count: number }[] = [
  { key: 'hero-side', count: 3 },
  { key: 'duo', count: 2 },
  { key: 'solo', count: 1 },
  { key: 'grid', count: 4 },
  { key: 'top-strip', count: 3 },
];

export function getTapeRotation(seed: number): number {
  const values = [-8, 7, -5, 10, -6, 4];
  return values[seed % values.length]!;
}

export function getPaperRotation(seed: number): number {
  const values = [-3, 2, -1, 4, -4, 1];
  return values[seed % values.length]!;
}

export function getLayoutSlots(layoutKey: string): AlbumSlot[] {
  if (layoutKey === 'solo') {
    return [{ gridColumn: '2 / 12', gridRow: '1 / 3', aspectRatio: '3 / 4', rotate: -2, tape: -6 }];
  }
  if (layoutKey === 'duo') {
    return [
      { gridColumn: '1 / 7', gridRow: '1 / 3', aspectRatio: '3 / 4', rotate: -3, tape: -8 },
      { gridColumn: '7 / 13', gridRow: '1 / 3', aspectRatio: '3 / 4', rotate: 2, tape: 7 },
    ];
  }
  if (layoutKey === 'grid') {
    return [
      { gridColumn: '1 / 7', gridRow: '1 / 2', aspectRatio: '4 / 3', rotate: -2, tape: -6 },
      { gridColumn: '7 / 13', gridRow: '1 / 2', aspectRatio: '4 / 3', rotate: 3, tape: 8 },
      { gridColumn: '1 / 7', gridRow: '2 / 3', aspectRatio: '4 / 3', rotate: 1, tape: -4 },
      { gridColumn: '7 / 13', gridRow: '2 / 3', aspectRatio: '4 / 3', rotate: -3, tape: 6 },
    ];
  }
  if (layoutKey === 'top-strip') {
    return [
      { gridColumn: '1 / 13', gridRow: '1 / 2', aspectRatio: '16 / 9', rotate: -2, tape: -6 },
      { gridColumn: '1 / 6', gridRow: '2 / 3', aspectRatio: '3 / 4', rotate: 2, tape: 8 },
      { gridColumn: '8 / 13', gridRow: '2 / 3', aspectRatio: '3 / 4', rotate: -3, tape: -8 },
    ];
  }
  return [
    { gridColumn: '1 / 8', gridRow: '1 / 3', aspectRatio: '3 / 4', rotate: -3, tape: -6 },
    { gridColumn: '8 / 13', gridRow: '1 / 2', aspectRatio: '1 / 1', rotate: 3, tape: 7 },
    { gridColumn: '8 / 13', gridRow: '2 / 3', aspectRatio: '1 / 1', rotate: -2, tape: -5 },
  ];
}

function getFallbackLayout(count: number, pageIndex: number): string {
  if (count <= 1) return 'solo';
  if (count === 2) return 'duo';
  if (count === 4) return 'grid';
  return pageIndex % 2 === 0 ? 'hero-side' : 'top-strip';
}

/** Split photos into scrapbook pages following the repeating pattern. */
export function buildAlbumPages(photos: Photo[]): AlbumPageData[] {
  const pages: AlbumPageData[] = [];
  let cursor = 0;
  let pageIndex = 0;

  while (cursor < photos.length) {
    const remaining = photos.length - cursor;
    const pattern = PAGE_PATTERNS[pageIndex % PAGE_PATTERNS.length]!;
    const count = Math.min(pattern.count, remaining);
    const layout = count === pattern.count ? pattern.key : getFallbackLayout(count, pageIndex);
    pages.push({ layout, photos: photos.slice(cursor, cursor + count) });
    cursor += count;
    pageIndex += 1;
  }

  return pages;
}
