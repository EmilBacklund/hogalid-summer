import { z } from 'zod';

// Single source of truth for API request validation (Session 3). Handlers parse
// every body through these before touching the database.

const aliasSchema = z.string().trim().min(1).max(30);
const challengeIdSchema = z.string().min(1).max(64);

export const exerciseEntrySchema = z.object({
  id: z.string().min(1).max(40),
  value: z.number(),
});

// ── Auth ─────────────────────────────────────────────────────────────────────

export const loginInputSchema = z.object({
  alias: aliasSchema,
  password: z.string().min(1).max(200),
});

export const registerInputSchema = z
  .object({
    alias: aliasSchema,
    password: z.string().min(4).max(200),
    avatarConfig: z.record(z.string(), z.string().nullable()).optional(),
    inviteToken: z.string().max(64).optional(),
    inviteCode: z.string().max(32).optional(),
  })
  .refine((d) => Boolean(d.inviteToken || d.inviteCode), {
    message: 'invite_required',
  });

/** A user choosing their own new password (e.g. a leader's forced first-login
 * change). Alias is always derived from the session cookie, never the body. */
export const changePasswordSchema = z.object({
  newPassword: z.string().min(4).max(200),
});

// ── Self updates (alias always derived from the session cookie) ───────────────

export const updateSelfSchema = z.object({
  highscores: z.record(z.string(), z.number()).optional(),
  unlockedItems: z.array(z.string()).optional(),
  avatarConfig: z.record(z.string(), z.string().nullable()).optional(),
  secretFlags: z.record(z.string(), z.unknown()).optional(),
});

export const displayNameSchema = z.object({
  displayName: z.string().max(40),
});

export const secretProgressSchema = z.object({
  patch: z.object({
    foundAdultBingo: z.boolean().optional(),
    foundPenaltyGame: z.boolean().optional(),
    penaltyBest: z.number().optional(),
  }),
});

// ── Logs ──────────────────────────────────────────────────────────────────────

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** A normal training log. Server recomputes points/minutes (SEC H1). */
export const trainingLogInputSchema = z.object({
  date: dateSchema,
  exercises: z.array(exerciseEntrySchema).default([]),
  iceCream: z.number().optional(),
  swim: z.number().optional(),
  pages: z.number().optional(),
});

export const addLogInputSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('training') }).merge(trainingLogInputSchema),
  z.object({ kind: z.literal('penalty'), score: z.number() }),
]);

export const editLogInputSchema = z.object({
  logId: z.number().int().positive(),
  log: trainingLogInputSchema,
});

export const deleteLogInputSchema = z.object({
  logId: z.number().int().positive(),
});

// ── Bingo / daily ──────────────────────────────────────────────────────────────

export const bingoInputSchema = z.object({
  board: z.enum(['classic', 'adult', 'bonus', 'bingoTwo']),
  challengeId: challengeIdSchema,
  /** Client-reported line-completion bonus; clamped server-side (SEC H1). */
  lineBonus: z.number().optional(),
  lineTitle: z.string().max(200).optional(),
});

export const dailyInputSchema = z.object({
  challengeId: challengeIdSchema,
});

// ── Social: cheers + reactions ──────────────────────────────────────────────────

export const cheerInputSchema = z.object({
  toAlias: aliasSchema,
});

export const cheerSeenInputSchema = z.object({
  ids: z.array(z.number().int().positive()).max(200),
});

export const reactionInputSchema = z.object({
  eventKey: z.string().min(1).max(200),
  emoji: z.string().max(16), // empty string removes the reaction
});

// ── Buddy challenges ─────────────────────────────────────────────────────────

export const buddyCreateSchema = z.object({
  toAlias: aliasSchema,
  exerciseId: z.string().min(1).max(40),
  amount: z.number().int().positive().max(100_000),
});

export const buddyRespondSchema = z.object({
  challengeId: z.string().min(1).max(64),
  response: z.enum(['accept', 'decline']),
});

export const buddyCancelSchema = z.object({
  challengeId: z.string().min(1).max(64),
});

// ── Photos ──────────────────────────────────────────────────────────────────

export const photoUploadSchema = z.object({
  imageData: z.string().regex(/^data:image\/(jpeg|jpg|png|webp);base64,/i),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']).optional(),
});

/** A leader's moderation decision on a pending photo. */
export const photoReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
});

// ── Team messages (leader/admin announcements) ──────────────────────────────────

/** A short announcement a leader/admin posts to the team feed. */
export const teamMessageSchema = z.object({
  body: z.string().trim().min(1).max(280),
});

// ── Weekly results ─────────────────────────────────────────────────────────────

export const weeklyResultSchema = z.object({
  weekStart: dateSchema,
  challengeLabel: z.string().min(1).max(120),
  challengeType: z.string().min(1).max(40),
  value: z.number().int(),
  goal: z.number().int(),
  level: z.number().int(),
  levelName: z.string().max(40).nullable().optional(),
});

// ── Invites (admin, plus public validation) ────────────────────────────────────

export const inviteCreateSchema = z.object({
  label: z.string().trim().min(1).max(50),
});

export const inviteUpdateSchema = z.object({
  inviteId: z.number().int().positive(),
  mode: z.enum(['disable', 'enable']),
});

// ── Admin actions ──────────────────────────────────────────────────────────────

export const adminResetPasswordSchema = z.object({
  alias: aliasSchema,
  newPassword: z.string().min(4).max(200),
});

export const adminCreateLeaderSchema = z.object({
  alias: aliasSchema,
  password: z.string().min(4).max(200),
});

export const adminAliasSchema = z.object({ alias: aliasSchema });

export const adminDateSchema = z.object({ date: dateSchema });

export const adminFirstLogSchema = z.object({ alias: aliasSchema, date: dateSchema });

export const adminDeleteLogSchema = z.object({ logId: z.number().int().positive() });

// ── Inferred types ─────────────────────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginInputSchema>;
export type RegisterInput = z.infer<typeof registerInputSchema>;
export type TrainingLogInput = z.infer<typeof trainingLogInputSchema>;
export type AddLogInput = z.infer<typeof addLogInputSchema>;
export type EditLogInput = z.infer<typeof editLogInputSchema>;
export type BingoInput = z.infer<typeof bingoInputSchema>;
export type DailyInput = z.infer<typeof dailyInputSchema>;
export type BuddyCreateInput = z.infer<typeof buddyCreateSchema>;
export type PhotoUploadInput = z.infer<typeof photoUploadSchema>;
export type PhotoReviewInput = z.infer<typeof photoReviewSchema>;
export type WeeklyResultInput = z.infer<typeof weeklyResultSchema>;
export type TeamMessageInput = z.infer<typeof teamMessageSchema>;
