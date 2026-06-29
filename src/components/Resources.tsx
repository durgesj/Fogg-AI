/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { BookOpen, Sparkles, Brain, Award, Star, Compass, Play, ArrowRight } from "lucide-react";

export default function Resources() {
  const articles = [
    {
      title: "The Fogg Behavior Model (B=MAP) Explained",
      category: "Behavior Design",
      readTime: "5 min read",
      description: "How BJ Fogg's behavior formula shows that when Motivation is low, we must make the Ability aspect simple and seamless to achieve positive change.",
      icon: Brain,
      url: "https://behaviormodel.org/",
    },
    {
      title: "Understanding Hyperbolic Discounting in Procrastination",
      category: "Behavioral Economics",
      readTime: "7 min read",
      description: "Why your brain values immediate micro-rewards over long-term goals, and how Fogg AI leverages Loss Aversion to balance this temporal bias.",
      icon: Compass,
      url: "https://thedecisionlab.com/biases/hyperbolic-discounting",
    },
    {
      title: "The Power of Micro-Chunking & Choice Isolation",
      category: "Cognitive Science",
      readTime: "4 min read",
      description: "How reducing a massive goal down to exactly one 2-minute micro-action prevents decision fatigue and choice overload.",
      icon: Award,
      url: "https://jamesclear.com/two-minute-rule",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-100 mb-4"
          >
            <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
            <span>Fogg Psychology Library</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-extrabold tracking-tight sm:text-5xl text-slate-900 leading-tight"
          >
            Behavioral Science of Start
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 mt-4 leading-relaxed font-normal"
          >
            Procrastination is not a time-management problem. It is an emotional regulation and cognitive load challenge. Here is how Fogg AI is programmed to help you take action.
          </motion.p>
        </div>

        {/* B=MAP Interactive Explanation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-slate-200 bg-white p-8 mb-16 shadow-md relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6 animate-none">The Core Formula: B = MAP</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="p-5 rounded-xl bg-slate-50/50 border border-slate-150 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-700 border border-orange-100 font-bold">
                M
              </div>
              <h3 className="font-bold text-sm text-slate-800">Motivation</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Your drive to complete the goal. When motivation is high, you can do hard tasks. However, motivation is highly unstable and will fail you when you are tired or stressed.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50/50 border border-slate-150 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold">
                A
              </div>
              <h3 className="font-bold text-sm text-slate-800">Ability</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                The simplicity of the task. If motivation is low, you can only trigger actions if they are incredibly simple. Fogg AI maximizes Ability by shrinking your task to under 2 minutes.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50/50 border border-slate-150 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 font-bold">
                P
              </div>
              <h3 className="font-bold text-sm text-slate-800">Prompt</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                The cue or trigger to act. A call to action. Fogg AI serves as your cognitive prompt, presenting exactly one isolated micro-step right when your decision energy is highest.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Resources Articles Bento List */}
        <div className="grid gap-6 md:grid-cols-3 mb-16">
          {articles.map((art, index) => {
            const Icon = art.icon;
            return (
              <motion.a
                key={art.title}
                href={art.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index + 0.4 }}
                className="flex flex-col justify-between p-6 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 shadow-sm transition-all group cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:scale-105 transition-transform">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{art.category}</span>
                    <h3 className="font-bold text-sm text-slate-800 mt-1 line-clamp-2 group-hover:text-indigo-700 transition-colors">
                      {art.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-3 font-normal">
                      {art.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6 text-[10px] text-slate-400">
                  <span>{art.readTime}</span>
                  <span className="flex items-center gap-1 text-indigo-600 font-semibold group-hover:translate-x-1 transition-transform">
                    Read Article <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </motion.a>
            );
          })}
        </div>

        {/* Bottom Callout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center py-6 border-t border-slate-200"
        >
          <span className="text-xs text-slate-400 font-medium">
            Backed by research from Stanford Behavior Design Lab and Harvard Psychological Assessment Center.
          </span>
        </motion.div>
      </div>
    </div>
  );
}
