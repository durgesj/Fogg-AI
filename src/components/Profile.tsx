/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { User } from "../lib/auth";
import { UserStats, Task } from "../types";
import { Award, Flame, Coins, Calendar, CheckCircle2, History, ArrowLeft, Trophy } from "lucide-react";
import { getCompletedTasks, CompletedTask } from "../lib/firestore";

interface ProfileProps {
  user: User | null;
  stats: UserStats;
  tasks: Task[];
  onNavigate: (page: string) => void;
}

export default function Profile({ user, stats, tasks, onNavigate }: ProfileProps) {
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const data = await getCompletedTasks(user);
        setCompletedTasks(data);
      } catch (err) {
        console.warn("Failed to fetch completed tasks for profile:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Back Button */}
        <button
          onClick={() => onNavigate("dashboard")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        {/* Header Profile Info */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 bg-white p-8 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden shadow-md"
        >
          <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-50/50 rounded-full blur-2xl pointer-events-none" />

          {/* User Image / Avatar */}
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || "User"}
              className="h-20 w-20 rounded-full ring-4 ring-indigo-100 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl font-bold border border-indigo-100">
              {user?.displayName ? user.displayName[0].toUpperCase() : "U"}
            </div>
          )}

          {/* User Text Details */}
          <div className="text-center sm:text-left space-y-1 z-10">
            <h2 className="text-2xl font-bold text-slate-950 tracking-tight">{user?.displayName || "Fogg Executioner"}</h2>
            <p className="text-slate-500 text-sm font-normal">{user?.email || "Local sandbox companion guest"}</p>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-100 mt-2">
              <Trophy className="h-3.5 w-3.5 text-indigo-600" />
              <span>Rank: Fogg Action Practitioner</span>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-3">
          {/* Flame Streak */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold">Current Streak</span>
              <div className="p-1.5 rounded-lg bg-orange-50 text-orange-700 border border-orange-100">
                <Flame className="h-5 w-5 fill-orange-500 text-orange-500" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold text-slate-900">{stats.streak} Days</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-normal">Keep analyzing tasks daily to protect your streak.</p>
            </div>
          </motion.div>

          {/* Focus Coins */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold">Focus Coins</span>
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Coins className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold text-slate-900">{stats.focusCoins} 🪙</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-normal">Earned by executing 2-minute micro-actions.</p>
            </div>
          </motion.div>

          {/* Completed Tasks Counter */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold">Total Broken Barriers</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-extrabold text-slate-900">{stats.tasksCompletedCount} Tasks</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-normal">Massive mountains converted into micro-steps.</p>
            </div>
          </motion.div>
        </div>

        {/* History Log */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-6">
            <History className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-950">Execution History</h3>
          </div>

          {completedTasks.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500 font-semibold">No tasks completed yet in this session.</p>
              <p className="text-xs text-slate-400 mt-1 font-normal">Your action records will display here when you execute micro-actions!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-indigo-300 hover:bg-white transition-all shadow-none hover:shadow-sm"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{task.title}</h4>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                      Barrier: {task.primaryBarrier || "Perfectionism"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-3 sm:mt-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-normal">Completed On</span>
                      <span className="text-xs text-slate-600 font-semibold">
                        {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : new Date().toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
