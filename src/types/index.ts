// Shared domain types for the Högalid F15 app.

/** A single exercise entry inside a log (e.g. { id: 'toetaps', value: 100 }). */
export interface ExerciseEntry {
  id: string;
  value: number;
}

/** A training/activity log row. */
export interface Log {
  id: number;
  date: string; // YYYY-MM-DD
  exercises: ExerciseEntry[];
  points: number;
  minutes: number;
  bingo: boolean;
  bingoFootball: boolean;
  dailyChallenge: boolean;
  iceCream: number;
  swim: number;
  pages: number;
  title: string;
  createdAt: string;
}

/** DiceBear avatar configuration — a map of category → selected option (or null). */
export type AvatarConfig = Record<string, string | null>;

/** Easter-egg / secret progress flags stored per user. */
export interface SecretFlags {
  foundAdultBingo?: boolean;
  foundPenaltyGame?: boolean;
  penaltyBest?: number;
}

/** A user's role. Players play the game; leaders are coach accounts that
 * moderate (e.g. approve photos) but never appear in leaderboards. */
export type Role = 'player' | 'leader';

/** A player account, as returned by the API and consumed by the UI. */
export interface User {
  alias: string;
  role: Role;
  displayAlias: string;
  displayName?: string;
  avatarConfig: AvatarConfig;
  unlockedItems: string[];
  highscores: Record<string, number>;
  secretFlags: SecretFlags;
  joinedAt: string | null;
  photoCount: number;
  logs: Log[];
  bingo: string[];
  bonusBingo: string[];
  bingoTwo: string[];
  adultBingo: string[];
  completedDaily: Record<string, string>; // date → challengeId
  isAdmin?: boolean;
}

/**
 * Approval state of an album photo. Uploads start as `pending` and only become
 * visible to the team once a leader (or the admin) approves them; rejected
 * photos are removed entirely, so `rejected` is transient and never listed.
 */
export type PhotoStatus = 'pending' | 'approved' | 'rejected';

/**
 * A photo in the team album. Bytes are NOT inlined (SEC M1) — `url` points at
 * the auth-gated bytes route (`/api/photos/:id`).
 */
export interface Photo {
  id: number;
  alias: string;
  uploaderName: string;
  mimeType: string;
  weekStart: string;
  uploadedAt: string;
  date: string;
  url: string;
  /** Approval state. The team album only ever shows `approved` photos; an
   * uploader additionally sees their own `pending` ones (badged as awaiting). */
  status: PhotoStatus;
}

/** One page of the paginated photo album. */
export interface PhotosPage {
  photos: Photo[];
  nextOffset: number | null;
}

/**
 * A short announcement posted by a leader/admin, surfaced in the team feed.
 * `authorName` is the poster's display name (resolved server-side from `alias`).
 */
export interface TeamMessage {
  id: number;
  alias: string;
  authorName: string;
  body: string;
  createdAt: string;
}

/** Season configuration returned by `/api/config`. */
export interface Config {
  seasonStart: string | null;
  countdownDate: string | null;
}

/** A buddy challenge as returned by `/api/buddy-challenges`. */
export interface BuddyChallenge {
  id: string;
  fromAlias: string;
  toAlias: string;
  exerciseId: string;
  amount: number;
  status: string;
  createdAt: string;
  acceptedAt: string | null;
  fromCompletedAt: string | null;
  toCompletedAt: string | null;
  fromProgress: number;
  toProgress: number;
}

/** Current-session response from `/api/auth/me`: a user, or the admin marker. */
export type Me = User | { alias: 'admin'; isAdmin: true };

/** An invite as served to the admin UI (mirrors the server's InviteClient). */
export interface Invite {
  id: number;
  label: string;
  token: string;
  code: string;
  status: 'active' | 'clicked' | 'used' | 'disabled';
  clickedAt: string | null;
  usedAt: string | null;
  usedByAlias: string;
  createdAt: string;
}

// ── Static data shapes (constants) ──────────────────────────────────────────

export interface Exercise {
  id: string;
  label: string;
  unit: string;
  color: string;
  max: number;
  hasHighscore?: boolean;
  isTime?: boolean;
}

export interface SummerActivity {
  id: string;
  label: string;
  icon: string;
  unit: string;
  color: string;
  max: number;
}

export interface Level {
  name: string;
  min: number;
  icon: string;
}

export interface TeamLevel extends Level {
  color: string;
}

export interface BingoTile {
  id: string;
  label: string;
  cat?: string;
  points?: number;
}

export interface DailyChallenge {
  id: string;
  label: string;
  points: number;
  icon: string;
}

export type WeeklyChallengeType = 'touch' | 'minutes';

export interface WeeklyChallenge {
  id: string;
  label: string;
  type: WeeklyChallengeType;
  goal: number;
  points: number;
}

export interface Sticker {
  id: string;
  label: string;
  icon: string;
  group: string;
  description: string;
}

// ── Derived shapes (computed by utils) ───────────────────────────────────────

export interface Stats {
  totalPoints: number;
  totalMinutes: number;
  totalLogs: number;
  totalTouch: number;
  exerciseCounts: Record<string, number>;
  exerciseHighscores: Record<string, number>;
  streak: number;
  maxStreak: number;
  bingoCount: number;
  bingoLines: number;
  totalIceCream: number;
  totalSwim: number;
  totalPages: number;
  photoCount: number;
  iceCreamStreak: number;
  swimStreak: number;
  readStreak: number;
}

export interface WeeklyLevelInfo {
  level: number;
  levelName: string | null;
  nextLevelName: string | null;
  isMaxLevel: boolean;
  progress: number;
  nextThreshold: number;
  thresholds: number[];
}

export interface WeeklyHistoryEntry {
  weekStart: string;
  weekEnd: string;
  challenge: WeeklyChallenge;
  value: number;
  levelInfo: WeeklyLevelInfo;
}

/** An achievement badge; `condition` is evaluated against computed Stats. */
export interface Badge {
  id: string;
  label: string;
  icon: string;
  condition: (s: Stats) => boolean;
}

/** An avatar reward tier that unlocks options in one or more categories. */
export interface AvatarReward {
  id: string;
  label: string;
  cost: number;
  unlocks: Record<string, string[]>;
}

/** Avatar customization category metadata (for UI rendering). */
export interface AvatarCategory {
  key: string;
  label: string;
  type: 'variant' | 'color';
  alwaysVisible: boolean;
}

/** A collector card (player or legend). */
export interface Card {
  id: string;
  name: string;
  image: string;
  type: 'player' | 'legend';
  number: number;
  position: string | null;
  club: string | null;
  youthClub: string | null;
  blurb: string | null;
  emoji?: string;
}

/** Profile data backing a collector card. */
export interface PlayerCardProfile {
  id: string;
  imageFile: string;
  name: string;
  position?: string;
  youthClub?: string;
  currentClub?: string;
  blurb?: string;
  sourceUrl?: string;
}

/** A single activity-feed event. */
export interface FeedEvent {
  date: string;
  type: string;
  alias: string;
  isMe: boolean;
  text: string;
  icon: string;
  createdAt?: string;
  target?: string;
  photoId?: number;
}
