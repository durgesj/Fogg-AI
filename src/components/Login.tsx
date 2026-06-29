/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { Brain, Sparkles, LogIn, ArrowRight, ShieldCheck, HeartPulse, User } from "lucide-react";
import { User as AuthUser } from "../lib/auth";

interface LoginProps {
  onLoginSuccess: (user: AuthUser) => void;
  onClose: () => void;
  googleSignIn: () => Promise<{ user: AuthUser; accessToken: string }>;
  guestSignIn: (name: string) => Promise<AuthUser>;
}

export default function Login({
  onLoginSuccess,
  onClose,
  googleSignIn,
  guestSignIn,
}: LoginProps) {
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isIframe = typeof window !== "undefined" && window.self !== window.top;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { user } = await googleSignIn();
      onLoginSuccess(user);
    } catch (err: any) {
      console.warn("Google sign in failed:", err);
      setError(err.message || "Unable to connect to Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const user = await guestSignIn(guestName);
      onLoginSuccess(user);
    } catch (err) {
      console.warn("Guest login failed:", err);
      setError("Unable to sign in as guest. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative flex h-full max-h-[640px] w-full max-w-[960px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Left Panel: Psychology Branding */}
        <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-10 md:flex border-r border-slate-200">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.08),transparent_60%)]" />

          {/* Logo Brand */}
          <div className="flex items-center gap-2.5 z-10">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-sm">
              <span className="font-bold text-white text-sm">F</span>
            </div>
            <span className="font-bold text-lg text-slate-800">Fogg AI</span>
          </div>

          {/* Core psychology tagline list */}
          <div className="space-y-6 z-10 my-auto">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">
              Stop fighting your brain. Understand it first.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              Fogg AI uses behavioral economics and the Fogg Behavior Model to diagnose procrastination barriers instantly.
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Brain className="h-3 w-3" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Behavioral Economics</h4>
                  <p className="text-[11px] text-slate-500">Micro-chunking & Choice isolation reduces cognitive friction to absolute zero.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600 border border-violet-100">
                  <HeartPulse className="h-3 w-3" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Psychological Interventions</h4>
                  <p className="text-[11px] text-slate-500">Loss Aversion warnings bypass hyperbolic discounting to spark instant actions.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="z-10 text-[11px] text-slate-400 border-t border-slate-200 pt-4 flex justify-between font-medium">
            <span>Built for Google AI Hackathon</span>
            <span>Fogg Behavior Model (B=MAP)</span>
          </div>
        </div>

        {/* Right Panel: Authentication Forms */}
        <div className="relative flex w-full flex-col justify-center px-6 py-10 md:w-1/2 md:px-12 bg-white">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer animate-none"
          >
            <XIcon className="h-5 w-5" />
          </button>

          <div className="w-full max-w-sm mx-auto">
            <div className="text-center md:text-left mb-8">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome to Fogg AI</h3>
              <p className="text-xs text-slate-500 mt-1">
                Select your preferred sign in method below to begin.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl bg-red-50 p-3.5 text-xs text-red-600 border border-red-100 flex items-start gap-2.5 font-medium leading-relaxed">
                <span className="shrink-0 text-sm select-none">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                <p className="text-xs text-slate-500 font-medium">Authenticating with Fogg Companion...</p>
              </div>
            ) : !isGuestMode ? (
              <div className="space-y-4">
                {/* Google Sign In (Compliant GSI style) */}
                <button
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 rounded-full border border-slate-200 bg-white hover:bg-slate-50 px-4 py-3 text-slate-800 transition-all shadow-sm hover:shadow-md cursor-pointer font-semibold text-sm"
                >
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>Sign in with Google</span>
                </button>

                {isIframe && (
                  <p className="text-[10px] text-slate-400 text-center mt-1 leading-relaxed">
                    💡 <strong>Running in preview?</strong> Please ensure popups are allowed, or open the application in a new tab using the button at the top-right if login fails.
                  </p>
                )}

                <div className="relative my-6 flex items-center justify-center">
                  <div className="absolute w-full border-t border-slate-100" />
                  <span className="relative bg-white px-3 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    or
                  </span>
                </div>

                {/* Switch to Guest Login Button */}
                <button
                  onClick={() => setIsGuestMode(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 py-3 text-slate-700 text-sm font-semibold transition-all cursor-pointer"
                >
                  <User className="h-4 w-4 text-slate-500" />
                  <span>Sign in as Guest / Demo</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleGuestSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Your First Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsGuestMode(false)}
                    className="w-1/3 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold cursor-pointer hover:bg-slate-50 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-white text-xs font-semibold cursor-pointer hover:bg-indigo-700 transition-all"
                  >
                    <span>Enter Sandbox</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </form>
            )}

            <div className="mt-8 border-t border-slate-100 pt-4 text-center">
              <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Durable sandbox session (Local Storage enabled)
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Simple absolute close icon mapping
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
