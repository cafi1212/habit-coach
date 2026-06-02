/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { Flame, Trophy, AlertTriangle, Calendar, Check, Undo2, Trash2 } from "lucide-react";
import { Habit } from "../types";
import { getTodayStr, getPastSevenDays, isCompletedOnDate } from "../utils";

interface HabitCardProps {
  key?: any;
  habit: Habit;
  onToggleComplete: (id: string, dateStr: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

export function HabitCard({ habit, onToggleComplete, onDelete }: HabitCardProps): any {
  const today = getTodayStr();
  const isCompletedToday = isCompletedOnDate(habit, today);
  const pastSevenDays = getPastSevenDays();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Color intensities for different streaks
  const getFlameColorClass = (streak: number) => {
    if (streak === 0) return "text-gray-300";
    if (streak < 3) return "text-[#C9A071] fill-[#C9A071] drop-shadow-[0_0_6px_rgba(201,160,113,0.3)]";
    if (streak < 7) return "text-[#E07A5F] fill-[#E07A5F] drop-shadow-[0_0_8px_rgba(224,122,95,0.4)]";
    return "text-red-500 fill-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-pulse";
  };

  if (showConfirmDelete) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border-2 border-[#FDA281]/40 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[220px]"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#E07A5F]" />
        
        <div className="text-center my-auto space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#E07A5F]/10 flex items-center justify-center mx-auto text-[#E07A5F]">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#2D2A26] font-serif leading-tight">
              Delete Habit?
            </h3>
            <p className="text-[11px] text-[#706961] mt-1 font-sans leading-normal">
              "<strong>{habit.name}</strong>" will be permanently removed. Your streaks and history will be cleared.
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-4 pt-3 border-t border-[#F2EFE9]">
          <button
            type="button"
            onClick={() => setShowConfirmDelete(false)}
            className="flex-1 py-1.5 rounded-xl text-xs font-bold text-[#706961] bg-[#F2EFE9] hover:bg-[#E8E2D9] transition-colors border border-[#E8E2D9]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onDelete(habit.id);
              setShowConfirmDelete(false);
            }}
            className="flex-1 py-1.5 rounded-xl text-xs font-bold text-white bg-[#E07A5F] hover:bg-rose-600 transition-colors shadow-sm"
          >
            Yes, Delete
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25 }}
      className={`bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between ${
        isCompletedToday ? "border-[#C5D3B3] ring-1 ring-[#7D8F69]/10" : "border-[#E8E2D9]"
      }`}
    >
      {/* Decorative subtle header line for high visual craft */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${isCompletedToday ? "bg-[#7D8F69]" : "bg-[#C9A071]"}`} />

      <div>
        <div className="flex justify-between items-start gap-4 mb-3">
          {/* Habit Meta Data */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] uppercase tracking-wide px-2.5 py-0.5 font-mono font-bold rounded-full bg-[#FDF8F1] text-[#C9A071] border border-[#F2EFE9]">
                {habit.frequency}
              </span>
              <span className="text-[#A69F95] text-[10px] flex items-center gap-1 font-mono">
                <Calendar className="w-3 h-3" />
                Start: {habit.startDate}
              </span>
            </div>

            <h3 className="text-base font-serif font-bold text-[#2D2A26] tracking-tight leading-tight">
              {habit.name}
            </h3>
          </div>

          {/* Delete Habit Button */}
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="text-[#A69F95] hover:text-[#E07A5F] p-1.5 rounded-lg hover:bg-[#F2EFE9] transition-colors group"
            title="Delete Habit"
          >
            <Trash2 className="w-4 h-4 group-hover:scale-105 transition-transform" />
          </button>
        </div>

        {/* Stats Breakdown */}
        <div className="grid grid-cols-3 gap-2 my-4 py-3 px-3 bg-[#F7F3EE] rounded-xl border border-[#E8E2D9] font-mono text-center">
          {/* Streak counts */}
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center gap-1">
              <Flame className={`w-4 h-4 ${getFlameColorClass(habit.streakCount)}`} />
              <span className="text-sm font-bold text-[#2D2A26] font-sans">{habit.streakCount}</span>
            </div>
            <span className="text-[9px] uppercase font-bold text-[#A69F95] mt-1 tracking-tighter">Streak</span>
          </div>

          {/* Longest streak */}
          <div className="flex flex-col items-center border-x border-[#E8E2D9]">
            <div className="flex items-center justify-center gap-1 text-[#7D8F69]">
              <Trophy className="w-3.5 h-3.5 fill-[#7D8F69]/10" />
              <span className="text-sm font-bold text-[#2D2A26] font-sans">{habit.longestStreak}</span>
            </div>
            <span className="text-[9px] uppercase font-bold text-[#A69F95] mt-1 tracking-tighter">Longest</span>
          </div>

          {/* Missed days */}
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center gap-1 text-[#E07A5F]">
              {habit.missedDays > 0 ? (
                <AlertTriangle className="w-3.5 h-3.5 text-[#E07A5F] fill-[#E07A5F]/5" />
              ) : (
                <span className="text-xs text-emerald-600">●</span>
              )}
              <span className="text-sm font-bold text-[#2D2A26] font-sans">{habit.missedDays}</span>
            </div>
            <span className="text-[9px] uppercase font-bold text-[#A69F95] mt-1 tracking-tighter">Missed</span>
          </div>
        </div>

        {/* 7-Day History Bubbles */}
        <div className="mb-4">
          <p className="text-[9px] text-[#A69F95] uppercase tracking-wider font-mono font-bold mb-2">
            Weekly Log (Toggle to check-in)
          </p>
          <div className="grid grid-cols-7 gap-1">
            {pastSevenDays.map((day) => {
              const completed = isCompletedOnDate(habit, day.dateStr);
              const isTodayDay = day.dateStr === today;
              
              return (
                <div
                  key={day.dateStr}
                  className={`flex flex-col items-center rounded-lg py-1 border transition-all ${
                    isTodayDay
                      ? "bg-[#7D8F69]/5 border-[#7D8F69]/30 scale-102"
                      : "border-transparent bg-transparent"
                  }`}
                >
                  <span className="text-[9px] text-[#706961] font-bold mb-1 font-mono">
                    {day.weekday[0]}
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => onToggleComplete(habit.id, day.dateStr)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all relative ${
                      completed
                        ? "bg-[#7D8F69] text-white shadow-sm shadow-[#7D8F69]/10"
                        : "bg-[#F7F3EE] hover:bg-[#E8E2D9] text-[#706961] border border-[#E8E2D9]"
                    }`}
                    title={`${day.weekday} (${day.dateStr}): ${completed ? "Completed" : "Incomplete"} - Click to toggle`}
                  >
                    {completed ? (
                      <Check className="w-3 h-3 stroke-[3]" />
                    ) : (
                      <span className="text-[9px] select-none text-[#706961]/80 font-mono">{day.label}</span>
                    )}
                    
                    {isTodayDay && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#7D8F69] animate-ping" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Primary Complete Button */}
      <div className="mt-2 pt-3 border-t border-[#F2EFE9]">
        {isCompletedToday ? (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onToggleComplete(habit.id, today)}
            className="w-full flex items-center justify-center gap-1.5 bg-[#7D8F69]/10 text-[#7D8F69] hover:bg-[#7D8F69]/20 border border-[#7D8F69]/20 font-bold py-2 rounded-xl text-xs transition-all"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Checked-in Today</span>
            <Undo2 className="w-3 h-3 ml-1 opacity-70 hover:opacity-100 transition-opacity" />
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onToggleComplete(habit.id, today)}
            className="w-full flex items-center justify-center gap-1.5 bg-[#7D8F69] hover:bg-[#6c7d5c] text-white font-bold py-2 rounded-xl text-xs transition-all shadow-sm"
          >
            <Flame className="w-3.5 h-3.5 fill-white/10" />
            <span>Mark Done Today</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
