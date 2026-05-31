/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Flame, 
  Trophy, 
  Plus, 
  Sparkles, 
  MessageSquare, 
  Settings, 
  LayoutDashboard, 
  BarChart3, 
  User, 
  CheckCircle2, 
  X, 
  Menu,
  RotateCcw,
  AlertTriangle,
  Info,
  LogOut
} from "lucide-react";
import { Habit, HabitFrequency } from "./types";
import { getTodayStr, getPastDateStr, getMockHabits, isCompletedOnDate } from "./utils";
import { AddHabitForm } from "./components/AddHabitForm";
import { AuthScreen } from "./components/AuthScreen";
import { HabitCard } from "./components/HabitCard";

// Firebase and Firestore imports
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs, 
  writeBatch,
  query,
  orderBy 
} from "firebase/firestore";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from "firebase/auth";
import { db, auth, handleFirestoreError, OperationType } from "./firebase";

export default function App() {
  // Firebase Authentication State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isOfflineSandbox, setIsOfflineSandbox] = useState(false);

  // Sidebar auth helper configuration states
  const [sidebarAuthError, setSidebarAuthError] = useState<string | null>(null);
  const [showSidebarProvidersHelp, setShowSidebarProvidersHelp] = useState(false);
  const [showSidebarDomainsHelp, setShowSidebarDomainsHelp] = useState(false);

  // State variables synchronized with localStorage and Firestore
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem("habit_tracker_habits");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Clean up any old mock state data instantly per user request
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (h: any) =>
              h.id !== "habit-gym" &&
              h.id !== "habit-coding" &&
              h.id !== "habit-reading"
          );
        }
      } catch (e) {
        console.error("Failed to parse saved habits", e);
      }
    }
    return [];
  });

  const [userName, setUserName] = useState<string>(() => {
    const stored = localStorage.getItem("habit_tracker_username");
    if (!stored || stored === "Alex") {
      return "User";
    }
    return stored;
  });

  const [activeTab, setActiveTab] = useState<"dashboard" | "all-habits">("dashboard");
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newNameInput, setNewNameInput] = useState(userName);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Daily Check-in State Variables (Show interactive quick wizard at top of dashboard)
  const [selectedCheckInHabitId, setSelectedCheckInHabitId] = useState<string | null>(() => {
    return null;
  });
  const [checkInFeedback, setCheckInFeedback] = useState<{
    type: "success" | "skip" | null;
    message: string;
  }>({ type: null, message: "" });

  const today = getTodayStr();

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
      if (currentUser) {
        if (currentUser.displayName) {
          setUserName(currentUser.displayName);
          setNewNameInput(currentUser.displayName);
        }
        // Save initial user profile in Firestore
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          await setDoc(userDocRef, {
            name: currentUser.displayName || "User"
          }, { merge: true });
        } catch (error) {
          console.error("Failed to update user profile doc", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Firebase Real-time Firestore sync for habits when signed in
  useEffect(() => {
    if (!user) return;

    const habitsRef = collection(db, "users", user.uid, "habits");
    const unsubscribe = onSnapshot(habitsRef, (snapshot) => {
      const fetchedHabits: Habit[] = [];
      snapshot.forEach((doc) => {
        fetchedHabits.push(doc.data() as Habit);
      });
      // Filter out any old mock data just in case
      const filtered = fetchedHabits.filter(
        (h) => h.id !== "habit-gym" && h.id !== "habit-coding" && h.id !== "habit-reading"
      );
      setHabits(filtered);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/habits`);
    });

    return () => unsubscribe();
  }, [user]);



  // Automatically find a habit that needs check-in today to prompt the user
  useEffect(() => {
    const incompleteToday = habits.find(h => !isCompletedOnDate(h, today));
    if (incompleteToday && !selectedCheckInHabitId && !checkInFeedback.type) {
      setSelectedCheckInHabitId(incompleteToday.id);
    }
  }, [habits, today, selectedCheckInHabitId, checkInFeedback]);

  // Synchronize with Local Storage on modification
  useEffect(() => {
    localStorage.setItem("habit_tracker_habits", JSON.stringify(habits));
  }, [habits]);



  const saveUserName = async () => {
    if (newNameInput.trim()) {
      const trimmed = newNameInput.trim();
      setUserName(trimmed);
      localStorage.setItem("habit_tracker_username", trimmed);
      setIsEditingName(false);
      
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          await setDoc(userDocRef, { name: trimmed }, { merge: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
        }
      }
    }
  };

  // Google Login and initial sync
  const handleGoogleSignIn = async () => {
    setSidebarAuthError(null);
    setShowSidebarProvidersHelp(false);
    setShowSidebarDomainsHelp(false);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const loggedUser = result.user;
      
      // Update local storage name representation
      if (loggedUser.displayName) {
        setUserName(loggedUser.displayName);
        setNewNameInput(loggedUser.displayName);
        localStorage.setItem("habit_tracker_username", loggedUser.displayName);
      }

      // Sync local offline habits to Firebase on initial login
      const localHabits = [...habits];
      if (localHabits.length > 0) {
        const batch = writeBatch(db);
        for (const h of localHabits) {
          const habitDocRef = doc(db, "users", loggedUser.uid, "habits", h.id);
          batch.set(habitDocRef, h);
        }
        await batch.commit();
      }
    } catch (error: unknown) {
      console.error("Google login failed", error);
      let errMsg = (error as any).message || "Failed to synchronize with Google database.";
      if ((error as any).code === "auth/operation-not-allowed") {
        setShowSidebarProvidersHelp(true);
        errMsg = "Google sign-in is disabled in your Firebase Settings.";
      } else if ((error as any).code === "auth/unauthorized-domain") {
        setShowSidebarDomainsHelp(true);
        errMsg = "This sandbox domain has not been whitelisted in Firebase Authorized Domains.";
      } else if ((error as any).code === "auth/popup-blocked") {
        errMsg = "Popup was blocked by your browser. Open the preview in a new tab.";
      } else if ((error as any).code === "auth/popup-closed-by-user") {
        errMsg = "Sign-in window was closed before completion.";
      }
      setSidebarAuthError(errMsg);
    }
  };

  const handleGoogleSignOut = async () => {
    if (confirm("Disconnect Google Account from this device? Your local cache will remain intact.")) {
      try {
        await signOut(auth);
        setIsOfflineSandbox(false);
        setHabits([]);
      } catch (error) {
        console.error("Logout failed", error);
      }
    }
  };

  // Toggle habit completion for a specific target day
  const handleToggleComplete = async (habitId: string, dateStr: string) => {
    setCheckInFeedback({ type: null, message: "" });
    const targetHabit = habits.find(h => h.id === habitId);
    if (!targetHabit) return;

    const history = { ...targetHabit.history };
    const currentlyDone = !!history[dateStr];

    if (currentlyDone) {
      // Uncheck completeness
      history[dateStr] = false;
    } else {
      // Check completeness
      history[dateStr] = true;
    }

    // Recalculate streak values from complete history sequence starting from target day going backward
    let streak = 0;
    let tempDate = today;
    let dayCounter = 0;

    // Count backwards up to 365 days to calculate streak accurately
    while (dayCounter < 365) {
      const checked = !!history[tempDate];
      if (checked) {
        streak++;
      } else {
        if (tempDate === today) {
          // If not completed today, the streak could still live if completed yesterday
          const yesterdayStr = getPastDateStr(1);
          if (!!history[yesterdayStr]) {
            // Streak lives on yesterday's count
          } else {
            break; // Broken streak
          }
        } else {
          break; // Broken streak
        }
      }

      // Step back 1 day
      dayCounter++;
      tempDate = getPastDateStr(dayCounter);
    }

    const newStreakCount = streak;
    const newLongestStreak = Math.max(targetHabit.longestStreak, newStreakCount);

    // Calculate missed days (count false/missing dates within its start window)
    let missedCount = 0;
    const startDateObj = new Date(targetHabit.startDate);
    const todayObj = new Date(today);
    let diffDays = Math.ceil((todayObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) diffDays = 0;

    for (let i = 0; i <= diffDays; i++) {
      const checkDate = getPastDateStr(i);
      // If past date was incomplete (not true) and isn't today (since today isn't over yet)
      if (!history[checkDate] && checkDate !== today) {
        missedCount++;
      }
    }

    const updatedHabit: Habit = {
      ...targetHabit,
      history,
      streakCount: newStreakCount,
      longestStreak: newLongestStreak,
      missedDays: missedCount,
      lastCompletedDate: history[today] ? today : targetHabit.lastCompletedDate,
      completedDatesCount: Object.values(history).filter(Boolean).length
    };

    if (user) {
      try {
        const habitDocRef = doc(db, "users", user.uid, "habits", habitId);
        await setDoc(habitDocRef, updatedHabit);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/habits/${habitId}`);
      }
    } else {
      setHabits(prevHabits => prevHabits.map(habit => habit.id === habitId ? updatedHabit : habit));
    }
  };

  // Add a brand new habit to tracker
  const handleAddHabit = async (name: string, frequency: HabitFrequency, startDate: string) => {
    const newHabit: Habit = {
      id: "habit-" + Date.now(),
      name,
      frequency,
      startDate: startDate || today,
      streakCount: 0,
      longestStreak: 0,
      missedDays: 0,
      lastCompletedDate: null,
      completedDatesCount: 0,
      history: {}
    };

    if (user) {
      try {
        const habitDocRef = doc(db, "users", user.uid, "habits", newHabit.id);
        await setDoc(habitDocRef, newHabit);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/habits/${newHabit.id}`);
      }
    } else {
      setHabits(prev => [newHabit, ...prev]);
    }
    
    setIsAddingHabit(false);
  };

  // Delete habit handler
  const handleDeleteHabit = async (id: string) => {
    if (user) {
      try {
        const habitDocRef = doc(db, "users", user.uid, "habits", id);
        await deleteDoc(habitDocRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/habits/${id}`);
      }
    } else {
      setHabits(prev => prev.filter(h => h.id !== id));
    }
    
    if (selectedCheckInHabitId === id) {
      setSelectedCheckInHabitId(null);
    }
  };

  // Direct Interactive Daily check-in buttons logic
  const handleDailyCheckInSubmit = async (habitId: string, completed: boolean) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    if (completed) {
      // Toggle done
      if (!isCompletedOnDate(habit, today)) {
        await handleToggleComplete(habitId, today);
      }
      setCheckInFeedback({
        type: "success",
        message: `🔥 Stellar effort, ${userName}! We've updated your streak count for "${habit.name}". Let's command tomorrow with the same focus.`
      });
    } else {
      // The user chose: No, I didn't complete it
      const comebackTips = [
        "Commit to just showing up for a micro-session (e.g., 5 minutes) tomorrow. Reduce the friction to rebuild momentum.",
        "Never miss twice! Skipping two days in a row is the start of a skipping habit. Focus heavily on winning tomorrow.",
        "A slip is just a single data point, not a permanent trend. Re-anchor your motivation and focus purely on checking off tomorrow's goal.",
        "Forgive the slip, focus on the response. The fastest way to recovery is your immediate next check-in.",
        "Define a specific micro-commitment for tomorrow (e.g., read 1 page, do 5 pushups). Success is won one tiny step at a time.",
        "Anchor tomorrow's habit with a specific stack (e.g., 'Directly after my morning coffee, I will check in').",
        "Consistency is a practice of showing up, not scoring perfectly. Stand up, reset your mindset, and let's excel tomorrow!"
      ];
      const randomTip = comebackTips[Math.floor(Math.random() * comebackTips.length)];

      setCheckInFeedback({
        type: "skip",
        message: `💡 Habit Builder's Guide: "${randomTip}"`
      });
    }
  };

  const handleNextCheckIn = () => {
    setCheckInFeedback({ type: null, message: "" });
    // Find next pending
    const incompleteToday = habits.find(h => h.id !== selectedCheckInHabitId && !isCompletedOnDate(h, today));
    if (incompleteToday) {
      setSelectedCheckInHabitId(incompleteToday.id);
    } else {
      setSelectedCheckInHabitId(null);
    }
  };

  // Compute stats metrics dynamically
  const completedTodayCount = habits.filter(h => isCompletedOnDate(h, today)).length;
  const totalHabitsCount = habits.length;
  const globalStreakDays = habits.length > 0 ? Math.max(...habits.map(h => h.streakCount)) : 0;
  const progressRatio = totalHabitsCount > 0 ? (completedTodayCount / totalHabitsCount) : 0;

  // Find habit selected for check-in
  const activeCheckInHabit = habits.find(h => h.id === selectedCheckInHabitId);

  if (loadingAuth) {
    return (
      <div id="auth-loading-screen" className="w-full min-h-screen bg-[#FDFCF9] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#7D8F69] flex items-center justify-center animate-pulse shadow-md">
          <Flame className="w-6 h-6 fill-white text-white" />
        </div>
        <p className="text-xs font-mono tracking-widest text-[#A69F95] uppercase font-bold animate-pulse">
          Authenticating space...
        </p>
      </div>
    );
  }

  if (!user && !isOfflineSandbox) {
    return <AuthScreen onBypassOffline={() => setIsOfflineSandbox(true)} />;
  }

  return (
    <div id="habit-ai-root" className="w-full min-h-screen bg-[#FDFCF9] text-[#4A443F] font-sans flex flex-col md:flex-row overflow-hidden">
      
      {/* Mobile Header bar */}
      <div className="md:hidden w-full bg-[#F7F3EE] border-b border-[#E8E2D9] p-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#7D8F69] rounded-lg flex items-center justify-center text-white shadow-xs">
            <Flame className="w-4 h-4 fill-white" />
          </div>
          <span className="text-lg font-serif italic text-[#2D2A26] font-bold tracking-tight">Habit Coach</span>
        </div>
        
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-[#4A443F] hover:bg-[#E8E2D9] rounded-xl transition-all"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Side Navigation panel (Aside) matching Natural Tones styling */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-[#F7F3EE] border-r border-[#E8E2D9] flex flex-col p-8 z-50 transition-transform duration-300 md:static md:translate-x-0
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Sidebar Close button for mobile inside the overlay */}
        <div className="flex md:hidden justify-end mb-4">
          <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg bg-[#E8E2D9]/40 hover:bg-[#E8E2D9]">
            <X className="w-5 h-5 text-[#2D2A26]" />
          </button>
        </div>

        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-[#7D8F69] rounded-xl flex items-center justify-center text-white shadow-md">
            <Flame className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#2D2A26] font-serif">Habit Coach</h1>
            <p className="text-[10px] text-[#A69F95] font-mono tracking-widest uppercase font-bold">Habit Tracker</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-2.5 flex-1">
          <button
            onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium text-sm text-left ${
              activeTab === "dashboard"
                ? "bg-[#7D8F69] text-white shadow-md"
                : "text-[#706961] hover:bg-[#E8E2D9]"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 opacity-90" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => { setActiveTab("all-habits"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium text-sm text-left ${
              activeTab === "all-habits"
                ? "bg-[#7D8F69] text-white shadow-md"
                : "text-[#706961] hover:bg-[#E8E2D9]"
            }`}
          >
            <BarChart3 className="w-4 h-4 opacity-90" />
            <span>Habits Status</span>
          </button>
        </nav>

        {/* Global check-in statistics tracker */}
        <div className="bg-white/60 border border-[#E8E2D9] rounded-2xl p-4.5 mt-8 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider text-[#A69F95] font-extrabold font-mono">
              Daily Progress Gauge
            </p>
            <span className="text-[11px] font-mono font-bold text-[#706961]">
              {completedTodayCount}/{totalHabitsCount}
            </span>
          </div>
          
          <div className="w-full bg-[#E8E2D9]/80 h-2.5 rounded-full overflow-hidden">
            <div 
              style={{ width: `${progressRatio * 100}%` }}
              className="bg-[#A4B494] h-full rounded-full shadow-inner transition-all duration-500"
            />
          </div>
          
          <p className="text-[11px] text-[#706961] leading-relaxed">
            {progressRatio === 1 
              ? "✨ Iron consistency achieved today! Excellent discipline."
              : `${totalHabitsCount - completedTodayCount} habits remaining to check-off.`}
          </p>
        </div>

        {/* Quick User Identity Card / Google Auth Support */}
        <div className="mt-6 pt-4 border-t border-[#E8E2D9] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#E8E2D9] flex items-center justify-center text-[#706961] overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ""} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newNameInput}
                    onChange={(e) => setNewNameInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveUserName(); }}
                    className="w-24 px-1.5 py-0.5 bg-white border border-[#E8E2D9] rounded text-xs focus:ring-1 focus:ring-[#7D8F69] outline-none text-[#2D2A26]"
                    autoFocus
                  />
                  <button onClick={saveUserName} className="text-xs text-[#7D8F69] font-bold">Save</button>
                </div>
              ) : (
                <div className="cursor-pointer group" onClick={() => setIsEditingName(true)} title="Click to edit name">
                  <p className="text-xs font-serif font-black text-[#2D2A26] leading-tight group-hover:underline">
                    {userName} ✏️
                  </p>
                  <p className="text-[9px] text-[#706961] font-mono">
                    {user ? "Linked with Google" : "Offline Guest Sandbox"}
                  </p>
                </div>
              )}
            </div>
            {user ? (
              <button 
                onClick={handleGoogleSignOut} 
                className="p-1 px-1.5 hover:bg-[#E8E2D9] rounded-lg text-xs font-mono text-[#E07A5F] transition-all flex items-center gap-1"
                title="Disconnect Account"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button 
                onClick={() => {
                  if (confirm("Disconnect guest session and return to authentication portal?")) {
                    setIsOfflineSandbox(false);
                  }
                }}
                className="p-1 px-1.5 hover:bg-[#E8E2D9] rounded-lg text-xs font-mono text-[#E07A5F] transition-all flex items-center gap-1"
                title="Exit Guest Session"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {!user && (
            <div className="mt-1 space-y-2">
              <button
                onClick={handleGoogleSignIn}
                className="w-full py-2 bg-white hover:bg-[#E8E2D9] border border-[#E8E2D9] text-[#2D2A26] hover:scale-[1.01] rounded-xl text-[10px] font-bold transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.61 14.99 1 12 1 7.35 1 3.37 3.68 1.44 7.6l3.86 3C6.22 8.04 8.87 5.04 12 5.04z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.48-1.11 2.73-2.37 3.58l3.69 2.87c2.16-2 3.73-4.94 3.73-8.55z" />
                  <path fill="#FBBC05" d="M5.3 14.4c-.24-.72-.38-1.49-.38-2.3s.14-1.58.38-2.3L1.44 6.8C.52 8.65 0 10.74 0 12.92s.52 4.27 1.44 6.12l3.86-3.02z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.69-2.87c-1.02.68-2.33 1.09-4.27 1.09-3.13 0-5.78-3-6.7-5.56L1.44 15.77C3.37 19.69 7.35 23 12 23z" />
                </svg>
                <span>Google Database Sync</span>
              </button>

              {sidebarAuthError && (
                <div className="bg-[#FDA281]/10 text-[#E07A5F] border border-[#FDA281]/30 p-2.5 rounded-lg text-[9.5px] font-sans leading-normal">
                  <div className="font-bold flex items-center gap-1 text-[10px] text-[#2D2A26] mb-1">
                    <span>⚠️ Firebase Sync Alert</span>
                  </div>
                  <p>{sidebarAuthError}</p>

                  {showSidebarProvidersHelp && (
                    <div className="mt-2 pt-2 border-t border-[#E8E2D9] space-y-1">
                      <p className="text-[9px] text-[#706961]">How to turn on Google Provider:</p>
                      <a 
                        href="https://console.firebase.google.com/project/gen-lang-client-0577777315/authentication/providers" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#7D8F69] font-bold underline block"
                      >
                        1. Open Auth Providers Settings ↗
                      </a>
                      <p className="text-[9px] text-stone-500">{"2. Click 'Add Provider' -> 'Google' -> and click Enable."}</p>
                    </div>
                  )}

                  {showSidebarDomainsHelp && (
                    <div className="mt-2 pt-2 border-t border-[#E8E2D9] space-y-1">
                      <p className="text-[9px] text-[#706961]">Authed domain required:</p>
                      <a 
                        href="https://console.firebase.google.com/project/gen-lang-client-0577777315/authentication/settings" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#7D8F69] font-bold underline block"
                      >
                        1. Open Auth Settings Panel ↗
                      </a>
                      <p className="text-[9px] text-stone-500">2. Add this domain to Authorized Domains:</p>
                      <code className="bg-[#F7F3EE] border px-1 rounded block text-stone-600 truncate font-mono text-[8px] select-all">
                        {window.location.hostname}
                      </code>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Container screen area */}
      <main className="flex-1 flex flex-col p-6 md:p-10 overflow-y-auto max-h-screen">
        
        {/* Header toolbar */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 pb-6 border-b border-[#E8E2D9]">
          <div className="space-y-1.5">
            <h2 className="text-3xl font-serif italic text-[#2D2A26] font-extrabold tracking-tight">
              Good morning, {userName}
            </h2>
            <p className="text-[#706961] text-sm font-sans font-medium">
              Your consistency is the main currency of your long-term success.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Global Streak Widget */}
            <div className="bg-[#F2EFE9] px-4.5 py-2.5 rounded-2xl flex flex-col items-center border border-[#E8E2D9]">
              <span className="text-[9px] font-mono font-bold uppercase text-[#A69F95] tracking-widest">
                Highest Active Streak
              </span>
              <span className="text-xl font-serif italic font-extrabold text-[#7D8F69]">
                {globalStreakDays} Days
              </span>
            </div>

            {/* "+ Add Habit" toggle */}
            <button
              onClick={() => setIsAddingHabit(true)}
              className="bg-[#2D2A26] hover:bg-[#4A443F] text-white px-5 py-3 rounded-2xl shadow-md hover:shadow-lg transition-all font-semibold text-xs flex items-center gap-1.5"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>Register New Habit</span>
            </button>
          </div>
        </header>



        {/* Dynamic Habit Creation Form modal/panel */}
        {isAddingHabit && (
          <AddHabitForm
            onAdd={handleAddHabit}
            onCancel={() => setIsAddingHabit(false)}
          />
        )}

        {/* ACTIVE TAB: DASHBOARD DISPLAY */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            
            {/* Quick Add Habit Card (Ultra-visible, answers the user's need directly) */}
            <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 shadow-xs">
              <h4 className="text-xs font-mono uppercase font-bold text-[#A69F95] mb-3 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C9A071] animate-pulse" />
                Quick Habit Registration
              </h4>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const input = form.elements.namedItem("quickHabitName") as HTMLInputElement;
                const freq = form.elements.namedItem("quickHabitFreq") as HTMLSelectElement;
                if (input && input.value.trim()) {
                  await handleAddHabit(input.value.trim(), freq.value as any, today);
                  input.value = "";
                }
              }} className="flex flex-col sm:flex-row gap-3">
                <input
                  name="quickHabitName"
                  type="text"
                  placeholder="Type your new habit here... (e.g. Read 30 pages, Drink water, Gym session, Run 5k)"
                  className="flex-1 px-4 py-2.5 bg-[#FDFCF9] border border-[#E8E2D9] rounded-xl text-sm focus:outline-none focus:border-[#7D8F69] text-[#2D2A26] placeholder-[#A69F95]"
                  required
                />
                <div className="flex gap-2">
                  <select
                    name="quickHabitFreq"
                    className="px-3 py-2.5 bg-[#FDFCF9] border border-[#E8E2D9] rounded-xl text-xs focus:outline-none focus:border-[#7D8F69] text-[#2D2A26] font-medium cursor-pointer"
                  >
                    <option value="daily">Daily Habit</option>
                    <option value="3x per week">3x per week</option>
                    <option value="5x per week">5x per week</option>
                    <option value="weekends">Weekends only</option>
                  </select>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#7D8F69] hover:bg-[#6c7d5c] text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center gap-1 flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Habit</span>
                  </button>
                </div>
              </form>
            </div>
            
            {/* 4. DAILY CHECK-IN SCREEN COMPONENT (MVP CORE DEMAND) */}
            {activeCheckInHabit && (
              <div className="bg-white border-2 border-[#A4B494] rounded-3xl p-6 shadow-sm relative overflow-hidden transition-all">
                {/* Visual decoration line */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#7D8F69]" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1 bg-[#FDFCF9]/30 rounded-xl max-w-xl">
                    <span className="bg-[#7D8F69]/10 text-[#7D8F69] text-[9px] px-2.5 py-0.5 rounded-full font-mono uppercase font-extrabold tracking-widest">
                      Daily Check-in Strategy
                    </span>
                    <h3 className="text-xl font-bold font-serif text-[#2D2A26]">
                      Did you complete your habit today?
                    </h3>
                    <p className="text-xs text-[#706961] font-sans">
                      Target Habit: <strong className="text-[#2D2A26] font-bold">"{activeCheckInHabit.name}"</strong> ({activeCheckInHabit.frequency})
                    </p>
                  </div>

                  {/* Feedback or Actions toggle */}
                  {checkInFeedback.type ? (
                    <div className="flex-1 flex flex-col sm:flex-row items-center gap-4 bg-[#F7F3EE] p-3 rounded-2xl border border-[#E8E2D9]">
                      <p className="text-sm text-[#4A443F] flex-1 leading-relaxed italic font-sans font-medium">
                        {checkInFeedback.message}
                      </p>
                      
                      <button
                        onClick={handleNextCheckIn}
                        className="px-4 py-2 bg-[#7D8F69] text-white hover:bg-[#6c7d5c] rounded-xl text-xs font-bold font-mono text-center flex-shrink-0 transition-colors"
                      >
                        Check Next Habit
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3.5 flex-shrink-0">
                      <button
                        onClick={() => handleDailyCheckInSubmit(activeCheckInHabit.id, false)}
                        className="px-6 py-3.5 bg-[#F2EFE9] text-[#706961] hover:bg-[#E8E2D9] font-bold rounded-2xl text-xs font-mono transition-all border border-[#E8E2D9]"
                      >
                        No, I Missed It
                      </button>
                      <button
                        onClick={() => handleDailyCheckInSubmit(activeCheckInHabit.id, true)}
                        className="px-6 py-3.5 bg-[#7D8F69] text-white hover:bg-[#2C5F2D] hover:scale-101 font-bold rounded-2xl text-xs font-mono transition-all shadow-md shadow-[#7D8F69]/15"
                      >
                        Yes, Completely Done!
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick tips explanation if all habits checked-in */}
            {!activeCheckInHabit && habits.length > 0 && (
              <div className="bg-[#F7F3EE] border border-[#E8E2D9] rounded-2xl p-4.5 flex gap-3 text-xs text-[#706961]">
                <CheckCircle2 className="w-5 h-5 text-[#7D8F69] flex-shrink-0" />
                <p className="font-sans leading-relaxed">
                  <strong>You are all caught up on check-ins today!</strong> Check back tomorrow or review your habit trends to plan adjustments and keep your streak count solid.
                </p>
              </div>
            )}

            {/* HABIT LIST HEADER */}
            <div>
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-serif italic font-extrabold text-[#2D2A26]">
                  Active Streaks Dashboard
                </h3>
                <span className="text-xs text-[#706961] font-mono">
                  {habits.length} habits active
                </span>
              </div>

              {habits.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-[#E8E2D9] rounded-3xl p-12 text-center max-w-lg mx-auto">
                  <p className="text-base font-serif italic text-[#706961] mb-4">
                    "The journey of a thousand miles begins with a single commit."
                  </p>
                  <p className="text-xs text-[#A69F95] mb-6 font-sans">
                    Define your first gym, coding, study, or reading target to kick-start your habit stats.
                  </p>
                  <button
                    onClick={() => setIsAddingHabit(true)}
                    className="bg-[#7D8F69] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    Set Up Your First Habit Goal
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {habits.map((habit) => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDeleteHabit}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ACTIVE TAB: DETAILED METRICS VIEW OR HABIT MANAGEMENT */}
        {activeTab === "all-habits" && (
          <div className="space-y-6">
            <div className="bg-[#F7F3EE] border border-[#E8E2D9] rounded-3xl p-6">
              <h3 className="text-xl font-serif italic font-extrabold text-[#2D2A26] mb-2">
                Global Streaks & Check-ink Log
              </h3>
              <p className="text-xs text-[#706961] font-sans mb-4">
                Detailed compliance overview of your tracked objectives since initial start date.
              </p>

              {/* Dynamic stats overview display */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4.5 rounded-2xl border border-[#E8E2D9] flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-[#A69F95] uppercase font-bold tracking-wider">Total Commitments</span>
                  <span className="text-3xl font-serif italic text-[#7D8F69] font-extrabold mt-2">{habits.length}</span>
                </div>
                <div className="bg-white p-4.5 rounded-2xl border border-[#E8E2D9] flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-[#A69F95] uppercase font-bold tracking-wider">Completed Today</span>
                  <span className="text-3xl font-serif italic text-[#7D8F69] font-extrabold mt-2">{completedTodayCount}</span>
                </div>
                <div className="bg-white p-4.5 rounded-2xl border border-[#E8E2D9] flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-[#A69F95] uppercase font-bold tracking-wider">Average Consistency Ratio</span>
                  <span className="text-3xl font-serif italic text-amber-600 font-extrabold mt-2">
                    {habits.length > 0 
                      ? `${Math.round((habits.reduce((acc, current) => acc + current.completedDatesCount, 0) / (habits.length * 7)) * 100)}%`
                      : "0%"
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* List all habit compliance charts */}
            <div className="space-y-4">
              {habits.map((habit) => (
                <div key={habit.id} className="bg-white border border-[#E8E2D9] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-[#2D2A26] font-serif">{habit.name}</h4>
                      <span className="text-[9px] bg-[#FDF8F1] text-[#C9A071] border border-[#F2EFE9] rounded px-2 font-mono uppercase tracking-wider">{habit.frequency}</span>
                    </div>
                    <p className="text-xs text-[#706961]">Started: {habit.startDate} • Total checked days: {habit.completedDatesCount}</p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-[#A69F95] font-bold">Active Streak</p>
                      <p className="text-lg font-bold text-[#7D8F69] font-serif italic">{habit.streakCount} Days</p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-[#A69F95] font-bold">Longest Streak</p>
                      <p className="text-lg font-bold text-[#2D2A26] font-serif italic">{habit.longestStreak} Days</p>
                    </div>

                    {/* Simple toggle complete button inside status list */}
                    <button
                      onClick={() => handleToggleComplete(habit.id, today)}
                      className={`px-4.5 py-2 rounded-xl text-xs font-bold font-mono transition-all ${
                        isCompletedOnDate(habit, today)
                          ? "bg-[#7D8F69] text-white"
                          : "bg-[#F7F3EE] hover:bg-[#E8E2D9] text-[#2D2A26] border border-[#E8E2D9]"
                      }`}
                    >
                      {isCompletedOnDate(habit, today) ? "✓ Done" : "Mark Done"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
