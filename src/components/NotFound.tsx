/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { HelpCircle, ArrowLeft } from "lucide-react";

interface NotFoundProps {
  onNavigate: (page: string) => void;
}

export default function NotFound({ onNavigate }: NotFoundProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-850 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md text-center space-y-6"
      >
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
            <HelpCircle className="h-8 w-8" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            404 - Task Lost
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed font-normal">
            Even our psychological AI model couldn't find the page you are looking for. It might have procrastinated and wandered off!
          </p>
        </div>

        <button
          onClick={() => onNavigate("dashboard")}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6 py-3 text-sm font-semibold text-white cursor-pointer shadow-md shadow-indigo-600/10 transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Companion Center
        </button>
      </motion.div>
    </div>
  );
}
