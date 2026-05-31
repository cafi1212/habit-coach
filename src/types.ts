/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HabitFrequency = "daily" | "3x per week" | "5x per week" | "weekends";

export interface Habit {
  id: string;
  name: string;
  frequency: HabitFrequency;
  startDate: string; // ISO date string (YYYY-MM-DD)
  streakCount: number; // current streak
  longestStreak: number;
  missedDays: number;
  lastCompletedDate: string | null; // ISO date string (YYYY-MM-DD)
  completedDatesCount: number;
  // History check-ins map e.g. "2026-05-31": true
  history: Record<string, boolean>;
}



export interface HabitStats {
  totalCount: number;
  completedTodayCount: number;
  longestStreakOverall: number;
  averageConsistency: number; // e.g. percentage of successful days
}
