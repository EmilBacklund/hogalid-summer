// Veckans fotoutmaning — sommarteman (inte fotboll!) så alla kan vara med
// oavsett var de är: stugan, stan eller utomlands. Ingen vinnare utses;
// alla som får en bild godkänd under veckan får samma bonus.
import type { PhotoChallenge } from '../types';

/**
 * Points awarded server-side when a player's photo is approved during a
 * challenge week (SEC H1 — the client never decides points). One bonus per
 * player and challenge.
 */
export const PHOTO_CHALLENGE_POINTS = 50;

/**
 * Monday of the first challenge week. Weeks before this show the first
 * challenge (so the feature is live the day it deploys); after the last
 * one the list cycles.
 */
export const PHOTO_CHALLENGES_START = '2026-07-06';

export const PHOTO_CHALLENGES: PhotoChallenge[] = [
  {
    id: 'glass',
    label: 'Sommarens glass',
    icon: '🍦',
    description: 'Fota veckans bästa glass innan du äter upp den. Ju galnare smak desto bättre!',
  },
  {
    id: 'guldtimmen',
    label: 'Guldtimmen',
    icon: '🌅',
    description:
      'Fånga en solnedgång eller soluppgång. Var som helst — balkongen, stranden eller genom bilrutan.',
  },
  {
    id: 'sommarmys',
    label: 'Sommarmys',
    icon: '📚',
    description:
      'Fota var du läser eller myser bäst i sommar — kojan, tältet eller filten i gräset.',
  },
  {
    id: 'plask',
    label: 'Plask!',
    icon: '💦',
    description:
      'En bild på vatten: badet, sjön, vattenspridaren eller regnpölen. Action uppmuntras!',
  },
  {
    id: 'sommarplats',
    label: 'Min sommarplats',
    icon: '🏝️',
    description:
      'Bilden av DITT favoritställe i sommar. Hemligt gömställe, bryggan, hängmattan eller kiosken.',
  },
  {
    id: 'tallriken',
    label: 'Sommar på tallriken',
    icon: '🍓',
    description:
      'Det godaste eller somrigaste du ätit i veckan. Jordgubbar, grillat, våffla — allt räknas.',
  },
  {
    id: 'molnbilder',
    label: 'Molnbilder',
    icon: '☁️',
    description:
      'Hitta ett moln som ser ut som något — ett djur? En boll? En glass? Berätta vad du ser!',
  },
  {
    id: 'sommardjuret',
    label: 'Sommardjuret',
    icon: '🦆',
    description:
      'Veckans bästa djurbild: kossa på bete, mås som snor pommes eller grannens katt i solen.',
  },
  {
    id: 'fargjakten',
    label: 'Färgjakten: gult',
    icon: '🌈',
    description:
      'Veckans färg är GUL — fota det gulaste du hittar i sommarsverige (eller var du än är).',
  },
  {
    id: 'minstingen',
    label: 'Sommarens minsting',
    icon: '🐞',
    description: 'Fota det minsta sommarkrypet eller den minsta blomman du hittar. Makroläge på!',
  },
];
