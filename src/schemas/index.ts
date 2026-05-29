import { z } from 'zod';

// Runtime schemas mirroring the domain types. These become the single source of
// truth for API request validation in Session 3.

export const exerciseEntrySchema = z.object({
  id: z.string(),
  value: z.number(),
});

export const logInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  exercises: z.array(exerciseEntrySchema).default([]),
  points: z.number().nonnegative().default(0),
  minutes: z.number().nonnegative().default(0),
  bingo: z.boolean().optional(),
  bingoFootball: z.boolean().optional(),
  dailyChallenge: z.boolean().optional(),
  iceCream: z.number().nonnegative().optional(),
  swim: z.number().nonnegative().optional(),
  pages: z.number().nonnegative().optional(),
  title: z.string().optional(),
});

export const loginInputSchema = z.object({
  alias: z.string().min(1),
  password: z.string().min(1),
});

export type ExerciseEntryInput = z.infer<typeof exerciseEntrySchema>;
export type LogInput = z.infer<typeof logInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
