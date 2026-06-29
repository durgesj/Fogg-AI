/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { Shield, Settings as SettingsIcon, Link, Key, Info, HelpCircle, ArrowLeft, Check, Clipboard } from "lucide-react";

interface SettingsProps {
  onNavigate: (page: string) => void;
}

export default function Settings({ onNavigate }: SettingsProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const redirectUri = window.location.origin + "/auth/callback";

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Back Button */}
        <button
          onClick={() => onNavigate("dashboard")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        {/* Header Title */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-600">
            <SettingsIcon className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">System Configuration</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-950 tracking-tight">Fogg AI Settings</h2>
          <p className="text-sm text-slate-500 leading-relaxed font-normal">
            Manage your Google Workspace Tasks API credentials, review OAuth scopes, and optimize your developer sandbox environments.
          </p>
        </div>

        {/* Credentials & Env Panel */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 bg-white p-8 space-y-6 relative overflow-hidden shadow-sm"
        >
          <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-50/50 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 z-10 relative">
            <Key className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">Google Cloud Credential Setup</h3>
          </div>

          <div className="space-y-4 text-xs text-slate-600 z-10 relative font-normal">
            <p>
              To authorize Google Tasks syncing across your real Google account, ensure the following credentials are configured in your Cloud Console:
            </p>

            {/* Callback URL Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-150 space-y-2">
              <span className="font-bold text-slate-800 block">Authorized Redirect URI</span>
              <p className="text-[11px] text-slate-500">Add this exact URL inside Google Cloud Console API Credentials &gt; OAuth 2.0 Client IDs:</p>
              <div className="flex items-center justify-between gap-4 bg-white p-2.5 rounded-lg border border-slate-100 font-mono text-[11px] text-indigo-600 overflow-x-auto">
                <span className="whitespace-nowrap font-semibold">{redirectUri}</span>
                <button
                  onClick={() => handleCopy(redirectUri, "uri")}
                  className="p-1 rounded hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-all cursor-pointer shrink-0"
                  title="Copy Redirect URI"
                >
                  {copied === "uri" ? <Check className="h-4 w-4 text-emerald-600" /> : <Clipboard className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Required Environment Variables */}
            <div className="space-y-2.5">
              <span className="font-bold text-slate-800 block">Required Environment Secrets</span>
              <p className="text-[11px] text-slate-500">Configure these within the <strong>Secrets</strong> panel of Google AI Studio:</p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-150">
                  <span className="font-mono text-[10px] text-indigo-600 block font-bold">GEMINI_API_KEY</span>
                  <span className="text-[11px] text-slate-500 block mt-1">Powers the Fogg Behavior Diagnosis engine.</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-150">
                  <span className="font-mono text-[10px] text-indigo-600 block font-bold">OAUTH_CLIENT_ID</span>
                  <span className="text-[11px] text-slate-500 block mt-1">Google OAuth Client ID from Cloud Console.</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* OAuth Scopes & Permissions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-slate-200 bg-white p-8 space-y-6 shadow-sm"
        >
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Shield className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">OAuth Scope Compliance</h3>
          </div>

          <div className="space-y-4 text-xs text-slate-600 font-normal">
            <p>
              Fogg AI only requests the minimum, non-destructive read scopes required to read your to-do lists. We never store your login details permanently.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-150">
                <div className="space-y-0.5">
                  <span className="font-mono text-[11px] text-slate-800 font-bold block">https://www.googleapis.com/auth/tasks.readonly</span>
                  <span className="text-[10px] text-slate-500 block">Allows reading Google Task lists and active tasks for AI evaluation.</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[9px] font-bold text-emerald-700 shrink-0">ACTIVE</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-150">
                <div className="space-y-0.5">
                  <span className="font-mono text-[11px] text-slate-800 font-bold block">https://www.googleapis.com/auth/userinfo.profile</span>
                  <span className="text-[10px] text-slate-500 block">Accesses your basic Google profile name and photo.</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[9px] font-bold text-emerald-700 shrink-0">ACTIVE</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Informative Help Card */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-900">
          <Info className="h-5 w-5 shrink-0 text-indigo-600" />
          <p className="leading-relaxed font-medium">
            Need further assistance deploying or hosting Fogg AI for your team? Visited the official <strong>Resources</strong> page to learn about BJ Fogg's design practices, or explore our documentation regarding enterprise deployment.
          </p>
        </div>
      </div>
    </div>
  );
}
