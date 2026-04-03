import { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import * as adventurer from '@dicebear/adventurer';

export function AvatarSVG({ avatarConfig, size = 52 }) {
  const dataUri = useMemo(() => {
    const c = avatarConfig || {};
    const options = {
      seed: 'fixed',
      size,
      randomizeIds: true,
      skinColor: c.skinColor ? [c.skinColor] : ['f2d3b1'],
      hair: c.hair ? [c.hair] : ['long01'],
      hairColor: c.hairColor ? [c.hairColor] : ['0e0e0e'],
      eyes: c.eyes ? [c.eyes] : ['variant01'],
      eyebrows: c.eyebrows ? [c.eyebrows] : ['variant02'],
      mouth: c.mouth ? [c.mouth] : ['variant02'],
      hairProbability: 100,
      glassesProbability: c.glasses ? 100 : 0,
      glasses: c.glasses ? [c.glasses] : [],
      earringsProbability: c.earrings ? 100 : 0,
      earrings: c.earrings ? [c.earrings] : [],
      featuresProbability: c.features ? 100 : 0,
      features: c.features ? [c.features] : [],
      backgroundColor: c.backgroundColor ? [c.backgroundColor] : [],
    };
    return createAvatar(adventurer, options).toDataUri();
  }, [avatarConfig, size]);

  return (
    <img
      src={dataUri}
      width={size}
      height={size}
      alt="Avatar"
      style={{ display: 'block', flexShrink: 0, borderRadius: '50%' }}
    />
  );
}
