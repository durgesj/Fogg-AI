/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import {
  Brain,
  Timer,
  CheckCircle2,
  MessageSquare,
  Calendar,
  ArrowRight,
  Plus,
  Sparkles,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Send,
  AlertCircle,
  FolderSync,
  X,
  Coins,
  Flame,
  User as UserIcon,
  HelpCircle,
  AlertTriangle,
  TrendingUp
} from "lucide-react";
import { User, getAccessToken, googleSignIn } from "../lib/auth";
import { Task, BehaviorAnalysis, CoachMessage, UserStats } from "../types";
import { fetchGoogleTaskLists, fetchGoogleTasks, GoogleTaskList } from "../lib/googleTasks";
import ReactMarkdown from "react-markdown";
import { saveCompletedTask, getCompletedTasks, CompletedTask } from "../lib/firestore";
import { detectCategory, getInstantQuestions } from "../data/questionBank";

interface DashboardProps {
  user: User | null;
  stats: UserStats;
  onUpdateStats: (stats: UserStats) => void;
  onNavigate: (page: string) => void;
  onLoginSuccess?: (user: User) => void;
}

export default function Dashboard({
  user,
  stats,
  onUpdateStats,
  onNavigate,
  onLoginSuccess,
}: DashboardProps) {
  // Tasks State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google Tasks State
  const [gLists, setGLists] = useState<GoogleTaskList[]>([]);
  const [selectedGList, setSelectedGList] = useState("");
  const [gTasks, setGTasks] = useState<Task[]>([]);
  const [selectedGTaskIds, setSelectedGTaskIds] = useState<string[]>([]);
  const [showGImport, setShowGImport] = useState(false);
  const [loadingGLists, setLoadingGLists] = useState(false);
  const [needsGConnection, setNeedsGConnection] = useState(false);
  const [usingGSandbox, setUsingGSandbox] = useState(false);
  const [gImportError, setGImportError] = useState<string | null>(null);
  const [gStatusText, setGStatusText] = useState<string | null>(null);

  // Adaptive Behavioral Assessment States
  const [isAssessmentActive, setIsAssessmentActive] = useState(false);
  const [assessmentGoal, setAssessmentGoal] = useState<{ title: string; description: string; deadline: string } | null>(null);
  const [assessmentCategory, setAssessmentCategory] = useState("");
  const [assessmentQuestions, setAssessmentQuestions] = useState<any[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, string>>({});
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Continuous Execution Session States
  const [sessionCompletedSteps, setSessionCompletedSteps] = useState<string[]>([]);
  const [sessionTotalSteps, setSessionTotalSteps] = useState<number>(6);
  const [sessionCurrentStepNumber, setSessionCurrentStepNumber] = useState<number>(1);
  const [sessionElapsedTime, setSessionElapsedTime] = useState<number>(0);
  const [sessionMomentumScore, setSessionMomentumScore] = useState<number>(50);
  const [sessionStepFeeling, setSessionStepFeeling] = useState<string | null>(null);
  const [sessionCurrentState, setSessionCurrentState] = useState<"active" | "reflection" | "next_choice" | "generating" | "break" | "schedule" | "stuck" | "completed">("active");
  const [sessionBreakTimeLeft, setSessionBreakTimeLeft] = useState<number>(300);
  const [sessionScheduleDate, setSessionScheduleDate] = useState<string>("");
  const [sessionScheduleTime, setSessionScheduleTime] = useState<string>("");
  const [loadingNextStep, setLoadingNextStep] = useState<boolean>(false);

  // Timer State for Choice Isolation Pane
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // AI Coach Chat State
  const [chatHistory, setChatHistory] = useState<CoachMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Drawer Resizing & Mobile States
  const [drawerWidth, setDrawerWidth] = useState(450);
  const [isMobile, setIsMobile] = useState(false);
  const isResizingRef = useRef(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const startResizing = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    isResizingRef.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (mouseMoveEvent: MouseEvent) => {
    if (!isResizingRef.current) return;
    const newWidth = window.innerWidth - mouseMoveEvent.clientX;
    // Constrain width between 350px and 800px
    if (newWidth >= 350 && newWidth <= 800) {
      setDrawerWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    isResizingRef.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // Active Task and Analysis
  const activeTask = tasks.find((t) => t.id === activeTaskId);

  // Real-time completed tasks list for instant statistics updates
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);

  useEffect(() => {
    const fetchStatsHistory = async () => {
      try {
        const history = await getCompletedTasks(user);
        setCompletedTasks(history);
      } catch (err) {
        console.warn("Failed to load completed history for stats dashboard:", err);
      }
    };
    fetchStatsHistory();
  }, [user]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, showCoach]);

  // Handle countdown timer, session elapsed time, and break timer ticks
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isTimerRunning && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        setSessionElapsedTime((prev) => prev + 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isTimerRunning, timeLeft]);

  useEffect(() => {
    let breakIntervalId: NodeJS.Timeout | null = null;
    if (sessionCurrentState === "break" && sessionBreakTimeLeft > 0) {
      breakIntervalId = setInterval(() => {
        setSessionBreakTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (breakIntervalId) clearInterval(breakIntervalId);
    };
  }, [sessionCurrentState, sessionBreakTimeLeft]);

  // Load Google Task lists on mount/connection
  const loadGoogleLists = async () => {
    setLoadingGLists(true);
    setGStatusText("Connecting to Google...");
    setGImportError(null);
    try {
      const isAuthenticated = user && !user.isGuest;
      let token = await getAccessToken();

      // If they are NOT authenticated, have no token, and are NOT using sandbox, show the connection UI instead of auto-triggering popup
      if ((!isAuthenticated || !token) && !usingGSandbox) {
        setNeedsGConnection(true);
        setLoadingGLists(false);
        setGStatusText(null);
        return;
      }

      setNeedsGConnection(false);

      const effectiveToken = token || "ya29.mock_token";
      
      setGStatusText("Fetching Task Lists...");
      const lists = await fetchGoogleTaskLists(effectiveToken);
      setGLists(lists);
      if (lists.length > 0) {
        setSelectedGList(lists[0].id);
        setGStatusText("Loading Tasks...");
        await loadGoogleTasks(effectiveToken, lists[0].id);
      }
    } catch (err: any) {
      console.warn("Failed to load Google Task lists:", err);
      let friendlyMessage = "Google account was not connected. You can try again anytime.";
      // Check if it's a cancellation or popup error
      if (err.message && !err.message.includes("Firebase") && !err.message.includes("popup")) {
        friendlyMessage = err.message;
      }
      setGImportError(friendlyMessage);
      setNeedsGConnection(true);
    } finally {
      setLoadingGLists(false);
      setGStatusText(null);
    }
  };

  // Fetch Google Tasks for the selected list
  const loadGoogleTasks = async (token: string, listId: string) => {
    setGImportError(null);
    setGStatusText("Loading Tasks...");
    setLoadingGLists(true);
    try {
      const items = await fetchGoogleTasks(token, listId);
      setGTasks(items);
      setSelectedGTaskIds([]); // Reset selected tasks when list changes
    } catch (err: any) {
      console.warn("Failed to retrieve Google Tasks inside this list:", err);
      setGImportError(err.message || "Failed to retrieve Google Tasks inside this list.");
    } finally {
      setLoadingGLists(false);
      setGStatusText(null);
    }
  };

  // Trigger load if Google Tasks popup opened
  useEffect(() => {
    if (showGImport) {
      loadGoogleLists();
    }
  }, [showGImport]);

  // Handle Google Task list change
  const handleListChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const listId = e.target.value;
    setSelectedGList(listId);
    const token = await getAccessToken();
    await loadGoogleTasks(token || "ya29.mock_token", listId);
  };

  // Connect Google Tasks OAuth
  const handleConnectGTasks = async () => {
    setLoadingGLists(true);
    setGStatusText("Connecting to Google...");
    setGImportError(null);
    try {
      setGStatusText("Requesting Permissions...");
      const res = await googleSignIn();
      if (res && res.accessToken) {
        setNeedsGConnection(false);
        setUsingGSandbox(false);
        
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }

        setGStatusText("Fetching Task Lists...");
        const lists = await fetchGoogleTaskLists(res.accessToken);
        setGLists(lists);
        if (lists.length > 0) {
          setSelectedGList(lists[0].id);
          setGStatusText("Loading Tasks...");
          await loadGoogleTasks(res.accessToken, lists[0].id);
        }
      } else {
        throw new Error("Google account was not connected. You can try again anytime.");
      }
    } catch (err: any) {
      console.warn("Failed to connect Google Tasks:", err);
      let friendlyMessage = "Google account was not connected. You can try again anytime.";
      if (err.message && !err.message.includes("Firebase") && !err.message.includes("popup")) {
        friendlyMessage = err.message;
      }
      setGImportError(friendlyMessage);
      setNeedsGConnection(true);
    } finally {
      setLoadingGLists(false);
      setGStatusText(null);
    }
  };

  // Fallback to Google Tasks Sandbox
  const handleUseGSandbox = () => {
    setUsingGSandbox(true);
    setNeedsGConnection(false);
    setGImportError(null);
    setGStatusText("Loading Sandbox Lists...");
    setLoadingGLists(true);
    // Reload lists after state updates
    setTimeout(() => {
      fetchGoogleTaskLists("ya29.mock_token")
        .then((lists) => {
          setGLists(lists);
          if (lists.length > 0) {
            setSelectedGList(lists[0].id);
            setGStatusText("Loading Sandbox Tasks...");
            fetchGoogleTasks("ya29.mock_token", lists[0].id)
              .then(setGTasks)
              .catch((err) => console.error("Sandbox tasks load failed:", err));
          }
        })
        .catch((err) => {
          console.error("Sandbox fallback failed:", err);
        })
        .finally(() => {
          setLoadingGLists(false);
          setGStatusText(null);
        });
    }, 50);
  };

  // Import task from Google Tasks into form
  const handleImportTask = (gTask: Task) => {
    setTaskTitle(gTask.title);
    setTaskDesc(gTask.description || "");
    setTaskDeadline(gTask.deadline || "");
    setShowGImport(false);
  };

  // Import multiple selected tasks from Google Tasks directly into Fogg AI
  const handleImportSelectedTasks = () => {
    if (selectedGTaskIds.length === 0) return;

    const tasksToImport = gTasks.filter((gt) => selectedGTaskIds.includes(gt.id));
    
    const newFoggTasks: Task[] = tasksToImport.map((gt) => {
      const title = gt.title;
      const desc = gt.description || "Synced from Google Tasks";
      
      const defaultAnalysis: BehaviorAnalysis = {
        psychologicalBarrier: "Task Aversion",
        explanation: `Fogg AI diagnosed "${title}". The size or friction associated with this task triggers avoidance. We have shrunk it to zero-friction to bypass your procrastination loop.`,
        microAction: {
          title: `Spend exactly 2 minutes taking the absolute first step for "${title}".`,
          duration: "2 min",
          instructions: `Open your workspace for "${title}". Do the absolute simplest micro-step (e.g., open the doc, read the first line, or tidy up). You are free to stop after 2 minutes.`
        },
        todayLossWarning: "If you postpone this, you will carry the invisible burden of unfinished business all day, ruining your evening peace.",
        microReward: "+15 Focus Coins & Dopamine Spike",
        identityAffirmation: "I am an active momentum builder who conquers procrastination in 2-minute bursts.",
        recommendedIntervention: "Micro Chunking",
        goalCategory: "General",
        readinessScore: 78,
        confidence: 7,
        reason: "Zero-friction micro-sizing bypasses task aversion and establishes immediate entry point momentum."
      };

      return {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: title,
        description: desc,
        deadline: gt.deadline || undefined,
        status: "analyzed",
        source: "google_tasks",
        googleTaskId: gt.googleTaskId,
        googleTaskListId: gt.googleTaskListId,
        analysis: defaultAnalysis,
      };
    });

    setTasks((prev) => [...newFoggTasks, ...prev]);
    
    // Set active task to the first imported one
    if (newFoggTasks.length > 0) {
      setActiveTaskId(newFoggTasks[0].id);
      setTimeLeft(120);
      setIsTimerRunning(false);
      
      // Load AI coach welcome chat
      const firstTask = newFoggTasks[0];
      setChatHistory([
        {
          id: `coach-init-${Date.now()}`,
          role: "model",
          text: `Hello! I am your **Fogg AI Behavioral Coach**. I see we successfully imported **"${firstTask.title}"** from your Google Tasks. 
          
I have diagnosed the primary barrier as **Task Aversion** (Procrastination Block). 

*Behavioral Strategy:* We have bypassed your procrastination loop by shrinking this task into a 2-minute micro-action. Click **"Start Execution Timer"** to begin!`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }
      ]);
    }

    setSelectedGTaskIds([]);
    setShowGImport(false);
  };

  // Start the adaptive assessment flow
  const startAssessmentFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    setLoadingQuestions(true);
    setError(null);
    setIsAssessmentActive(true);
    setAssessmentGoal({
      title: taskTitle,
      description: taskDesc,
      deadline: taskDeadline
    });
    // Deselect current active task so we can focus on the assessment UI
    setActiveTaskId(null);

    // Instantly detect goal category using lightweight local logic
    const category = detectCategory(taskTitle, taskDesc);
    setAssessmentCategory(category);

    // Instantly retrieve exactly 5 multidimensional questions for this category from local bank
    const questions = getInstantQuestions(category);
    setAssessmentQuestions(questions);
    setCurrentQuestionIdx(0);

    // Initialize answers instantly
    const initialAnswers: Record<string, string> = {};
    questions.forEach((q) => {
      initialAnswers[q.id] = q.type === "slider" ? "5" : (q.choices ? q.choices[0] : "");
    });
    setAssessmentAnswers(initialAnswers);
    setLoadingQuestions(false); // Appear immediately (< 300ms)
  };

  // Submit assessment answers and fetch final behavioral diagnosis
  const submitAssessmentAnswers = async () => {
    if (!assessmentGoal || assessmentQuestions.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const mappedAnswers = assessmentQuestions.map((q) => ({
        questionId: q.id,
        questionText: q.text,
        answer: assessmentAnswers[q.id] !== undefined ? assessmentAnswers[q.id] : (q.type === "slider" ? "5" : (q.choices ? q.choices[0] : ""))
      }));

      const response = await fetch("/api/analyze-task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: assessmentGoal.title,
          description: assessmentGoal.description,
          deadline: assessmentGoal.deadline,
          goalCategory: assessmentCategory,
          answers: mappedAnswers
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to contact behavior psychology service.");
      }

      const analysis: BehaviorAnalysis = await response.json();

      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: assessmentGoal.title,
        description: assessmentGoal.description,
        deadline: assessmentGoal.deadline || undefined,
        status: "analyzed",
        source: "manual",
        analysis,
      };

      setTasks((prev) => [newTask, ...prev]);
      setActiveTaskId(newTask.id);
      setTimeLeft(120); // Reset timer to 2 minutes
      setIsTimerRunning(false);

      // Initialize Continuous Execution Session
      setSessionCompletedSteps([]);
      setSessionTotalSteps(6);
      setSessionCurrentStepNumber(1);
      setSessionElapsedTime(0);
      setSessionMomentumScore(analysis.readinessScore || 50);
      setSessionCurrentState("active");
      setSessionStepFeeling(null);

      // Preload a greeting message in AI Coach chat matching the barrier
      setChatHistory([
        {
          id: "coach-init",
          role: "model",
          text: `Hello! I am your **Fogg AI Behavioral Coach**. I see we are working on **"${assessmentGoal.title}"**. 
          
I have diagnosed the primary barrier as **${analysis.primaryBarrier || analysis.psychologicalBarrier}** (${analysis.secondaryBarrier || 'Procrastination Block'}). 

*Behavioral Context:* ${analysis.reason || 'Based on your quick assessment, we adjusted your execution strategy.'}

Don't worry about finishing the whole project right now. That feels too massive! Instead, let's focus entirely on this simple micro-action: 
👉 **${analysis.microAction.title}** (estimated time: *${analysis.microAction.duration}*).

How are you feeling about doing this simple 2-minute step? Let me know and I will support you!`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      // Clear Form and Assessment inputs
      setTaskTitle("");
      setTaskDesc("");
      setTaskDeadline("");
      setIsAssessmentActive(false);
      setAssessmentGoal(null);
      setAssessmentQuestions([]);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during AI analysis.");
    } finally {
      setLoading(false);
    }
  }  // Execute and complete active isolated micro-step inside continuous session
  const handleCompleteAction = () => {
    if (!activeTask) return;

    // Trigger canvas confetti celebrate!
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
    });

    // Record the completed micro-step title
    const currentStepTitle = activeTask.analysis?.microAction?.title || "Completed micro-action";
    if (!sessionCompletedSteps.includes(currentStepTitle)) {
      setSessionCompletedSteps((prev) => [...prev, currentStepTitle]);
    }

    // Award immediate step coins (+15 Focus Coins)
    const coinsReward = 15;
    const nextStats: UserStats = {
      focusCoins: stats.focusCoins + coinsReward,
      streak: stats.streak + 1,
      tasksCompletedCount: stats.tasksCompletedCount + 1,
      lastCompletedDate: new Date().toISOString(),
    };
    onUpdateStats(nextStats);

    // Stop step timer
    setIsTimerRunning(false);

    // Calculate elapsed step time
    const elapsedSeconds = 120 - timeLeft;
    const stepTime = elapsedSeconds > 0 ? elapsedSeconds : 45;
    setSessionElapsedTime((prev) => prev + stepTime);

    // Log step success in the AI Coach chat
    setChatHistory((prev) => [
      ...prev,
      {
        id: `coach-success-${Date.now()}`,
        role: "model",
        text: `🎉 **GREAT JOB!** You successfully completed execution step **#${sessionCurrentStepNumber}**!
        
You have just earned **+${coinsReward} Focus Coins** and boosted your session momentum. Let's record how your brain feels right now.`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    // Transition to step reflection screen
    setSessionCurrentState("reflection");
  };

  // Record user reflection feeling after completing a step
  const handleSelectReflection = (feeling: string) => {
    setSessionStepFeeling(feeling);

    // Calibrate momentum score based on feeling
    let momentumDelta = 10;
    if (feeling === "Easy") {
      momentumDelta = 15;
    } else if (feeling === "Difficult" || feeling === "Very Difficult") {
      momentumDelta = 5;
    }
    setSessionMomentumScore((prev) => Math.min(100, prev + momentumDelta));

    setChatHistory((prev) => [
      ...prev,
      {
        id: `coach-reflect-${Date.now()}`,
        role: "model",
        text: `💡 **Reflective feedback received.** You noted that this step felt **${feeling}**. 
        
I've recorded this in your session profile. I'll dynamically adapt the complexity and friction of your next micro-actions to match your cognitive stamina!`,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);

    // Go to next choice menu
    setSessionCurrentState("next_choice");
  };

  // Trigger Gemini or fallback to generate only the next micro-step
  const handleGenerateNextAction = async () => {
    if (!activeTask) return;

    setSessionCurrentState("generating");
    setLoadingNextStep(true);

    try {
      const response = await fetch("/api/generate-next-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalGoal: activeTask.title,
          description: activeTask.description,
          deadline: activeTask.deadline,
          goalCategory: assessmentCategory || activeTask.analysis?.goalCategory || "Other",
          behavioralDiagnosis: {
            primaryBarrier: activeTask.analysis?.primaryBarrier || activeTask.analysis?.psychologicalBarrier,
            secondaryBarrier: activeTask.analysis?.secondaryBarrier,
            readinessScore: activeTask.analysis?.readinessScore || 50,
            explanation: activeTask.analysis?.explanation
          },
          previousCompletedSteps: sessionCompletedSteps,
          lastStepFeeling: sessionStepFeeling || "Neutral",
          currentStepNumber: sessionCurrentStepNumber + 1
        })
      });

      if (!response.ok) {
        throw new Error("Unable to generate the next micro-step.");
      }

      const data = await response.json();

      // Update activeTask's analysis with the next step
      const updatedTasks = tasks.map((t) => {
        if (t.id === activeTask.id) {
          const updatedAnalysis = {
            ...t.analysis,
            microAction: data.microAction,
            todayLossWarning: data.todayLossWarning || t.analysis?.todayLossWarning,
            microReward: data.microReward || t.analysis?.microReward,
            identityAffirmation: data.identityAffirmation || t.analysis?.identityAffirmation
          };
          return { ...t, analysis: updatedAnalysis };
        }
        return t;
      });
      setTasks(updatedTasks);

      // Increment step number
      setSessionCurrentStepNumber((prev) => prev + 1);
      
      // Grow total steps if we go beyond the initial estimate
      if (sessionCurrentStepNumber + 1 > sessionTotalSteps) {
        setSessionTotalSteps((prev) => prev + 2);
      }

      // Add coach announcement
      setChatHistory((prev) => [
        ...prev,
        {
          id: `coach-next-step-${Date.now()}`,
          role: "model",
          text: `🤖 **Step #${sessionCurrentStepNumber + 1} Calibrated!** 
          
Based on your feedback that the previous step was *${sessionStepFeeling}*, I've crafted a perfectly tailored next micro-action:
👉 **${data.microAction.title}**

*Coaching Guidance:* ${data.microAction.instructions}`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);

      // Reset step timer & start
      setTimeLeft(120);
      setIsTimerRunning(true);
      setSessionCurrentState("active");
    } catch (err: any) {
      console.warn("Error generating next step, falling back to local simulation:", err);
      // Fallback
      setSessionCurrentState("active");
    } finally {
      setLoadingNextStep(false);
    }
  };

  // Complete the entire overall goal and display grand celebration
  const handleCompleteEntireGoal = () => {
    if (!activeTask) return;

    // Trigger canvas confetti celebrate!
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.5 },
    });

    const updatedTasks = tasks.map((t) => {
      if (t.id === activeTask.id) {
        return { ...t, status: "completed" as const, completedAt: new Date().toISOString() };
      }
      return t;
    });

    setTasks(updatedTasks);

    // Huge reward of +180 focus coins!
    const coinsReward = 180;
    const nextStats: UserStats = {
      focusCoins: stats.focusCoins + coinsReward,
      streak: stats.streak + 1,
      tasksCompletedCount: stats.tasksCompletedCount + 1,
      lastCompletedDate: new Date().toISOString(),
    };

    onUpdateStats(nextStats);

    // Save persistent completion record in Firebase/LocalStore
    const completedRecord = {
      id: activeTask.id,
      userId: user ? user.uid : "guest",
      title: activeTask.title,
      category: assessmentCategory || activeTask.analysis?.goalCategory || "General",
      description: activeTask.description || "No description provided",
      deadline: activeTask.deadline || "No deadline set",
      createdAt: new Date(Date.now() - (sessionElapsedTime * 1000)).toISOString(),
      completedAt: new Date().toISOString(),
      executionTime: sessionElapsedTime,
      microStepsCompleted: sessionCompletedSteps.length,
      readinessScore: 95, // Culmination of success!
      primaryBarrier: activeTask.analysis?.primaryBarrier || activeTask.analysis?.psychologicalBarrier || "Perfectionism",
      secondaryBarrier: activeTask.analysis?.secondaryBarrier || "Procrastination Block",
      intervention: activeTask.analysis?.recommendedIntervention || "Micro Chunking",
      status: "completed" as const,
      coinsEarned: coinsReward,
      streakEarned: true,
      coachSummary: `Successfully decimated procrastination over ${sessionCompletedSteps.length} progressive micro-steps with an ending momentum of ${sessionMomentumScore}%.`
    };

    saveCompletedTask(user, completedRecord).then(() => {
      setCompletedTasks((prev) => [completedRecord, ...prev]);
    }).catch((err) => {
      console.warn("Failed to save final completed task to database:", err);
      setCompletedTasks((prev) => [completedRecord, ...prev]);
    });

    setSessionCurrentState("completed");
  };

  // Send message to AI Coach
  const handleSendCoachMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || sendingChat || !activeTask) return;

    const userMsg: CoachMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: chatInput,
      timestamp: new Date().toLocaleTimeString(),
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setChatInput("");
    setSendingChat(true);

    try {
      const response = await fetch("/api/coach-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          history: chatHistory,
          task: activeTask,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to contact AI Coach.");
      }

      const reply = await response.json();

      setChatHistory((prev) => [
        ...prev,
        {
          id: `model-${Date.now()}`,
          role: "model",
          text: reply.text,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "model",
          text: "My apologies, my neural cognitive pathways are currently experiencing friction. Try talking to me in a moment!",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setSendingChat(false);
    }
  };

  // Format timer countdown
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const formatElapsedTime = (totalSeconds: number) => {
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes < 60) {
      return `${minutes}m ${seconds}s`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Dynamic metrics computed from persistent memory history
  const todayCompleted = completedTasks.filter((t) => {
    const d = new Date(t.completedAt);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  }).length;

  const weeklyCompleted = completedTasks.filter((t) => {
    const d = new Date(t.completedAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d.getTime() > weekAgo.getTime();
  }).length;

  const totalReadinessScoreSum = completedTasks.reduce((acc, t) => acc + (t.readinessScore || 75), 0);
  const avgReadiness = completedTasks.length > 0 ? Math.round(totalReadinessScoreSum / completedTasks.length) : 85;

  const behaviorImprovementPercentage = completedTasks.length > 0 
    ? Math.min(100, completedTasks.length * 12)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Welcome Dashboard Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100 mb-1.5 uppercase tracking-wider">
              Companion Center
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Hello, {user?.displayName ? user.displayName.split(" ")[0] : "Practitioner"}
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-normal">
              Your Fogg AI engine is active. Let's analyze a goal and build behavioral momentum.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="import-google-tasks-btn"
              onClick={() => setShowGImport(true)}
              className="flex items-center gap-2 rounded-xl bg-indigo-50/80 hover:bg-indigo-150/90 border border-indigo-200/80 hover:border-indigo-400 px-4 py-2 text-xs font-bold text-indigo-700 hover:text-indigo-800 transition-all cursor-pointer shadow-sm active:scale-95 duration-150"
            >
              <FolderSync className="h-4 w-4 text-indigo-600 animate-pulse" />
              {user?.isGuest ? "Connect Google Tasks" : "Import Google Tasks"}
            </button>
          </div>
        </div>

        {/* Real-time Dynamic Behavioral Dashboard Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Today's Done</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">{todayCompleted}</span>
              <span className="text-[9px] text-slate-400 block mt-1">micro-actions today</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Weekly Done</span>
              <Calendar className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">{weeklyCompleted}</span>
              <span className="text-[9px] text-slate-400 block mt-1">completed this week</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Focus Coins</span>
              <Coins className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">{stats.focusCoins}</span>
              <span className="text-[9px] text-amber-600 font-bold block mt-1">+{stats.focusCoins - 100 > 0 ? stats.focusCoins - 100 : 0} balance increase</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current Streak</span>
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">{stats.streak}d</span>
              <span className="text-[9px] text-orange-600 font-bold block mt-1">active streak count</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Readiness Trend</span>
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-indigo-700 tracking-tight font-mono">{avgReadiness}%</span>
              <span className="text-[9px] text-indigo-600 font-bold block mt-1">
                {avgReadiness >= 75 ? "Optimal State" : "Increasing Flow"}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Improvement</span>
              <Brain className="h-4 w-4 text-violet-500" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-violet-700 tracking-tight font-mono">
                {behaviorImprovementPercentage > 0 ? `+${behaviorImprovementPercentage}%` : "Stable"}
              </span>
              <span className="text-[9px] text-violet-600 font-bold block mt-1">
                {behaviorImprovementPercentage > 0 ? "momentum shift" : "baseline established"}
              </span>
            </div>
          </div>
        </div>

        {/* Outer Grid Layout */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          
          {/* Left Column: Form & Lists (Lg: 5cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Task Diagnosis Form */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-50/50 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-4.5 w-4.5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">Analyze a Daunting Goal</h3>
              </div>

              <form onSubmit={startAssessmentFlow} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    What are you procrastinating on?
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Write performance self-assessment"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Description & Cognitive Friction (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Why does it feel heavy? (Too long, boring, perfectionist block...)"
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Task Deadline
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={taskDeadline}
                      onChange={(e) => setTaskDeadline(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-100 p-2.5 rounded-lg">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-semibold text-white cursor-pointer shadow-md shadow-indigo-600/10 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>AI Diagnosis Engine Active...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Continue Assessment</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Tasks Queue List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 tracking-wider uppercase">Active Execution Queue</h4>
              
              {tasks.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-white text-slate-500">
                  <p className="text-xs font-semibold">No active tasks being analyzed.</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-normal">Submit a task above or import from Google Tasks to diagnose.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => {
                        setActiveTaskId(task.id);
                        setTimeLeft(120);
                        setIsTimerRunning(false);
                      }}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-start justify-between cursor-pointer shadow-sm ${
                        activeTaskId === task.id
                          ? "border-indigo-500/50 bg-indigo-50/40 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="space-y-1 pr-4">
                        <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest block">
                          {task.analysis?.psychologicalBarrier || "Diagnosed Goal"}
                        </span>
                        <h5 className={`text-xs font-bold text-slate-800 line-clamp-1 ${task.status === "completed" ? "line-through text-slate-400 font-normal" : ""}`}>
                          {task.title}
                        </h5>
                        <p className="text-[10px] text-slate-500 line-clamp-1 font-normal">
                          {task.description || "Psychologist-engineered micro-steps ready."}
                        </p>
                      </div>

                      {task.status === "completed" ? (
                        <div className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-3 w-3" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full border border-slate-200 flex items-center justify-center shrink-0 text-[10px] text-slate-400 bg-white hover:border-indigo-400">
                          ▶
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Execution Pane & AI Coach (Lg: 7cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {isAssessmentActive ? (
              <motion.div
                key="assessment-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="rounded-2xl border border-white/30 bg-white/40 backdrop-blur-xl p-8 space-y-6 shadow-xl relative overflow-hidden text-slate-800"
              >
                {/* Background soft glowing orb */}
                <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Header */}
                <div className="space-y-1 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shadow-sm">
                      <Brain className="h-5 w-5" />
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                      🧠 Help me understand what's blocking you
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 font-normal pl-9">
                    Answer these 5 quick questions so our AI psychologist can calibrate your behavioral roadmap.
                  </p>
                </div>

                {loadingQuestions ? (
                  <div className="py-16 flex flex-col items-center justify-center space-y-4">
                    <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
                    <p className="text-xs text-slate-500 font-medium animate-pulse">
                      Analyzing goal structure and tailoring questions...
                    </p>
                  </div>
                ) : assessmentQuestions.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No questions generated. Try refreshing or typing a different goal.
                  </div>
                ) : (
                  <div className="space-y-6 relative z-10">
                    {/* Progress indicator */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                        <span>Step {currentQuestionIdx + 1} of {assessmentQuestions.length}</span>
                        <span className="text-[10px] text-indigo-600 font-extrabold bg-indigo-50 border border-indigo-100/50 px-2.5 py-0.5 rounded-full">
                          ⏱️ Est. remaining: {(5 - currentQuestionIdx) * 15}s
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                          style={{ width: `${((currentQuestionIdx + 1) / assessmentQuestions.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Question Text with transition */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentQuestionIdx}
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -15 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <span className="text-[9px] font-extrabold text-indigo-600 tracking-wider uppercase block bg-indigo-50/50 border border-indigo-100/30 w-fit px-2 py-0.5 rounded animate-pulse">
                          🎯 {assessmentQuestions[currentQuestionIdx]?.dimension || "focus"} dimension
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-800 tracking-tight leading-relaxed">
                          {assessmentQuestions[currentQuestionIdx]?.text}
                        </h4>

                        {/* Interactive question field based on type */}
                        {assessmentQuestions[currentQuestionIdx]?.type === "slider" ? (
                          <div className="space-y-6 py-4">
                            <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                {assessmentQuestions[currentQuestionIdx]?.minLabel || "Low"}
                              </span>
                              <span className="text-xl font-extrabold text-indigo-600 font-mono">
                                {assessmentAnswers[assessmentQuestions[currentQuestionIdx]?.id] || "5"}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                {assessmentQuestions[currentQuestionIdx]?.maxLabel || "High"}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={assessmentQuestions[currentQuestionIdx]?.min || 1}
                              max={assessmentQuestions[currentQuestionIdx]?.max || 10}
                              value={assessmentAnswers[assessmentQuestions[currentQuestionIdx]?.id] || "5"}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAssessmentAnswers(prev => ({
                                  ...prev,
                                  [assessmentQuestions[currentQuestionIdx].id]: val
                                }));
                              }}
                              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 font-bold px-0.5">
                              {[...Array(assessmentQuestions[currentQuestionIdx]?.max || 10)].map((_, i) => (
                                <span key={i}>{i + 1}</span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="grid gap-2.5">
                            {assessmentQuestions[currentQuestionIdx]?.choices?.map((choice: string, idx: number) => {
                              const isSelected = assessmentAnswers[assessmentQuestions[currentQuestionIdx]?.id] === choice;
                              return (
                                <button
                                  type="button"
                                  key={idx}
                                  onClick={() => {
                                    setAssessmentAnswers(prev => ({
                                      ...prev,
                                      [assessmentQuestions[currentQuestionIdx].id]: choice
                                    }));
                                  }}
                                  className={`w-full text-left p-3.5 rounded-xl border-2 text-xs font-semibold tracking-tight transition-all flex items-center justify-between cursor-pointer ${
                                    isSelected
                                      ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 shadow-sm"
                                      : "border-slate-150 bg-white text-slate-700 hover:border-slate-350 hover:bg-slate-50/50"
                                  }`}
                                >
                                  <span>{choice}</span>
                                  <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                                    isSelected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white"
                                  }`}>
                                    {isSelected && <span className="text-[9px] font-extrabold">✓</span>}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>

                    {/* Navigation Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-150">
                      <button
                        type="button"
                        onClick={() => {
                          if (currentQuestionIdx > 0) {
                            setCurrentQuestionIdx(prev => prev - 1);
                          } else {
                            // Cancel assessment
                            setIsAssessmentActive(false);
                            setAssessmentGoal(null);
                            setAssessmentQuestions([]);
                          }
                        }}
                        className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        {currentQuestionIdx > 0 ? "Previous" : "Cancel"}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={
                            assessmentQuestions[currentQuestionIdx]?.type === "choice" &&
                            !assessmentAnswers[assessmentQuestions[currentQuestionIdx]?.id]
                          }
                          onClick={() => {
                            const qId = assessmentQuestions[currentQuestionIdx]?.id;
                            if (assessmentQuestions[currentQuestionIdx]?.type === "slider" && !assessmentAnswers[qId]) {
                              setAssessmentAnswers(prev => ({ ...prev, [qId]: "5" }));
                            }

                            if (currentQuestionIdx < assessmentQuestions.length - 1) {
                              setCurrentQuestionIdx(prev => prev + 1);
                            } else {
                              submitAssessmentAnswers();
                            }
                          }}
                          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white cursor-pointer disabled:opacity-50 transition-all shadow-md"
                        >
                          {currentQuestionIdx < assessmentQuestions.length - 1 ? (
                            <>
                              <span>Next Question</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>Analyze Barriers & Prescribe</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : activeTask ? (
              <div className="space-y-6">
                
                {/* Premium Behavioral Diagnosis Dashboard */}
                <motion.div
                  key={`dashboard-${activeTask.id}`}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/10 p-6 space-y-6 shadow-xl relative overflow-hidden"
                >
                  {/* Background Soft Glows */}
                  <div className="absolute -top-12 -right-12 h-48 w-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-12 -left-12 h-48 w-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Top Meta Header */}
                  {sessionCurrentState === "completed" ? (
                    /* GLORIOUS CELEBRATION DASHBOARD */
                    <div className="py-8 px-4 text-center space-y-6 relative z-10">
                      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 animate-bounce shadow-md">
                        <Trophy className="h-10 w-10 text-emerald-600" />
                      </div>
                      <div className="space-y-2 max-w-lg mx-auto">
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">🎉 Goal Decimated!</h2>
                        <p className="text-sm text-slate-500 font-semibold uppercase tracking-widest text-indigo-600 font-mono">
                          {activeTask.title}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          You successfully overcame starting friction, created immense momentum, and completed your journey step-by-step.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto pt-4">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-150 shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Steps Crushed</span>
                          <span className="text-xl font-extrabold text-slate-800 font-mono">{sessionCompletedSteps.length}</span>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-150 shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Time Invested</span>
                          <span className="text-xl font-extrabold text-slate-800 font-mono">{formatElapsedTime(sessionElapsedTime)}</span>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-150 shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Ending Momentum</span>
                          <span className="text-xl font-extrabold text-emerald-600 font-mono">{sessionMomentumScore}%</span>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-150 shadow-sm text-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Dopamine Reward</span>
                          <span className="text-xl font-extrabold text-amber-500 font-mono">+180 Coins</span>
                        </div>
                      </div>

                      <div className="max-w-md mx-auto p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-left space-y-1">
                        <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-widest block">Psychologist Insight</span>
                        <p className="text-xs text-indigo-950 font-normal leading-relaxed">
                          By breaking your grand goal into high-ability micro-steps, you bypassed your amygdala's fear center and built sustainable cognitive habits. You are an action-taker.
                        </p>
                      </div>

                      <div className="pt-6">
                        <button
                          onClick={() => {
                            // Close active task session
                            setActiveTaskId(null);
                            setSessionCurrentState("active");
                          }}
                          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer hover:-translate-y-0.5"
                        >
                          Finish & Return to Dashboard
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* NORMAL SESSION ENGAGEMENT FLOW */
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 relative z-10">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 shadow-sm shrink-0">
                            <Brain className="h-5 w-5 animate-pulse" />
                          </span>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">AI DIAGNOSIS COMPLETED</span>
                            <h3 className="font-extrabold text-sm text-slate-800 tracking-tight line-clamp-1">
                              {activeTask.title}
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {activeTask.analysis?.goalCategory && (
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-50/50 border border-indigo-100/30 text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">
                              🎯 {activeTask.analysis.goalCategory}
                            </span>
                          )}
                          
                          {/* Risk Level Badge */}
                          {(() => {
                            const score = activeTask.analysis?.readinessScore || 50;
                            let text = "Moderate Risk";
                            let colorClass = "bg-amber-50 text-amber-600 border-amber-100";
                            if (score < 45) {
                              text = "Severe Risk";
                              colorClass = "bg-rose-50 text-rose-600 border-rose-100 animate-pulse";
                            } else if (score >= 75) {
                              text = "Low Risk";
                              colorClass = "bg-emerald-50 text-emerald-600 border-emerald-100";
                            }
                            return (
                              <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-extrabold uppercase tracking-wider ${colorClass}`}>
                                ⚠️ {text}
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Continuous Execution Progress Cockpit */}
                      <div className="bg-slate-950 text-white rounded-xl p-4 shadow-md border border-slate-800 space-y-3 relative overflow-hidden z-10">
                        <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
                        
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] text-slate-300 font-extrabold uppercase tracking-widest">ACTIVE EXECUTION SESSION</span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                            <span>⏱️ Time Elapsed: <strong className="text-white font-mono">{formatElapsedTime(sessionElapsedTime)}</strong></span>
                            <span>🔥 Momentum Score: <strong className="text-indigo-400 font-mono">{sessionMomentumScore}%</strong></span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1">
                          <div className="space-y-1">
                            <div className="flex justify-between items-baseline text-xs">
                              <span className="font-semibold text-slate-300">
                                Step <strong className="text-indigo-400 font-mono text-sm">{sessionCurrentStepNumber}</strong> of <strong className="text-slate-400 font-mono text-xs">{sessionTotalSteps}</strong>
                              </span>
                              <span className="font-mono text-[11px] font-bold text-slate-400">
                                {Math.round((sessionCompletedSteps.length / sessionTotalSteps) * 100)}% Complete
                              </span>
                            </div>
                            
                            {/* Dynamic Textual Progress Bar */}
                            <div className="flex gap-0.5 font-mono text-xs text-indigo-400 tracking-tighter overflow-hidden select-none">
                              {Array.from({ length: sessionTotalSteps }).map((_, idx) => {
                                if (idx < sessionCompletedSteps.length) {
                                  return <span key={idx} className="text-emerald-400">█</span>;
                                } else if (idx === sessionCompletedSteps.length) {
                                  return <span key={idx} className="text-indigo-400 animate-pulse">▒</span>;
                                } else {
                                  return <span key={idx} className="text-slate-700">░</span>;
                                }
                              })}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-[11px]">
                            <span className="text-slate-400 font-medium line-clamp-1">
                              Goal: <strong className="text-white font-bold">{activeTask.title}</strong>
                            </span>
                            <span className="text-indigo-400 font-bold shrink-0">
                              🏆 +{sessionCompletedSteps.length * 15} Coins
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Primary Grid: Barrier & Score Gauge */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 relative z-10">
                        {/* Primary Barrier Card */}
                        <div className="md:col-span-7 p-4 rounded-xl bg-white/60 border border-slate-150 shadow-sm space-y-2.5">
                          <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider block">Primary Barrier</span>
                          <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">
                            {activeTask.analysis?.psychologicalBarrier || activeTask.analysis?.primaryBarrier || "Cognitive Overload"}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                            {activeTask.analysis?.explanation || "Your brain is perceiving this task as a daunting effort and is trying to protect you from discomfort."}
                          </p>
                          {activeTask.analysis?.secondaryBarrier && (
                            <div className="pt-1 flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                              <span>Secondary:</span>
                              <span className="text-indigo-600">{activeTask.analysis.secondaryBarrier}</span>
                            </div>
                          )}
                        </div>

                        {/* Readiness Score circular-style visual gauge */}
                        <div className="md:col-span-5 p-4 rounded-xl bg-gradient-to-br from-indigo-900/90 to-slate-900 text-white shadow-md flex flex-col justify-between space-y-3 relative overflow-hidden">
                          <div className="absolute top-0 right-0 h-16 w-16 bg-white/5 rounded-full blur-xl pointer-events-none" />
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-indigo-200 uppercase tracking-wider">Readiness Score</span>
                            <TrendingUp className="h-3.5 w-3.5 text-indigo-300" />
                          </div>
                          
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-4xl font-extrabold tracking-tight font-mono text-white">
                              {activeTask.analysis?.readinessScore || 50}
                            </span>
                            <span className="text-indigo-200 text-xs font-semibold font-mono">/100</span>
                          </div>

                          <div className="space-y-1">
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-400 to-violet-400"
                                style={{ width: `${activeTask.analysis?.readinessScore || 50}%` }}
                              />
                            </div>
                            <span className="text-[9px] text-indigo-200 font-bold uppercase tracking-wider block font-sans">
                              {(() => {
                                const score = activeTask.analysis?.readinessScore || 50;
                                if (score < 45) return "Critical Starting Resistance";
                                if (score < 75) return "Moderate Execution Potential";
                                return "Optimal Execution State";
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Loss-Aversion Callout */}
                      {activeTask.analysis?.todayLossWarning && (
                        <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100 text-rose-800 space-y-1.5 relative z-10 shadow-sm">
                          <div className="flex items-center gap-2 text-rose-700">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span className="text-[10px] font-extrabold uppercase tracking-wider">Today's Loss Warning (Loss Aversion)</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-rose-600 font-semibold pl-6">
                            {activeTask.analysis.todayLossWarning}
                          </p>
                        </div>
                      )}

                      {/* Progressive Action Container */}
                      <div className="p-5 rounded-xl bg-white border border-indigo-100 shadow-md space-y-4 relative z-10 overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
                        
                        {sessionCurrentState === "active" && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
                                <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest">Next Best Action (BJ Fogg B=MAP)</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase bg-slate-50 border border-slate-150 px-2.5 py-0.5 rounded-full font-sans">
                                ⏱️ {activeTask.analysis?.microAction?.duration || "2 min"} effort
                              </span>
                            </div>

                            <div className="space-y-1">
                              <h4 className="text-base font-extrabold text-slate-900 tracking-tight">
                                {activeTask.analysis?.microAction?.title || "Take a single small action"}
                              </h4>
                              <p className="text-xs text-slate-500 leading-normal font-normal">
                                {activeTask.analysis?.microAction?.instructions || "Open your materials and focus for just two minutes."}
                              </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-150 shadow-inner">
                              <div className="flex items-center gap-3">
                                <span className="p-2 rounded-lg bg-white border border-slate-200 text-indigo-600 shadow-sm shrink-0">
                                  <Timer className="h-6 w-6 animate-pulse" />
                                </span>
                                <div>
                                  <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Time Budget</span>
                                  <span className="font-mono text-xl font-extrabold text-slate-800">{formatTime(timeLeft)}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                                  className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-950 cursor-pointer transition-all shadow-sm flex items-center justify-center"
                                  title={isTimerRunning ? "Pause Timer" : "Start Timer"}
                                >
                                  {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                </button>
                                <button
                                  onClick={() => {
                                    setIsTimerRunning(false);
                                    setTimeLeft(120);
                                  }}
                                  className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-700 cursor-pointer transition-all shadow-sm flex items-center justify-center"
                                  title="Reset Timer"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </button>

                                <button
                                  onClick={handleCompleteAction}
                                  className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/10 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                                >
                                  Mark Step Done!
                                </button>
                              </div>
                            </div>

                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                              <div
                                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000"
                                  style={{ width: `${(timeLeft / 120) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {sessionCurrentState === "reflection" && (
                          <div className="space-y-4 py-2">
                            <div className="text-center space-y-1.5">
                              <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">How did this step feel?</h4>
                              <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                                Be honest. Fogg AI dynamically adjusts the scope and cognitive friction of your next micro-action based on your brain's current energy state.
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
                              {[
                                { text: "Easy", icon: "😀" },
                                { text: "Manageable", icon: "🙂" },
                                { text: "Neutral", icon: "😐" },
                                { text: "Difficult", icon: "😓" },
                                { text: "Very Difficult", icon: "😫" }
                              ].map((item) => (
                                <button
                                  key={item.text}
                                  onClick={() => handleSelectReflection(item.text)}
                                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 transition-all text-center cursor-pointer flex flex-col items-center gap-1.5"
                                >
                                  <span className="text-2xl">{item.icon}</span>
                                  <span className="text-[10px] font-bold text-slate-600">{item.text}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {sessionCurrentState === "next_choice" && (
                          <div className="space-y-4 py-2">
                            <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-3 text-emerald-800 space-y-1">
                              <h4 className="font-extrabold text-xs flex items-center gap-1.5">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                Great job! Completed Step #{sessionCompletedSteps.length}!
                              </h4>
                              <p className="text-[11px] text-emerald-600 font-semibold pl-5">
                                Momentum has been created. Let's keep moving.
                              </p>
                            </div>

                            <div className="space-y-2">
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">Choose Your Next Move</span>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <button
                                  onClick={handleGenerateNextAction}
                                  className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-300 text-left transition-all cursor-pointer flex items-center gap-3"
                                >
                                  <span className="p-1.5 rounded-lg bg-indigo-600 text-white text-xs">▶</span>
                                  <div>
                                    <span className="text-[10px] font-extrabold text-indigo-700 block">Continue Step-by-Step</span>
                                    <span className="text-[9px] text-slate-500 font-normal">Generate my next micro-action</span>
                                  </div>
                                </button>

                                <button
                                  onClick={() => {
                                    setSessionBreakTimeLeft(300);
                                    setSessionCurrentState("break");
                                  }}
                                  className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-left transition-all cursor-pointer flex items-center gap-3"
                                >
                                  <span className="p-1.5 rounded-lg bg-amber-100 text-amber-600 text-xs">☕</span>
                                  <div>
                                    <span className="text-[10px] font-extrabold text-slate-700 block">Take a Short Break</span>
                                    <span className="text-[9px] text-slate-500 font-normal">5-minute mindfulness breathing</span>
                                  </div>
                                </button>

                                <button
                                  onClick={() => {
                                    setSessionCurrentState("schedule");
                                  }}
                                  className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-left transition-all cursor-pointer flex items-center gap-3"
                                >
                                  <span className="p-1.5 rounded-lg bg-violet-100 text-violet-600 text-xs">📅</span>
                                  <div>
                                    <span className="text-[10px] font-extrabold text-slate-700 block">Schedule Next Action</span>
                                    <span className="text-[9px] text-slate-500 font-normal">Integrate with calendar/reminders</span>
                                  </div>
                                </button>

                                <button
                                  onClick={() => {
                                    setSessionCurrentState("stuck");
                                  }}
                                  className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-left transition-all cursor-pointer flex items-center gap-3"
                                >
                                  <span className="p-1.5 rounded-lg bg-rose-100 text-rose-600 text-xs">😕</span>
                                  <div>
                                    <span className="text-[10px] font-extrabold text-slate-700 block">I'm Feeling Stuck</span>
                                    <span className="text-[9px] text-slate-500 font-normal">Get AI Coach alignment support</span>
                                  </div>
                                </button>
                              </div>

                              <div className="pt-2">
                                <button
                                  onClick={handleCompleteEntireGoal}
                                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-[11px] tracking-wide uppercase transition-all shadow-md cursor-pointer text-center"
                                >
                                  🏆 I've fully completed my overall goal!
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {sessionCurrentState === "generating" && (
                          <div className="py-8 text-center space-y-4">
                            <span className="inline-flex p-3 rounded-full bg-indigo-50 text-indigo-600 animate-pulse">
                              <Brain className="h-8 w-8 animate-bounce text-indigo-600" />
                            </span>
                            <div className="space-y-1 max-w-xs mx-auto">
                              <h4 className="font-extrabold text-sm text-slate-900 tracking-tight">Calibrating next micro-step...</h4>
                              <p className="text-[11px] text-slate-400 font-normal">
                                Fogg AI is tailoring your next step based on your feeling of "{sessionStepFeeling}" to keep cognitive load at absolute zero.
                              </p>
                            </div>
                          </div>
                        )}

                        {sessionCurrentState === "break" && (
                          <div className="py-6 text-center space-y-4">
                            <span className="inline-flex p-3 rounded-full bg-amber-50 text-amber-600">
                              ☕
                            </span>
                            <div className="space-y-1.5 max-w-xs mx-auto">
                              <h4 className="font-extrabold text-sm text-slate-900">Mindfulness Break Active</h4>
                              <p className="text-2xl font-mono font-extrabold text-slate-800">{formatTime(sessionBreakTimeLeft)}</p>
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                Close your eyes, stretch, or take 3 deep breaths. Momentum is sustained by respecting your cognitive batteries.
                              </p>
                            </div>
                            <div className="pt-2 flex justify-center gap-2">
                              <button
                                onClick={() => setSessionCurrentState("next_choice")}
                                className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer"
                              >
                                Skip Break & Resume
                              </button>
                            </div>
                          </div>
                        )}

                        {sessionCurrentState === "schedule" && (
                          <div className="p-2 space-y-4 text-left">
                            <div className="space-y-1">
                              <h4 className="text-xs font-extrabold text-slate-900">📅 Schedule Next Action</h4>
                              <p className="text-[11px] text-slate-500">Pick a time to hold yourself accountable. We'll hold your momentum safe until then.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">Date</label>
                                <input
                                  type="date"
                                  value={sessionScheduleDate}
                                  onChange={(e) => setSessionScheduleDate(e.target.value)}
                                  className="w-full p-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-slate-50"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">Time</label>
                                <input
                                  type="time"
                                  value={sessionScheduleTime}
                                  onChange={(e) => setSessionScheduleTime(e.target.value)}
                                  className="w-full p-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-slate-50"
                                />
                              </div>
                            </div>

                            <div className="flex gap-2 justify-end pt-2">
                              <button
                                onClick={() => setSessionCurrentState("next_choice")}
                                className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-[11px] cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  alert(`Successfully scheduled step for ${sessionScheduleDate} at ${sessionScheduleTime}! Reminder registered.`);
                                  setSessionCurrentState("next_choice");
                                }}
                                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] cursor-pointer"
                              >
                                Lock It In
                              </button>
                            </div>
                          </div>
                        )}

                        {sessionCurrentState === "stuck" && (
                          <div className="py-6 text-center space-y-4">
                            <span className="inline-flex p-3 rounded-full bg-rose-50 text-rose-600">
                              😕
                            </span>
                            <div className="space-y-1.5 max-w-sm mx-auto">
                              <h4 className="font-extrabold text-sm text-slate-900">Hit a Resistance Wall?</h4>
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                No problem! Procrastination is a physiological response, not a moral failure. Ask your **Behavior Psychologist Coach** in the sidebar to rewrite this action, or try an even easier alternative below.
                              </p>
                            </div>
                            <div className="pt-2 flex justify-center gap-2">
                              <button
                                onClick={() => setSessionCurrentState("next_choice")}
                                className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer"
                              >
                                Back to Options
                              </button>
                              <button
                                onClick={() => {
                                  // Simplify
                                  if (activeTask.analysis?.microAction) {
                                    activeTask.analysis.microAction.title = "Read just ONE sentence or open ONE tab";
                                    activeTask.analysis.microAction.instructions = "Literally just open the file. Nothing more. Bypassing Starting Friction is our priority.";
                                  }
                                  setSessionCurrentState("active");
                                }}
                                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer"
                              >
                                Simplify Step Further
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Identity Reinforcement Text */}
                  {activeTask.analysis?.identityAffirmation && (
                    <p className="text-[10px] text-slate-400 flex items-center gap-2 font-bold uppercase tracking-wider relative z-10 pl-1 font-sans">
                      <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
                      <span>Identity Habit: <strong className="text-slate-600 font-bold">{activeTask.analysis.identityAffirmation}</strong></span>
                    </p>
                  )}
                </motion.div>

                {/* AI Psychologist Coach Prompt Card */}
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/20 via-white to-violet-50/10 p-6 space-y-4 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-left flex-1">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4.5 w-4.5 text-indigo-600" />
                      <h4 className="font-extrabold text-sm text-slate-900">Behavior Psychologist AI Coach</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-normal font-normal max-w-xl">
                      Stuck or experiencing high starting friction? Open the on-demand sliding coach drawer for cognitive rewiring, micro-step breakdowns, and actionable habit coaching.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCoach(true)}
                    className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer hover:-translate-y-0.5 active:scale-95"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Consult AI Coach
                  </button>
                </div>

              </div>
            ) : (
              <motion.div
                key="wizard-intro"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-slate-50 to-indigo-50/25 p-8 space-y-6 shadow-xl relative overflow-hidden backdrop-blur-md"
              >
                {/* Background soft glowing orb */}
                <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-100/30 rounded-full blur-3xl pointer-events-none" />
                
                <div className="space-y-2 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700 shadow-sm">
                      <Brain className="h-6 w-6" />
                    </span>
                    <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">
                      🧙‍♂️ AI Behavioral Assessment Wizard
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal pl-1">
                    Fogg AI integrates BJ Fogg's behavior model (<strong className="text-indigo-600 font-bold font-sans">B=MAP</strong>) and loss aversion mechanics to diagnose cognitive resistance and prescribe action instantly.
                  </p>
                </div>

                {/* Dimensions section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 pt-2">
                  <div className="p-4 rounded-xl bg-white/60 border border-slate-100 shadow-sm hover:border-indigo-200 transition-all">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1 font-sans">📊 Motivation Level</span>
                    <p className="text-[11px] text-slate-500 font-normal leading-normal">
                      Maps your active goal energy to detect task aversion or cognitive exhaustion.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/60 border border-slate-100 shadow-sm hover:border-indigo-200 transition-all">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1 font-sans">🛡️ Follow-Through Confidence</span>
                    <p className="text-[11px] text-slate-500 font-normal leading-normal">
                      Estimates starting doubts to calibrate a highly achievable scale.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/60 border border-slate-100 shadow-sm hover:border-indigo-200 transition-all">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1 font-sans">⚙️ Task Difficulty</span>
                    <p className="text-[11px] text-slate-500 font-normal leading-normal">
                      Pinpoints where the actual friction lies (tedium, size, or confusion).
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/60 border border-slate-100 shadow-sm hover:border-indigo-200 transition-all">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1 font-sans">⏱️ Previous Progress</span>
                    <p className="text-[11px] text-slate-500 font-normal leading-normal">
                      Assesses past setbacks and procrastination length to reframe momentum.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 relative z-10 flex items-start gap-2.5">
                  <Sparkles className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-indigo-900 block">Enter Your Goal to Begin</span>
                    <p className="text-[11px] text-indigo-700 leading-normal font-normal">
                      Use the daunting task planner card on the left to write what you are procrastinating on. Then click <strong>"Continue Assessment"</strong> to unlock your custom-tailored psychological roadmap.
                    </p>
                  </div>
                </div>
                
                {/* Micro step-count status */}
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider relative z-10 border-t border-slate-100 pt-4 font-sans">
                  <span>State: Awaiting Goal entry</span>
                  <span>5 Adaptive Dimensions</span>
                </div>
              </motion.div>
            )}
            
          </div>
        </div>
      </div>

      {/* Google Tasks Import Modal Dialog */}
      <AnimatePresence>
        {showGImport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-6 text-slate-800"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <FolderSync className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-bold text-base text-slate-900">Import from Google Tasks</h3>
                </div>
                <button
                  onClick={() => setShowGImport(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Error Alert Display */}
              {gImportError && (
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 text-rose-800 space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold">Google Tasks Sync Error</p>
                      <p className="text-[11px] text-rose-700 leading-normal font-normal">{gImportError}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setGImportError(null);
                        loadGoogleLists();
                      }}
                      className="px-2.5 py-1 rounded bg-rose-100 hover:bg-rose-200 text-[10px] font-bold text-rose-800 cursor-pointer transition-all"
                    >
                      Retry Sync
                    </button>
                    {!usingGSandbox && (
                      <button
                        type="button"
                        onClick={() => {
                          setGImportError(null);
                          handleUseGSandbox();
                        }}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 cursor-pointer transition-all"
                      >
                        Switch to Sandbox Mode
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Connection, Loader, or List Chooser */}
              {loadingGLists ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin" />
                  <span className="text-xs text-indigo-600 font-bold animate-pulse">
                    {gStatusText || "Connecting to Google Tasks API..."}
                  </span>
                </div>
              ) : needsGConnection ? (
                <div className="py-6 text-center space-y-6">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <FolderSync className="h-6 w-6" />
                  </div>
                  <div className="space-y-2 max-w-sm mx-auto">
                    <h4 className="font-bold text-sm text-slate-800">Connect to Google Tasks</h4>
                    <p className="text-xs text-slate-500 leading-normal font-normal">
                      Authorize Fogg AI to fetch your actual procrastinated tasks from Google Tasks so we can diagnose your behavioral blocks and design custom micro-steps.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2.5 max-w-xs mx-auto">
                    <button
                      onClick={handleConnectGTasks}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-2.5 px-4 text-xs font-semibold text-white shadow-md transition-all cursor-pointer"
                    >
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-4 w-4">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      </svg>
                      <span>Connect Real Account</span>
                    </button>
                    <button
                      onClick={handleUseGSandbox}
                      className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold hover:bg-slate-50 transition-all cursor-pointer bg-white"
                    >
                      Use Sandbox / Demo Tasks
                    </button>
                    {typeof window !== "undefined" && window.self !== window.top && (
                      <p className="text-[10px] text-slate-400 text-center max-w-xs mx-auto leading-relaxed mt-1">
                        💡 <strong>Running in preview?</strong> Please ensure popups are allowed, or open the app in a new tab if connection is blocked.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                    <div className="space-y-1 flex-1">
                      <label className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase">Select Task List</label>
                      <select
                        value={selectedGList}
                        onChange={handleListChange}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer font-semibold"
                      >
                        {gLists.length === 0 ? (
                          <option value="">No task lists found</option>
                        ) : (
                          gLists.map((list) => (
                            <option key={list.id} value={list.id}>
                              {list.title}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {gTasks.length > 0 && (
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => setSelectedGTaskIds(gTasks.map(t => t.id))}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-[10px] font-bold text-slate-600 hover:text-slate-800 cursor-pointer bg-white transition-all"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedGTaskIds([])}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-[10px] font-bold text-slate-600 hover:text-slate-800 cursor-pointer bg-white transition-all"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tasks display list */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                        Syncable Google Tasks ({gTasks.length})
                      </span>
                      {selectedGTaskIds.length > 0 && (
                        <span className="text-[10px] font-bold text-indigo-600 animate-pulse bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                          {selectedGTaskIds.length} Selected
                        </span>
                      )}
                    </div>

                    <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                      {gTasks.length === 0 ? (
                        <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                          <p className="text-xs text-slate-500 font-semibold">No active tasks in this list.</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-normal">Great job staying on top of your work!</p>
                        </div>
                      ) : (
                        gTasks.map((gTask) => {
                          const isSelected = selectedGTaskIds.includes(gTask.id);
                          return (
                            <div
                              key={gTask.id}
                              className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                                isSelected
                                  ? "border-indigo-500/40 bg-indigo-50/20"
                                  : "border-slate-100 bg-slate-50/30 hover:border-slate-200"
                              }`}
                            >
                              <input
                                type="checkbox"
                                id={`chk-${gTask.id}`}
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedGTaskIds((prev) => [...prev, gTask.id]);
                                  } else {
                                    setSelectedGTaskIds((prev) => prev.filter((id) => id !== gTask.id));
                                  }
                                }}
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                              <label htmlFor={`chk-${gTask.id}`} className="flex-1 cursor-pointer min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                  <h5 className={`text-xs font-bold text-slate-800 truncate ${isSelected ? "text-indigo-900" : ""}`}>
                                    {gTask.title}
                                  </h5>
                                  <div className="flex items-center gap-1 text-[9px] text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md font-bold shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    <span>Active</span>
                                  </div>
                                </div>
                                <p className="text-[10px] text-slate-500 line-clamp-1 font-normal mt-0.5">
                                  {gTask.description || "No description provided."}
                                </p>
                                {gTask.deadline && (
                                  <div className="flex items-center gap-1 text-[9px] text-indigo-600 font-bold mt-1.5">
                                    <Calendar className="h-3 w-3 shrink-0" />
                                    <span>Due: {gTask.deadline}</span>
                                  </div>
                                )}
                              </label>

                              {/* Single Import Shortcut */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleImportTask(gTask);
                                }}
                                className="shrink-0 self-center px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 text-[10px] font-bold text-slate-600 cursor-pointer transition-all shadow-sm"
                              >
                                Edit & Diagnose
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Batch Action Footer */}
                  {selectedGTaskIds.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="pt-2 border-t border-slate-100 flex items-center justify-between gap-4"
                    >
                      <span className="text-[10px] font-medium text-slate-500">
                        Batch import will auto-diagnose and bypass procrastination blocks instantly.
                      </span>
                      <button
                        type="button"
                        onClick={handleImportSelectedTasks}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md transition-all cursor-pointer hover:shadow-lg active:scale-95 shrink-0"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Import {selectedGTaskIds.length} Selected</span>
                      </button>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Informative Disclaimer */}
              <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 text-[10px] text-indigo-900 font-medium">
                <span>
                  {usingGSandbox ? (
                    "Running in sandbox mode with procrastinator-designed tasks. Click 'Connect Real Account' to sync your real Google account."
                  ) : needsGConnection ? (
                    "To proceed, please connect your Google account or choose the Demo Sandbox Tasks to explore."
                  ) : (
                    "Google Tasks API is securely connected using Firebase OAuth. Your tasks are fetched live from your Google Account."
                  )}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating AI Coach FAB Button */}
      {activeTask && !showCoach && (
        <motion.button
          initial={{ scale: 0, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: 20 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCoach(true)}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-2xl hover:shadow-indigo-500/30 transition-all cursor-pointer border border-indigo-400 group"
          title="Open AI Coach"
        >
          <div className="relative">
            <MessageSquare className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
          </div>
        </motion.button>
      )}

      {/* AI Coach Sliding Drawer */}
      <AnimatePresence>
        {showCoach && (
          <>
            {/* Backdrop for overlay feel */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCoach(false)}
              className="fixed inset-0 bg-slate-900 z-50 pointer-events-auto"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              style={{ width: isMobile ? "100%" : `${drawerWidth}px` }}
              className="fixed right-0 top-0 h-screen bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col pointer-events-auto overflow-hidden"
            >
              {/* Desktop Resize Handle on Left Edge */}
              {!isMobile && (
                <div
                  onMouseDown={startResizing}
                  className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-500/50 bg-transparent transition-colors z-50 flex items-center justify-center group"
                >
                  <div className="w-0.5 h-8 bg-slate-300 rounded group-hover:bg-indigo-500 transition-colors" />
                </div>
              )}

              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50 shrink-0">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-sm">
                    <Brain className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Behavioral Coach</h4>
                    <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-bold font-sans mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> FOGG COACH IS READY
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!isMobile && (
                    <span className="text-[9px] text-slate-400 font-medium px-2 py-1 bg-slate-100 rounded-md">
                      Drag left edge to resize
                    </span>
                  )}
                  <button
                    onClick={() => setShowCoach(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Close Coach"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Chat Message Window - using all available vertical space */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                {activeTask ? (
                  <>
                    {/* Goal Context Card */}
                    <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-left space-y-2 mb-4">
                      <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-widest block">Active Context</span>
                      <h5 className="font-extrabold text-xs text-slate-900 line-clamp-2">{activeTask.title}</h5>
                      {activeTask.analysis?.psychologicalBarrier && (
                        <p className="text-[10px] text-slate-500 font-medium">
                          Barrier identified: <strong className="text-indigo-600">{activeTask.analysis.psychologicalBarrier}</strong>
                        </p>
                      )}
                    </div>

                    {/* Chat Messages */}
                    {chatHistory.length === 0 ? (
                      <div className="py-12 text-center space-y-3">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                          <MessageSquare className="h-6 w-6" />
                        </div>
                        <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
                          Hello! Ask me to break down your task, rephrase your micro-step, or diagnose why you feel stuck. I'm here to bypass starting friction with you.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatHistory.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex flex-col space-y-1 max-w-[85%] ${
                              msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                            }`}
                          >
                            <div
                              className={`p-3.5 rounded-xl text-xs leading-relaxed font-normal ${
                                msg.role === "user"
                                  ? "bg-indigo-600 text-white rounded-tr-none shadow-sm font-semibold text-left"
                                  : "bg-white text-slate-700 rounded-tl-none border border-slate-200 shadow-sm text-left"
                              }`}
                            >
                              <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>
                            <span className="text-[9px] text-slate-400 px-1 font-medium">{msg.timestamp}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {sendingChat && (
                      <div className="flex items-center gap-2 text-xs text-slate-400 p-1 font-medium mt-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-bounce" />
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                        <span>Fogg Coach is typing...</span>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </>
                ) : (
                  <div className="py-24 text-center space-y-4 px-4">
                    <span className="inline-flex p-4 rounded-full bg-indigo-50 text-indigo-600 text-2xl">
                      🧠
                    </span>
                    <div className="space-y-2 max-w-xs mx-auto">
                      <h4 className="font-extrabold text-sm text-slate-900">No Active Goal Selected</h4>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium font-sans">
                        Please define, import, or activate a goal on the dashboard to start coaching with Fogg AI.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Chat Input Field at the Bottom */}
              {activeTask && (
                <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                  <form onSubmit={handleSendCoachMsg} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ask the coach to break down your friction further..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={sendingChat}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={sendingChat || !chatInput.trim()}
                      className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer disabled:opacity-50 shadow-sm flex items-center justify-center shrink-0 transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
