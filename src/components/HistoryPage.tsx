import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  getCompletedTasks, 
  calculateAIMemory, 
  CompletedTask, 
  AIMemory,
  syncOfflineCompletedTasks
} from "../lib/firestore";
import { User } from "../lib/auth";
import { 
  History, 
  ArrowLeft, 
  Search, 
  SlidersHorizontal, 
  Calendar, 
  Timer, 
  Coins, 
  Award, 
  ChevronDown, 
  ChevronUp, 
  Brain, 
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  TrendingUp,
  Clock,
  Sparkles,
  RefreshCw,
  FolderOpen
} from "lucide-react";

interface HistoryPageProps {
  user: User | null;
  onNavigate: (page: string) => void;
}

export default function HistoryPage({ user, onNavigate }: HistoryPageProps) {
  const [tasks, setTasks] = useState<CompletedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [aiMemory, setAiMemory] = useState<AIMemory | null>(null);

  // Search, filter, and sorting states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBarrier, setSelectedBarrier] = useState("all");
  const [selectedIntervention, setSelectedIntervention] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "category" | "readiness">("newest");
  
  // Expanded AI Summary tracker per task card
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});

  // Sync state
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fetch completed tasks
  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getCompletedTasks(user);
      setTasks(data);
      setAiMemory(calculateAIMemory(data));
    } catch (error) {
      console.error("Failed to load execution history", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  // Handle manual sync trigger
  const handleSync = async () => {
    if (!user || user.isGuest) return;
    setSyncing(true);
    try {
      await syncOfflineCompletedTasks(user);
      const data = await getCompletedTasks(user);
      setTasks(data);
      setAiMemory(calculateAIMemory(data));
    } catch (e) {
      console.error("Sync error", e);
    } finally {
      setSyncing(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedCardIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Get unique filter lists
  const categories = Array.from(new Set(tasks.map(t => t.category || "General"))).filter(Boolean);
  const barriers = Array.from(new Set(tasks.map(t => t.primaryBarrier || t.secondaryBarrier))).filter(Boolean);
  const interventions = Array.from(new Set(tasks.map(t => t.intervention))).filter(Boolean);

  // Filter & Sort Logic
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.coachSummary || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || task.category === selectedCategory;
    const matchesBarrier = selectedBarrier === "all" || 
      task.primaryBarrier === selectedBarrier || 
      task.secondaryBarrier === selectedBarrier;
    
    const matchesIntervention = selectedIntervention === "all" || task.intervention === selectedIntervention;

    return matchesSearch && matchesCategory && matchesBarrier && matchesIntervention;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
    }
    if (sortBy === "oldest") {
      return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
    }
    if (sortBy === "category") {
      return (a.category || "").localeCompare(b.category || "");
    }
    if (sortBy === "readiness") {
      return (b.readinessScore || 0) - (a.readinessScore || 0);
    }
    return 0;
  });

  // Helper to format duration beautifully
  const formatDuration = (seconds: number) => {
    if (!seconds) return "45s (Frictionless)";
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  // Format date nicely
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, { 
        month: "short", 
        day: "numeric", 
        year: "numeric" 
      }) + " at " + date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return "Completed Just Now";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        
        {/* Breadcrumb / Top Navigation bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <button
              onClick={() => onNavigate("dashboard")}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md">
                <History className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Execution Memory</h1>
                <p className="text-sm text-slate-500 font-medium">Historical timelines, adaptive progress, and deep psychology mapping.</p>
              </div>
            </div>
          </div>

          {/* Sync status button */}
          {user && !user.isGuest && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleSync}
                disabled={syncing || !isOnline}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isOnline 
                    ? "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm" 
                    : "bg-amber-50 text-amber-700 border-amber-100 cursor-not-allowed"
                }`}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing memory..." : !isOnline ? "Offline Mode" : "Sync Cloud"}
              </button>
              {isOnline ? (
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" title="Cloud Active" />
              ) : (
                <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500" title="Offline Cached" />
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin" />
            <p className="text-sm text-slate-500 font-semibold animate-pulse">Recalling historical execution sessions...</p>
          </div>
        ) : (
          <>
            {/* AI MEMORY bento grid */}
            {aiMemory && tasks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-4 md:grid-cols-4 sm:grid-cols-2"
              >
                {/* Bento Card 1: Common Barrier */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 h-24 w-24 bg-rose-50/50 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Primary Obstacle</span>
                    <span className="p-1.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-600">
                      <Brain className="h-4 w-4" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight mt-1 truncate">
                      {aiMemory.mostCommonBarrier}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-normal mt-1 leading-relaxed">
                      This cognitive block triggers your procrastination cycle most frequently.
                    </p>
                  </div>
                </div>

                {/* Bento Card 2: Most Successful Intervention */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-50/50 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Success Hack</span>
                    <span className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600">
                      <Lightbulb className="h-4 w-4" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight mt-1 truncate">
                      {aiMemory.mostSuccessfulIntervention}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-normal mt-1 leading-relaxed">
                      Most effective B=MAP tactic that bypasses mental resistance.
                    </p>
                  </div>
                </div>

                {/* Bento Card 3: Metrics summary */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-50/50 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Behavior Ratios</span>
                    <span className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
                      <TrendingUp className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Avg Readiness</span>
                      <span className="text-lg font-black text-slate-800 font-mono">{aiMemory.averageReadiness}/100</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Confidence Ratio</span>
                      <span className="text-lg font-black text-slate-800 font-mono">{aiMemory.historicalConfidence}%</span>
                    </div>
                  </div>
                </div>

                {/* Bento Card 4: Productive hours and Category */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 h-24 w-24 bg-violet-50/50 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Prime Working State</span>
                    <span className="p-1.5 rounded-lg bg-violet-50 border border-violet-100 text-violet-600">
                      <Clock className="h-4 w-4" />
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Peak Time Range</span>
                    <h3 className="text-sm font-extrabold text-slate-800 tracking-tight truncate">
                      {aiMemory.mostProductiveWorkingHours}
                    </h3>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Top Category:</span>
                      <span className="text-[10px] font-bold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">
                        {aiMemory.mostProductiveGoalCategory}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Filter and Control Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search goals, summaries, descriptions..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/85 focus:outline-none focus:border-indigo-500 text-xs font-semibold placeholder:text-slate-400/80 transition-colors bg-slate-50/50"
                  />
                </div>

                {/* Sorting and Action Selector */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Sort by</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {(["newest", "oldest", "category", "readiness"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setSortBy(mode)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all border ${
                          sortBy === mode 
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" 
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic Filters panel */}
              {tasks.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-3 pt-3 border-t border-slate-100 text-xs">
                  {/* Category Filter */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Goal Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-700 bg-slate-50/50 font-semibold cursor-pointer"
                    >
                      <option value="all">All Categories ({categories.length})</option>
                      {categories.map((c, idx) => (
                        <option key={idx} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Barrier Filter */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Psychological Barrier</label>
                    <select
                      value={selectedBarrier}
                      onChange={(e) => setSelectedBarrier(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-700 bg-slate-50/50 font-semibold cursor-pointer"
                    >
                      <option value="all">All Barriers ({barriers.length})</option>
                      {barriers.map((b, idx) => (
                        <option key={idx} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  {/* Intervention Filter */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Fogg Hack</label>
                    <select
                      value={selectedIntervention}
                      onChange={(e) => setSelectedIntervention(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-700 bg-slate-50/50 font-semibold cursor-pointer"
                    >
                      <option value="all">All Interventions ({interventions.length})</option>
                      {interventions.map((i, idx) => (
                        <option key={idx} value={i}>{i}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Timelines and Cards */}
            {sortedTasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 border-2 border-dashed border-slate-200 bg-white rounded-2xl p-8 space-y-3"
              >
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <FolderOpen className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No matching completed goals</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-normal">
                  Try clearing some filters, searching for a different keyword, or complete some daunting micro-actions on the Dashboard!
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                    setSelectedBarrier("all");
                    setSelectedIntervention("all");
                  }}
                  className="mt-3 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Reset all filters
                </button>
              </motion.div>
            ) : (
              <div className="space-y-6 relative pl-4 md:pl-8 border-l border-indigo-100/80">
                <AnimatePresence mode="popLayout">
                  {sortedTasks.map((task, index) => {
                    const isExpanded = !!expandedCardIds[task.id];
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -15, y: 10 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: Math.min(0.2, index * 0.04) }}
                        className="relative group"
                      >
                        {/* Timeline node */}
                        <div className="absolute -left-[21px] md:-left-[37px] top-6 h-4 w-4 rounded-full border-4 border-white bg-indigo-600 shadow-sm z-10 transition-transform group-hover:scale-125" />

                        {/* Premium session card */}
                        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-none group-hover:shadow-md group-hover:border-indigo-200 transition-all duration-300 relative overflow-hidden">
                          
                          {/* Card top banner with metrics */}
                          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white/30">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[9px] font-extrabold text-indigo-700 tracking-wider uppercase">
                                  {task.category || "General"}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-[9px] font-extrabold text-rose-700 tracking-wider uppercase">
                                  Barrier: {task.primaryBarrier || "Perfectionism"}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-150 text-[9px] font-bold text-slate-500">
                                  Hack: {task.intervention || "Micro Chunk"}
                                </span>
                              </div>
                              <h2 className="text-base font-black text-slate-900 tracking-tight leading-snug group-hover:text-indigo-600 transition-colors">
                                {task.title}
                              </h2>
                              <div className="flex items-center gap-4 text-[10px] text-slate-400 font-semibold pt-0.5">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" /> {formatDate(task.completedAt)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> Duration: {formatDuration(task.executionTime)}
                                </span>
                              </div>
                            </div>

                            {/* Scoring indicators */}
                            <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
                              <div className="text-center bg-slate-50 border border-slate-150/60 p-2 rounded-xl min-w-16">
                                <span className="text-[8px] font-bold text-slate-400 block uppercase">Readiness</span>
                                <span className="text-xs font-black text-slate-800 font-mono">{task.readinessScore || 50}/100</span>
                              </div>

                              <div className="text-center bg-indigo-50/50 border border-indigo-100 p-2 rounded-xl min-w-16">
                                <span className="text-[8px] font-bold text-indigo-400 block uppercase">Coins</span>
                                <span className="text-xs font-black text-indigo-600 font-mono">+{task.coinsEarned || 15} 🪙</span>
                              </div>

                              <div className="flex items-center justify-center p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                                <CheckCircle className="h-5 w-5" />
                              </div>
                            </div>
                          </div>

                          {/* Expandable Coach Summary content */}
                          <div className="p-5 space-y-4">
                            {task.description && (
                              <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50/50 px-3 py-2 rounded-xl border border-slate-100">
                                <strong className="text-slate-800 text-[10px] uppercase block tracking-wider mb-0.5">Original Goal Context:</strong>
                                {task.description}
                              </p>
                            )}

                            {/* Dropdown toggle */}
                            <button
                              onClick={() => toggleExpand(task.id)}
                              className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-slate-200/80 bg-slate-50/20 hover:bg-slate-50 text-xs font-bold text-indigo-700 transition-all cursor-pointer shadow-sm"
                            >
                              <span className="flex items-center gap-1.5">
                                <Sparkles className="h-4 w-4 text-violet-500" />
                                {isExpanded ? "Hide AI Coach Behavioral Notes" : "View AI Coach Behavioral Notes & Context"}
                              </span>
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>

                            <AnimatePresence initial={false}>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.25 }}
                                  className="overflow-hidden"
                                >
                                  <div className="pt-2 pl-4 border-l-2 border-violet-200 space-y-2 text-xs text-slate-600 leading-relaxed font-normal">
                                    <div className="bg-indigo-50/30 p-3 rounded-xl border border-indigo-100/50">
                                      <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-widest block mb-1">Psychological Analysis summary</span>
                                      <p className="text-slate-700 whitespace-pre-line leading-relaxed font-medium">
                                        {task.coachSummary || "No active context logged. User overcame resistance cleanly."}
                                      </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] font-semibold text-slate-500">
                                      <div>
                                        <span className="text-[9px] text-slate-400 uppercase block">Secondary Impediment</span>
                                        <span className="text-slate-700 font-bold">{task.secondaryBarrier || "Procrastination loop"}</span>
                                      </div>
                                      <div>
                                        <span className="text-[9px] text-slate-400 uppercase block">Streak contribution</span>
                                        <span className="text-emerald-600 font-extrabold">Active Booster (+1 day)</span>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
