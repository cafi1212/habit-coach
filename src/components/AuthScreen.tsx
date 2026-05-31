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

  // Guided installation states
  const [showDomainHelp, setShowDomainHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [highlightEmailForm, setHighlightEmailForm] = useState(false);
  const [showOperationNotAllowedHelp, setShowOperationNotAllowedHelp] = useState(false);
  const [providerType, setProviderType] = useState<"google" | "email" | null>(null);

  const handleCopyHostname = () => {
    navigator.clipboard.writeText(window.location.hostname);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowDomainHelp(false);
    setShowOperationNotAllowedHelp(false);
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
      let clientMsg = err.message || "OAuth login cancelled or failed. Please try again.";
      if (err.code === "auth/operation-not-allowed") {
        setProviderType("google");
        setShowOperationNotAllowedHelp(true);
        clientMsg = "Google Sign-In is disabled for this project. Please go to your Firebase Console under 'Authentication' -> 'Sign-in method', click 'Add new provider', and enable 'Google'.";
      } else if (err.code === "auth/unauthorized-domain") {
        setShowDomainHelp(true);
        clientMsg = `Firebase Security Block: This sandbox domain (${window.location.hostname}) has not been authorized in your Firebase Project configuration. Google and Firebase block OAuth popups until this domain is safe-listed.`;
      } else if (err.code === "auth/popup-blocked") {
        clientMsg = "The popup was blocked by your browser constraint. Click 'Open in New Tab' at the top-right of the preview editor, or use the 'Offline Guest Sandbox' mode below.";
      } else if (err.code === "auth/popup-closed-by-user") {
        clientMsg = "Login window was closed. If you are using the embedded preview, browser security blocks popups. First click 'Open in New Tab' at the top-right of your preview panel, then sign in there.";
      }
      setErrorMsg(clientMsg);
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
      } else if (err.code === "auth/operation-not-allowed") {
        setProviderType("email");
        setShowOperationNotAllowedHelp(true);
        clientMsg = "Email/Password sign-up is disabled on your Firebase project. Please enable 'Email/Password' under 'Authentication' -> 'Sign-in method' in your Firebase Console.";
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

            {/* Dynamic Domain Security Setup Guide */}
            {showDomainHelp && (
              <div className="bg-[#F7F3EE] border-2 border-[#E07A5F] p-4.5 rounded-2xl space-y-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#E07A5F] animate-pulse" />
                  <h4 className="text-sm font-serif font-black text-[#2D2A26]">Firebase Domain Authorization Guide</h4>
                </div>
                <p className="text-xs text-[#706961] leading-relaxed font-sans">
                  Firebase Authentication requires you to authorize this sandbox domain before Google Login can process safely. Follow these quick steps to whitelist the domain:
                </p>
                
                <ol className="text-xs text-[#706961] space-y-2.5 list-decimal list-inside font-sans bg-white p-3 pr-2 rounded-xl border border-[#E8E2D9]">
                  <li className="leading-relaxed">
                    Open your {" "}
                    <a  
                      href="https://console.firebase.google.com/project/gen-lang-client-0577777315/authentication/settings" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#7D8F69] font-bold underline hover:text-[#6c7d5c] inline-flex items-center gap-0.5 font-mono"
                    >
                      Firebase Settings Panel ↗
                    </a>
                  </li>
                  <li className="leading-relaxed">
                    Scroll down or navigate to the <strong className="text-[#2D2A26]">"Authorized domains"</strong> card.
                  </li>
                  <li className="leading-relaxed">
                    Click the <strong className="text-[#2D2A26]">"Add domain"</strong> button.
                  </li>
                  <li className="leading-relaxed">
                    Paste this exact domain string:
                    <div className="mt-1.5 flex items-center gap-2 px-1">
                      <code className="bg-[#F7F3EE] border border-[#E8E2D9] px-2 py-1.5 rounded text-[11px] text-[#E07A5F] select-all break-all block flex-1 font-mono font-bold">
                        {window.location.hostname}
                      </code>
                      <button 
                        type="button"
                        onClick={handleCopyHostname}
                        className="px-3 py-1.5 bg-[#7D8F69] text-white rounded-lg text-xs font-bold hover:bg-[#6c7d5c] transition-colors flex-shrink-0"
                      >
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </li>
                </ol>
                <div className="bg-[#7D8F69]/5 p-2.5 px-3 rounded-lg border border-[#7D8F69]/20 text-[10.5px] text-[#4A443F] font-sans">
                  💡 <strong className="text-[#7D8F69]">Don't want to use Google?</strong> You can also sign up using a simple email and password or use the <strong>Offline Guest Sandbox</strong> below.
                </div>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setHighlightEmailForm(true);
                      setErrorMsg(null);
                      setSuccessMsg("Great choice! Let's register standard secure credentials. Fill in the highlighted form below.");
                      setTimeout(() => {
                        const formElem = document.getElementById("email-auth-form");
                        if (formElem) {
                          formElem.scrollIntoView({ behavior: "smooth", block: "center" });
                        }
                      }, 100);
                    }}
                    className="w-full py-3 bg-[#7D8F69] hover:bg-[#6c7d5c] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4 text-white" />
                    <span>Quick Fix: Register with Email & Password instead</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            )}

            {/* Dynamic Provider Setup Guide (auth/operation-not-allowed) */}
            {showOperationNotAllowedHelp && (
              <div className="bg-[#F7F3EE] border border-[#E07A5F] border-2 p-5 rounded-2xl space-y-4 shadow-sm animate-fade-in text-left">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#E07A5F] animate-pulse" />
                  <h4 className="text-sm font-serif font-black text-[#2D2A26]">Enable Firebase Auth Providers</h4>
                </div>
                
                <p className="text-xs text-[#706961] leading-relaxed font-sans">
                  Firebase has blocked this authentication flow with error code <code className="bg-[#E8E2D9] px-1.5 py-0.5 rounded text-[#2D2A26] font-mono text-[11px] font-bold">auth/operation-not-allowed</code>. This indicates that the active sign-in methods are not enabled on your current Firebase configuration.
                </p>

                <div className="bg-white p-4 rounded-xl border border-[#E8E2D9] space-y-3 font-sans">
                  <div className="text-xs font-bold text-[#2D2A26]">
                    Follow these simple steps:
                  </div>

                  <ol className="text-xs text-[#706961] space-y-2 list-decimal list-inside">
                    <li className="leading-relaxed">
                      Go directly to your:{" "}
                      <a 
                        href="https://console.firebase.google.com/project/gen-lang-client-0577777315/authentication/providers" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#7D8F69] font-black underline hover:text-[#5e6b4e] inline-flex items-center gap-0.5 font-mono"
                      >
                        Firebase Sign-in Provider Dashboard ↗
                      </a>
                    </li>
                    <li className="leading-relaxed">
                      Click <strong className="text-[#2D2A26]">"Add new provider"</strong> (or configure existing).
                    </li>
                    <li className="leading-relaxed text-[#2D2A26]">
                      Enable authorization providers:
                      <div className="mt-2.5 pl-4 space-y-3">
                        <div className="bg-[#F7F3EE]/40 p-2.5 rounded-lg border border-[#E8E2D9] space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#E07A5F]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E07A5F]" />
                            <span>Google Provider (For Continue with Google)</span>
                          </div>
                          <p className="text-[10.5px] text-[#706961] pl-3">
                            Click <strong className="text-stone-700">Google</strong>, click the <strong className="text-stone-700">Enable</strong> switch, enter a support email, and click <strong className="text-stone-700">Save</strong>.
                          </p>
                        </div>
                        <div className="bg-[#F7F3EE]/40 p-2.5 rounded-lg border border-[#E8E2D9] space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#7D8F69]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7D8F69]" />
                            <span>Email/Password Provider (For Manual Sign-Up)</span>
                          </div>
                          <p className="text-[10.5px] text-[#706961] pl-3">
                            Click <strong className="text-stone-700">Email/Password</strong>, toggle <strong className="text-stone-700">Enable</strong>, and click <strong className="text-stone-700">Save</strong>.
                          </p>
                        </div>
                      </div>
                    </li>
                  </ol>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-[#E8E2D9]/60 pt-3">
                  <a
                    href="https://console.firebase.google.com/project/gen-lang-client-0577777315/authentication/providers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 bg-[#7D8F69] hover:bg-[#6c7d5c] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <span>Configure Firebase Settings ↗</span>
                  </a>
                  <button
                    type="button"
                    onClick={onBypassOffline}
                    className="py-3 px-4 bg-white hover:bg-gray-50 border border-[#E8E2D9] text-[#706961] rounded-xl text-xs font-bold transition-all"
                  >
                    Use Offline Guest Mode
                  </button>
                </div>
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
            <form 
              id="email-auth-form"
              onSubmit={handleEmailAuthSubmit} 
              onFocus={() => setHighlightEmailForm(false)}
              className={`space-y-4 transition-all duration-500 rounded-3xl ${
                highlightEmailForm 
                  ? "ring-4 ring-[#7D8F69] bg-[#7D8F69]/5 p-5 border border-[#7D8F69]/30 -mx-4 shadow-lg animate-pulse" 
                  : ""
              }`}
            >
              
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
