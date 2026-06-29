/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import Profile from "./components/Profile";
import Settings from "./components/Settings";
import Resources from "./components/Resources";
import NotFound from "./components/NotFound";
import HistoryPage from "./components/HistoryPage";
import { User, getStoredUser, getStoredStats, googleSignIn, guestSignIn, logout, saveStoredStats } from "./lib/auth";
import { UserStats, Task } from "./types";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Navigation State: "landing" | "dashboard" | "profile" | "settings" | "resources" | "features" | "404"
  const [currentPage, setCurrentPage] = useState<string>("landing");
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats>({
    focusCoins: 100,
    streak: 3,
    tasksCompletedCount: 5,
    lastCompletedDate: null,
  });

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Hydrate auth & stats from Local Storage on mount
  useEffect(() => {
    const storedUser = getStoredUser();
    const storedStats = getStoredStats();
    setUser(storedUser);
    setStats(storedStats);

    const handleHashAndSearch = () => {
      if (window.location.hash === "#developer" || window.location.search.includes("dev=true")) {
        setCurrentPage("settings");
      } else if (storedUser) {
        setCurrentPage("dashboard");
      }
    };

    handleHashAndSearch();
    window.addEventListener("hashchange", handleHashAndSearch);
    return () => window.removeEventListener("hashchange", handleHashAndSearch);
  }, []);

  // Auth-aware route protection and landing page redirection
  useEffect(() => {
    if (user) {
      if (currentPage === "landing") {
        setCurrentPage("dashboard");
      }
    } else {
      const protectedPages = ["dashboard", "profile", "settings", "history"];
      if (protectedPages.includes(currentPage)) {
        setCurrentPage("landing");
        setShowLoginModal(true);
      }
    }
  }, [user, currentPage]);

  const handleLoginSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setShowLoginModal(false);
    setCurrentPage("dashboard");
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setCurrentPage("landing");
  };

  const handleUpdateStats = (nextStats: UserStats) => {
    setStats(nextStats);
    saveStoredStats(nextStats);
  };

  const handleNavigate = (page: string) => {
    if (page === "features") {
      // Features are beautifully presented inside the landing page, so we scroll or focus them
      setCurrentPage("landing");
      setTimeout(() => {
        const featSection = document.getElementById("features-anchor");
        if (featSection) {
          featSection.scrollIntoView({ behavior: "smooth" });
        } else {
          // If not in view or on other screen, just render landing and scroll
          window.scrollTo({ top: 800, behavior: "smooth" });
        }
      }, 100);
      return;
    }

    const validPages = ["landing", "dashboard", "profile", "settings", "resources", "history"];
    if (validPages.includes(page)) {
      setCurrentPage(page);
    } else {
      setCurrentPage("404");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-indigo-500/35 selection:text-white antialiased text-slate-900">
      {/* Sticky Top Header Navigation */}
      <Navbar
        user={user}
        stats={stats}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        currentPage={currentPage}
        onOpenLogin={() => setShowLoginModal(true)}
      />

      {/* Main Page Rendering Area */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="w-full h-full"
          >
            {currentPage === "landing" && (
              <>
                <LandingPage
                  onGetStarted={() => {
                    if (user) {
                      setCurrentPage("dashboard");
                    } else {
                      setShowLoginModal(true);
                    }
                  }}
                  onLearnMore={() => setCurrentPage("resources")}
                />
                {/* Scroll Anchor reference */}
                <div id="features-anchor" className="h-1" />
              </>
            )}

            {currentPage === "dashboard" && (
              <Dashboard
                user={user}
                stats={stats}
                onUpdateStats={handleUpdateStats}
                onNavigate={handleNavigate}
                onLoginSuccess={handleLoginSuccess}
              />
            )}

            {currentPage === "profile" && (
              <Profile
                user={user}
                stats={stats}
                tasks={tasks}
                onNavigate={handleNavigate}
              />
            )}

            {currentPage === "settings" && (
              <Settings onNavigate={handleNavigate} />
            )}

            {currentPage === "resources" && (
              <Resources />
            )}

            {currentPage === "history" && (
              <HistoryPage
                user={user}
                onNavigate={handleNavigate}
              />
            )}

            {currentPage === "404" && (
              <NotFound onNavigate={handleNavigate} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Interactive Modal Login Overlay */}
      <AnimatePresence>
        {showLoginModal && (
          <Login
            onLoginSuccess={handleLoginSuccess}
            onClose={() => setShowLoginModal(false)}
            googleSignIn={googleSignIn}
            guestSignIn={guestSignIn}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
