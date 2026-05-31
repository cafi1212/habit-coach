/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { Plus, X, Sparkles, Calendar, BookOpen, Dumbbell, Code } from "lucide-react";
import { HabitFrequency } from "../types";
import { getTodayStr } from "../utils";

interface AddHabitFormProps {
  onAdd: (name: string, frequency: HabitFrequency, startDate: string) => void;
  onCancel: () => void;
}

export function AddHabitForm({ onAdd, onCancel }: AddHabitFormProps) {
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<HabitFrequency>("daily");
  const [startDate, setStartDate] = useState(getTodayStr());
  const [errorWord, setErrorWord] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorWord("Please enter a habit name.");
      return;
    }
    onAdd(name.trim(), frequency, startDate);
  };

  const handleQuickTemplate = (templateName: string) => {
    setName(templateName);
    setErrorWord("");
  };

  const templates = [
    { label: "Gym Workout", icon: Dumbbell, color: "text-amber-500 bg-amber-50" },
    { label: "Coding Practice", icon: Code, color: "text-blue-500 bg-blue-50" },
    { label: "Read Books", icon: BookOpen, color: "text-emerald-500 bg-emerald-50" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-[#F7F3EE] border border-[#E8E2D9] rounded-2xl p-5 mb-6 overflow-hidden transition-all"
    >
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E8E2D9]">
        <h3 className="text-sm uppercase tracking-wide font-mono font-bold text-[#2D2A26] flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#C9A071] animate-pulse" />
          Define Your Core Habit Goal
        </h3>
        <button
          onClick={onCancel}
          type="button"
          className="text-[#A69F95] hover:text-[#2D2A26] p-1 rounded-lg hover:bg-[#E8E2D9] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick Suggestions template chips */}
        <div>
          <label className="block text-[10px] font-bold text-[#A69F95] uppercase tracking-widest font-mono mb-2">
            Quick Templates
          </label>
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => handleQuickTemplate(t.label)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white hover:bg-[#F2EFE9] border border-[#E8E2D9] hover:border-[#C9A071] rounded-xl font-medium text-[#4A443F] transition-all shadow-xs"
              >
                <t.icon className={`w-3.5 h-3.5 ${t.color.split(" ")[0]}`} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Name input */}
        <div>
          <label htmlFor="habitName" className="block text-xs font-bold text-[#4A443F] mb-1.5">
            What habit do you want to master?
          </label>
          <input
            id="habitName"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrorWord("");
            }}
            placeholder="e.g. 5K Run, Code 1 Hour, Learn React..."
            className="w-full px-4 py-2.5 bg-white border border-[#E8E2D9] rounded-xl text-sm focus:outline-none focus:border-[#7D8F69] focus:ring-1 focus:ring-[#7D8F69]/10 transition-all text-[#2D2A26]"
          />
          {errorWord && <p className="text-xs text-[#E07A5F] mt-1 font-mono font-medium">{errorWord}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Frequency Picker */}
          <div>
            <label htmlFor="habitFrequency" className="block text-xs font-bold text-[#4A443F] mb-1.5">
              Frequency Pattern
            </label>
            <select
              id="habitFrequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as HabitFrequency)}
              className="w-full px-4 py-2 bg-white border border-[#E8E2D9] rounded-xl text-sm focus:outline-none focus:border-[#7D8F69] focus:ring-1 focus:ring-[#7D8F69]/10 transition-all cursor-pointer font-sans text-[#2D2A26]"
            >
              <option value="daily">Daily Habit</option>
              <option value="3x per week">3x per week</option>
              <option value="5x per week">5x per week</option>
              <option value="weekends">Weekends only</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="habitStartDate" className="block text-xs font-bold text-[#4A443F] mb-1.5">
              Start Date
            </label>
            <div className="relative">
              <input
                id="habitStartDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-[#E8E2D9] rounded-xl text-sm focus:outline-none focus:border-[#7D8F69] focus:ring-1 focus:ring-[#7D8F69]/10 transition-all text-[#2D2A26]"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2.5 justify-end pt-3 border-t border-[#E8E2D9]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-[#E8E2D9]/60 hover:bg-[#E8E2D9] text-[#4A443F] font-semibold rounded-xl text-xs transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="px-5 py-2 bg-[#7D8F69] hover:bg-[#6c7d5c] text-white font-semibold rounded-xl text-xs transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Habit Strategy</span>
          </button>
        </div>
      </form>
    </motion.div>
  );
}
