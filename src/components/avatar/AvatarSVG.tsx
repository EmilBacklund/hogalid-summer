import { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';
import type { AvatarConfig } from '@/types';

type CreateAvatarOptions = Parameters<typeof createAvatar>[1];

/** Renders a DiceBear "adventurer" avatar from a stored {@link AvatarConfig}. */
export function AvatarSVG({
  avatarConfig,
  size = 52,
}: {
  avatarConfig: AvatarConfig;
  size?: number;
}) {
  const dataUri = useMemo(() => {
    const c = avatarConfig ?? {};
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
    // DiceBear types each field as a literal-union array; our values come from
    // the validated avatar constants, so we assert the shape once here.
    return createAvatar(adventurer, options as unknown as CreateAvatarOptions).toDataUri();
  }, [avatarConfig, size]);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- data-URI avatar, not a remote asset
    <img
      src={dataUri}
      width={size}
      height={size}
      alt="Avatar"
      className="block shrink-0 rounded-full"
    />
  );
}
