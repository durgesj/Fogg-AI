/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { Sparkles, Brain, ArrowRight, Hourglass, Shield, Coins, CheckCircle, Flame, Target } from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
  onLearnMore: () => void;
}

export default function LandingPage({ onGetStarted, onLearnMore }: LandingPageProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-800">
      {/* Sleek Decorative Ambient Shapes */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-100/30 blur-3xl" />
      <div className="absolute top-[30%] right-[-10%] h-[600px] w-[600px] rounded-full bg-violet-100/30 blur-3xl" />
      <div className="absolute bottom-[-10%] left-[20%] h-[500px] w-[500px] rounded-full bg-indigo-200/20 blur-3xl" />

      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-100"
          >
            <Sparkles className="h-3 w-3 text-indigo-600" />
            <span>AI Execution Companion for Google Hackathon</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-extrabold tracking-tight sm:text-7xl text-slate-900 leading-tight"
          >
            The AI That Helps You <span className="text-indigo-600 bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Start.</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed sm:text-xl"
          >
            Fogg AI is not a to-do list. It is an AI companion that detects the <strong className="text-slate-900 font-semibold">psychological barrier</strong> causing your procrastination and gives you the exact <strong className="text-slate-900 font-semibold">2-minute micro-action</strong> to break it.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-2"
          >
            <button
              onClick={onGetStarted}
              className="flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700 px-8 py-4 text-base font-semibold text-white shadow-md cursor-pointer transition-all hover:scale-[1.02]"
            >
              Get Started Free <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={onLearnMore}
              className="rounded-full border border-slate-200 bg-white hover:bg-slate-50 px-8 py-4 text-base font-semibold text-slate-700 cursor-pointer transition-all shadow-sm"
            >
              Learn the Science
            </button>
          </motion.div>
        </div>

        {/* Visual Comparison: Traditional To-Do vs. Fogg AI Loop */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-20 rounded-2xl border border-slate-200 bg-white p-8 shadow-md relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-xl font-bold tracking-tight text-slate-950 mb-8 text-center">Fogg AI is a Core Paradigm Shift</h2>
          
          <div className="grid gap-8 md:grid-cols-2">
            {/* Traditional Card */}
            <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-6 space-y-4">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block">Traditional Apps</span>
              <div className="space-y-3 pl-2 border-l border-rose-100">
                <div className="text-xs text-slate-600 flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Enter a massive, daunting goal</div>
                <div className="text-xs text-slate-600 flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Get passive alarms & reminders</div>
                <div className="text-xs text-slate-600 flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Swipe notification away (Anxiety rises)</div>
                <div className="text-xs text-slate-600 flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Goal rolls over to next week (Guilt)</div>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Results in: <strong className="text-rose-600 font-semibold">Decision fatigue</strong>, guilt, and worsening chronic procrastination.
              </p>
            </div>

            {/* Fogg AI Card */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-6 space-y-4 relative">
              <div className="absolute top-4 right-4 flex h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">Fogg AI Method</span>
              <div className="space-y-3 pl-2 border-l border-indigo-200">
                <div className="text-xs text-slate-700 flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Enter a task in plain speech</div>
                <div className="text-xs text-slate-700 flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> AI diagnoses the exact mental barrier</div>
                <div className="text-xs text-slate-700 flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> AI isolates a &lt;2 min friction-free prompt</div>
                <div className="text-xs text-slate-700 flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Take action, celebrate, and learn</div>
              </div>
              <p className="text-[11px] text-indigo-700 leading-normal">
                Results in: <strong className="font-semibold text-indigo-800">Immediate momentum</strong>, habit formation, and positive self-identity reinforcement.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <div className="mt-28 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">How We Turn Fear Into Focus</h2>
            <p className="text-sm text-slate-500">
              By combining Stanford's Behavior Design framework with behavioral economics, Fogg AI creates an irresistible prompt loop.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 hover:border-indigo-400 transition-colors shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Brain className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900">AI Barrier Diagnosis</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Using Gemini, Fogg AI classifies whether you're facing Task Aversion, Perfectionism, Cognitive Overload, or Temporal Discounting, tailoring its guidance dynamically.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 hover:border-indigo-400 transition-colors shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600 border border-violet-100">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900">Choice-Overload Prevention</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                By isolating only one active micro-step at a time and hiding all other tasks, Fogg AI eliminates decision paralysis and helps you focus on what's right in front of you.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 hover:border-indigo-400 transition-colors shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Coins className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900">Instant Dopamine Loops</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Every tiny accomplishment releases celebratory effects, granting you Focus Coins and immediate psychological closure to build robust positive habits.
              </p>
            </div>
          </div>
        </div>

        {/* CTA section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-32 rounded-2xl bg-gradient-to-tr from-indigo-500/5 to-violet-500/5 border border-indigo-100 p-12 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent_70%)]" />
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4 z-10 relative">Are you ready to stop stalling?</h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto mb-8 z-10 relative leading-relaxed">
            Connect your Google account or start as a guest. Experience Fogg AI's behavioral engineering loop in under 90 seconds.
          </p>
          <button
            onClick={onGetStarted}
            className="relative z-10 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-8 py-4 text-base font-semibold text-white hover:bg-indigo-700 shadow-md cursor-pointer transition-all hover:scale-[1.02]"
          >
            Launch Fogg Companion <ArrowRight className="h-5 w-5" />
          </button>
        </motion.div>
      </div>

      <footer className="border-t border-slate-200 bg-white py-10 relative z-10">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8 text-xs text-slate-400 space-y-2">
          <p>© 2026 Fogg AI. Powered by Behavioral Science & Google Gemini AI.</p>
          <p>Bypass procrastination through science-based micro-incentives.</p>
        </div>
      </footer>
    </div>
  );
}
