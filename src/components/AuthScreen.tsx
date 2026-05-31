/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { 
  Flame, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Check, 
  Sparkles,
  ChevronRight
} from "lucide-react";

interface AuthScreenProps {
  onBypassOffline?: () => void;
}

export function AuthScreen({ onBypassOffline }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Feedback states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleGoogleSignIn = async () => {
    resetMessages();
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Save User to Firestore
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        name: user.displayName || "User"
      }, { merge: true });
      
      setSuccessMsg("Logged in successfully with Google! Loading your coach space...");
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setErrorMsg(err.message || "OAuth login cancelled or failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    
    // Simple front-end validations
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please fill in all requested credentials.");
      return;
    }
    
    if (isSignUp && !name.trim()) {
      setErrorMsg("Please enter your display name.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // Create user
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = credential.user;
        
        // Update user profile display name
        await updateProfile(user, {
          displayName: name.trim()
        });

        // Initialize user in Firestore
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, {
          name: name.trim()
        }, { merge: true });

        // Force reload page / state updates
        setSuccessMsg("Account registered successfully! Prepare for training...");
      } else {
        // Sign in user
        await signInWithEmailAndPassword(auth, email.trim(), password);
        setSuccessMsg("Authenticated successfully! Loading habits...");
      }
    } catch (err: any) {
      console.error("Email Auth error:", err);
      let clientMsg = err.message;
      if (err.code === "auth/email-already-in-use") {
        clientMsg = "This email is already registered. Try logging in instead.";
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        clientMsg = "Invalid email or password. Please verify your credentials.";
      } else if (err.code === "auth/invalid-email") {
        clientMsg = "The email representation is invalid.";
      }
      setErrorMsg(clientMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      id="custom-auth-portal" 
      className="w-full min-h-screen bg-[#FDFCF9] flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans"
    >
      <div className="w-full max-w-5xl bg-[#F7F3EE] rounded-3xl border border-[#E8E2D9] shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* Left column - Inspirational Coach Gideon Panel */}
        <div className="lg:col-span-5 bg-[#7D8F69] text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle pattern overlays */}
          <div className="absolute inset-0 bg-radial-at-t from-white/10 to-transparent pointer-events-none" />
          <div className="absolute -bottom-24 -left-20 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-mono tracking-wider uppercase font-bold text-white/90">
              <Sparkles className="w-3.5 h-3.5 text-yellow-200 fill-yellow-200" />
              <span>STRICT AI MENTORSHIP</span>
            </div>
            
            <div className="space-y-4">
              <div className="w-12 h-12 bg-white text-[#7D8F69] rounded-2xl flex items-center justify-center shadow-lg">
                <Flame className="w-6 h-6 fill-[#7D8F69]" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif italic font-extrabold tracking-tight leading-tight">
                Habit Coach
              </h2>
              <p className="text-white/80 text-sm leading-relaxed max-w-sm">
                "Discipline isn't a temporary sprint; it is an everyday commitment to the version of yourself you intend to build."
              </p>
            </div>
          </div>

          {/* Key Coach Features */}
          <div className="space-y-4.5 my-12 relative z-10">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white mt-0.5 flex-shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Daily Consistency Audits</p>
                <p className="text-[10px] text-white/70">Real-time stats check-ins optimized for daily streaks.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white mt-0.5 flex-shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">AI Coach Gideon</p>
                <p className="text-[10px] text-white/70">Strict feedback and personalized instructions from Gemini API.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white mt-0.5 flex-shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Cloud Synced Real-time DB</p>
                <p className="text-[10px] text-white/70">Secure, isolated database protection preventing data lost.</p>
              </div>
            </div>
          </div>

          {/* Footer of panel */}
          <div className="text-[10px] text-white/60 font-mono flex items-center justify-between border-t border-white/10 pt-4 relative z-10">
            <span>COACH GIDEON v3.5</span>
            <span>SECURE GATEWAY</span>
          </div>
        </div>

        {/* Right column - interactive authentic Authentication panel */}
        <div className="lg:col-span-7 p-8 sm:p-12 md:p-16 flex flex-col justify-between bg-[#FDFCF9]">
          
          {/* Header section */}
          <div className="flex items-center justify-between mb-8">
            <span className="text-xs font-mono font-bold uppercase text-[#A69F95] tracking-widest">
              {isSignUp ? "Registration Portal" : "Secure Authentication"}
            </span>
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                resetMessages();
              }}
              className="text-xs text-[#7D8F69] hover:text-[#4A443F] font-bold underline transition-colors"
            >
              {isSignUp ? "Sign in instead" : "Create standard account"}
            </button>
          </div>

          <div className="space-y-6 max-w-md w-full mx-auto">
            
            {/* Title */}
            <div>
              <h3 className="text-2xl font-serif italic font-extrabold text-[#2D2A26] tracking-tight">
                {isSignUp ? "Build Your Discipline Profile" : "Command Your Routine"}
              </h3>
              <p className="text-[#706961] text-xs font-sans mt-1">
                {isSignUp 
                  ? "Initialize your cloud-synced account to enable real-time mentor audits." 
                  : "Sign in to activate Coach Gideon and access your streaks."}
              </p>
            </div>

            {/* Error notifications */}
            {errorMsg && (
              <div className="bg-[#FDA281]/15 text-[#E07A5F] border border-[#FDA281]/50 p-4 rounded-xl flex gap-3 items-start text-xs font-mono">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="leading-normal">{errorMsg}</p>
              </div>
            )}

            {/* Success notifications */}
            {successMsg && (
              <div className="bg-[#7D8F69]/10 text-[#7D8F69] border border-[#7D8F69]/30 p-4 rounded-xl flex gap-3 items-start text-xs font-mono">
                <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="leading-normal">{successMsg}</p>
              </div>
            )}

            {/* Google OAuth - Master Highlight Choice */}
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full py-3.5 bg-white hover:bg-[#F2EFE9] disabled:bg-[#E8E2D9] border border-[#E8E2D9] text-[#2D2A26] rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-xs flex items-center justify-center gap-3 group relative overflow-hidden"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.61 14.99 1 12 1 7.35 1 3.37 3.68 1.44 7.6l3.86 3C6.22 8.04 8.87 5.04 12 5.04z" />
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.48-1.11 2.73-2.37 3.58l3.69 2.87c2.16-2 3.73-4.94 3.73-8.55z" />
                <path fill="#FBBC05" d="M5.3 14.4c-.24-.72-.38-1.49-.38-2.3s.14-1.58.38-2.3L1.44 6.8C.52 8.65 0 10.74 0 12.92s.52 4.27 1.44 6.12l3.86-3.02z" />
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.69-2.87c-1.02.68-2.33 1.09-4.27 1.09-3.13 0-5.78-3-6.7-5.56L1.44 15.77C3.37 19.69 7.35 23 12 23z" />
              </svg>
              <span>Continue with Google Account</span>
              <ChevronRight className="w-4 h-4 text-[#A69F95] group-hover:translate-x-1.5 transition-transform ml-auto absolute right-4" />
            </button>

            {/* Separator block */}
            <div className="flex items-center justify-between text-[10px] text-[#A69F95] font-mono tracking-wider uppercase">
              <div className="h-px bg-[#E8E2D9] flex-1" />
              <span className="px-4">Or use dynamic email standard</span>
              <div className="h-px bg-[#E8E2D9] flex-1" />
            </div>

            {/* Email & Password Registration Form */}
            <form onSubmit={handleEmailAuthSubmit} className="space-y-4">
              
              {isSignUp && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase text-[#706961] tracking-wider">
                    Full Profile Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A69F95]" />
                    <input
                      type="text"
                      disabled={loading}
                      placeholder="e.g. Alexis Martinez"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10.5 pr-4 py-3 bg-white border border-[#E8E2D9] rounded-xl text-sm focus:ring-2 focus:ring-[#7D8F69] focus:border-transparent outline-none transition-all placeholder:text-[#A69F95]"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase text-[#706961] tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A69F95]" />
                  <input
                    type="email"
                    disabled={loading}
                    placeholder="name@discipline.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10.5 pr-4 py-3 bg-white border border-[#E8E2D9] rounded-xl text-sm focus:ring-2 focus:ring-[#7D8F69] focus:border-transparent outline-none transition-all placeholder:text-[#A69F95]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase text-[#706961] tracking-wider">
                  Secret Credentials Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A69F95]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    disabled={loading}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10.5 pr-12 py-3 bg-white border border-[#E8E2D9] rounded-xl text-sm focus:ring-2 focus:ring-[#7D8F69] focus:border-transparent outline-none transition-all placeholder:text-[#A69F95]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A69F95] hover:text-[#4A443F] mt-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4.5 bg-[#2D2A26] hover:bg-[#4A443F] disabled:bg-[#4A443F]/60 text-white rounded-xl text-xs font-bold transition-all shadow-md group flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Checking discipline database...
                    </span>
                  ) : (
                    <>
                      <span>{isSignUp ? "Initialize Profile Account" : "Access Personal Dashboard"}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>

          {/* Practice Offline Bypass Feature */}
          <div className="text-center pt-8 border-t border-[#E8E2D9] mt-8">
            <p className="text-xs text-[#706961]">
              Want to try without saving online? {" "}
              <button
                type="button"
                onClick={onBypassOffline}
                className="text-[#7D8F69] font-bold hover:underline"
              >
                Access Offline Guest Sandbox Mode
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
