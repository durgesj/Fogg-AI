/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Flame, Coins, Menu, X, Bell, User as UserIcon, LogOut, CheckCircle2, Shield, Compass, BookOpen, LayoutDashboard, History } from "lucide-react";
import { User } from "../lib/auth";
import { UserStats } from "../types";

interface NavbarProps {
  user: User | null;
  stats: UserStats;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
  onOpenLogin: () => void;
}

export default function Navbar({
  user,
  stats,
  onLogout,
  onNavigate,
  currentPage,
  onOpenLogin,
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotif(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowNotif(false);
      }
    }

    if (showNotif) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showNotif]);

  useEffect(() => {
    setShowNotif(false);
  }, [currentPage]);

  const notifications = [
    { id: 1, text: "Focus Coins updated! You earned +10 🪙", time: "Just now" },
    { id: 2, text: "Keep it up! 3-day streak active 🔥", time: "2 hours ago" },
    { id: 3, text: "AI Coach Fogg analyzed your wisdom teeth task.", time: "1 day ago" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => {
                if (user) {
                  if (currentPage === "dashboard") {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  } else {
                    onNavigate("dashboard");
                  }
                } else {
                  onNavigate("landing");
                }
              }}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-sm transition-all group-hover:scale-105">
                <span className="text-lg font-bold text-white tracking-wider">F</span>
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-800">
                Fogg AI
              </span>
            </button>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {!user ? (
                <>
                  <button
                    onClick={() => onNavigate("landing")}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === "landing" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    Home
                  </button>
                  <button
                    onClick={() => onNavigate("features")}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === "features" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    Features
                  </button>
                  <button
                    onClick={() => onNavigate("resources")}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === "resources" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    Resources
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onNavigate("dashboard")}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === "dashboard" ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => onNavigate("resources")}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === "resources" ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <BookOpen className="h-4 w-4" />
                    Resources
                  </button>
                  <button
                    onClick={() => onNavigate("history")}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === "history" ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <History className="h-4 w-4" />
                    History
                  </button>
                </>
              )}
            </div>
          </div>

          {/* User Section & Profile Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                {/* Streak Counter */}
                <div className="flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-100 px-3.5 py-1 text-xs font-bold text-orange-700">
                  <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                  <span>{stats.streak}d Streak</span>
                </div>

                {/* Coins Counter */}
                <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100/80 px-3.5 py-1 text-xs font-bold text-indigo-600">
                  <Coins className="h-3.5 w-3.5 text-indigo-600" />
                  <span>{stats.focusCoins} Coins</span>
                </div>

                {/* Notifications Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotif(!showNotif)}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all relative cursor-pointer"
                  >
                    <Bell className="h-4 w-4" />
                    <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-indigo-600" />
                  </button>

                  <AnimatePresence>
                    {showNotif && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-lg z-40"
                      >
                        <h4 className="font-semibold text-sm text-slate-800 mb-3">Notifications</h4>
                        <div className="space-y-3">
                          {notifications.map((notif) => (
                            <div key={notif.id} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                              <p className="text-xs text-slate-600">{notif.text}</p>
                              <span className="text-[10px] text-slate-400 mt-1 block">{notif.time}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User Dropdown */}
                <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                  <button
                    onClick={() => onNavigate("profile")}
                    className="flex items-center gap-2 text-left cursor-pointer group"
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || "User"}
                        className="h-8 w-8 rounded-full ring-2 ring-indigo-600/30 object-cover group-hover:ring-indigo-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                        {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                        {user.displayName || "User"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {user.isGuest ? "Guest Mode" : "Pro Companion"}
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={onLogout}
                    className="p-1.5 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={onOpenLogin}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={onOpenLogin}
                  className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-xs text-indigo-600 font-bold">
                <Coins className="h-3 w-3" />
                <span>{stats.focusCoins}</span>
              </div>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3"
          >
            {!user ? (
              <>
                <button
                  onClick={() => {
                    onNavigate("landing");
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    onNavigate("features");
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
                >
                  Features
                </button>
                <button
                  onClick={() => {
                    onNavigate("resources");
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
                >
                  Resources
                </button>
                <div className="pt-2 border-t border-slate-100 flex gap-3">
                  <button
                    onClick={() => {
                      onOpenLogin();
                      setIsOpen(false);
                    }}
                    className="flex-1 text-center py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-50 rounded-lg"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      onOpenLogin();
                      setIsOpen(false);
                    }}
                    className="flex-1 text-center py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                  >
                    Get Started
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    onNavigate("dashboard");
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    onNavigate("resources");
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
                >
                  Resources
                </button>
                <button
                  onClick={() => {
                    onNavigate("history");
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
                >
                  History
                </button>
                <button
                  onClick={() => {
                    onNavigate("profile");
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
                >
                  Profile
                </button>
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between px-3 py-1 text-xs text-slate-500">
                    <span>🔥 Current Streak</span>
                    <span className="font-bold text-orange-600">{stats.streak} days</span>
                  </div>
                  <div className="flex justify-between px-3 py-1 text-xs text-slate-500">
                    <span>🪙 Focus Coins</span>
                    <span className="font-bold text-indigo-600">{stats.focusCoins} Coins</span>
                  </div>
                  <button
                    onClick={() => {
                      onLogout();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
