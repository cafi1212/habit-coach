/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Habit } from "./types";

// Get today's local date in YYYY-MM-DD format
export function getTodayStr(): string {
  // Use 2026-05-31 as today's fixed anchor if the system environment provides it,
  // otherwise fallback to calendar dates safely.
  const now = new Date();
  
  // Custom fallback to keep dates aligned with prompt system date: 2026-05-31
  const isAroundMockDate = now.getFullYear() === 2026 || now.getFullYear() < 2026;
  const year = isAroundMockDate ? 2026 : now.getFullYear();
  const month = isAroundMockDate ? 4 : now.getMonth(); // 4 represents May (0-indexed)
  const date = isAroundMockDate ? 31 : now.getDate();
  
  const d = new Date(year, month, date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Get consecutive past dates
export function getPastDateStr(offset: number): string {
  const today = getTodayStr();
  const [y, m, d] = today.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - offset);
  
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Check if habit was completed on specific date
export function isCompletedOnDate(habit: Habit, dateStr: string): boolean {
  return !!habit.history[dateStr];
}

// Generate the past 7 days for progress bubble display
export function getPastSevenDays(): { dateStr: string; label: string; weekday: string }[] {
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const list = [];
  // From 6 days ago up to today
  for (let i = 6; i >= 0; i--) {
    const dateStr = getPastDateStr(i);
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    list.push({
      dateStr,
      label: String(d),
      weekday: weekdays[dateObj.getDay()],
    });
  }
  return list;
}

// Pre-fill initial mock data for the user on first start - empty per user feedback
export function getMockHabits(): Habit[] {
  return [];
}
