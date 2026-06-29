import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  getFirestore
} from "firebase/firestore";
import { db, auth, User } from "./auth";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface CompletedTask {
  id: string;
  userId: string;
  title: string;
  category: string;
  description: string;
  deadline: string;
  createdAt: string;
  completedAt: string;
  executionTime: number; // in seconds
  microStepsCompleted: number;
  readinessScore: number;
  primaryBarrier: string;
  secondaryBarrier: string;
  intervention: string;
  status: "completed";
  coinsEarned: number;
  streakEarned: boolean;
  coachSummary: string;
}

export interface AIMemory {
  mostCommonBarrier: string;
  mostSuccessfulIntervention: string;
  averageReadiness: number;
  averageCompletionTime: number; // in seconds
  mostProductiveGoalCategory: string;
  mostProductiveWorkingHours: string;
  historicalConfidence: number;
}

const LOCAL_HISTORY_KEY = "fogg_ai_execution_history";

/**
 * Saves a completed task to Firestore (if authenticated & not guest) and fallback to localStorage
 */
export async function saveCompletedTask(user: User | null, task: CompletedTask): Promise<void> {
  // 1. Save to local storage first (always, for immediate state availability and sandbox mode)
  const localTasks = getLocalCompletedTasks();
  // Prevent duplicate saves
  if (!localTasks.some(t => t.id === task.id)) {
    localTasks.unshift(task);
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(localTasks));
  }

  // 2. If authenticated & not guest, sync with Firestore
  if (user && !user.isGuest && !user.uid.startsWith("guest-") && user.uid !== "google-oauth-user-123") {
    const path = `completed_tasks`;
    try {
      // Ensure the task carries the correct user identity
      const docRef = doc(db, path, task.id);
      await setDoc(docRef, {
        ...task,
        userId: user.uid
      });
    } catch (error) {
      console.warn("Failed to sync completed task with Firestore, cached locally.", error);
      try {
        handleFirestoreError(error, OperationType.WRITE, `${path}/${task.id}`);
      } catch (e) {
        // Suppress propagating error to the UI to maintain offline seamless UX
      }
    }
  }
}

/**
 * Retrieves all completed tasks from Firestore (if authenticated & not guest) or falls back to localStorage
 */
export async function getCompletedTasks(user: User | null): Promise<CompletedTask[]> {
  const localTasks = getLocalCompletedTasks();

  if (user && !user.isGuest && !user.uid.startsWith("guest-") && user.uid !== "google-oauth-user-123") {
    const path = `completed_tasks`;
    try {
      const q = query(
        collection(db, path),
        where("userId", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      const remoteTasks: CompletedTask[] = [];
      snapshot.forEach((doc) => {
        remoteTasks.push(doc.data() as CompletedTask);
      });

      // Merge remote tasks into localStorage cache to make sure we don't duplicate
      const mergedMap = new Map<string, CompletedTask>();
      // Remote tasks are source of truth for synced accounts
      remoteTasks.forEach(t => mergedMap.set(t.id, t));
      // Local-only/unsynced tasks
      localTasks.forEach(t => {
        if (!mergedMap.has(t.id)) {
          mergedMap.set(t.id, t);
        }
      });

      const mergedList = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );

      localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(mergedList));
      return mergedList;
    } catch (error) {
      console.warn("Firestore retrieve failed, falling back to local history cache", error);
      // Suppress propagating error, fall back gracefully
      return localTasks;
    }
  }

  return localTasks;
}

/**
 * Triggers a manual sync of local storage to Firestore when connection returns
 */
export async function syncOfflineCompletedTasks(user: User | null): Promise<void> {
  if (!user || user.isGuest || user.uid.startsWith("guest-") || user.uid === "google-oauth-user-123") {
    return;
  }

  const localTasks = getLocalCompletedTasks();
  const path = `completed_tasks`;

  for (const task of localTasks) {
    try {
      const docRef = doc(db, path, task.id);
      await setDoc(docRef, {
        ...task,
        userId: user.uid
      });
    } catch (error) {
      console.warn(`Sync failed for task ${task.id}`, error);
    }
  }
}

function getLocalCompletedTasks(): CompletedTask[] {
  const stored = localStorage.getItem(LOCAL_HISTORY_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
}

/**
 * Calculates adaptive AI Memory from completed tasks
 */
export function calculateAIMemory(tasks: CompletedTask[]): AIMemory {
  if (tasks.length === 0) {
    return {
      mostCommonBarrier: "None (Awaiting First Goal)",
      mostSuccessfulIntervention: "Micro Chunking",
      averageReadiness: 0,
      averageCompletionTime: 0,
      mostProductiveGoalCategory: "General",
      mostProductiveWorkingHours: "Morning (6 AM - 12 PM)",
      historicalConfidence: 0
    };
  }

  // Count frequencies
  const barrierCounts: Record<string, number> = {};
  const interventionCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  const hourCounts: Record<string, number> = {}; // Morning, Afternoon, Evening, Night

  let totalReadiness = 0;
  let totalTime = 0;
  let totalConfidence = 0;
  let confidenceCount = 0;

  tasks.forEach((task) => {
    // Barrier
    const pb = task.primaryBarrier || "Unknown";
    barrierCounts[pb] = (barrierCounts[pb] || 0) + 1;

    // Intervention
    const iv = task.intervention || "Micro Chunking";
    interventionCounts[iv] = (interventionCounts[iv] || 0) + 1;

    // Category
    const cat = task.category || "General";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

    // Readiness & Time
    totalReadiness += task.readinessScore || 50;
    totalTime += task.executionTime || 0;

    // Confidence (mock some or extract if available, fallback to something proportional to readiness)
    const confidenceVal = task.readinessScore ? Math.min(100, Math.round(task.readinessScore * 1.2)) : 75;
    totalConfidence += confidenceVal;
    confidenceCount++;

    // Working Hours
    const date = new Date(task.completedAt);
    const hour = date.getHours();
    let timeRange = "";
    if (hour >= 6 && hour < 12) {
      timeRange = "Morning (6 AM - 12 PM)";
    } else if (hour >= 12 && hour < 17) {
      timeRange = "Afternoon (12 PM - 5 PM)";
    } else if (hour >= 17 && hour < 22) {
      timeRange = "Evening (5 PM - 10 PM)";
    } else {
      timeRange = "Night (10 PM - 6 AM)";
    }
    hourCounts[timeRange] = (hourCounts[timeRange] || 0) + 1;
  });

  const getMostFrequent = (counts: Record<string, number>, fallback: string): string => {
    let max = 0;
    let result = fallback;
    for (const key in counts) {
      if (counts[key] > max) {
        max = counts[key];
        result = key;
      }
    }
    return result;
  };

  return {
    mostCommonBarrier: getMostFrequent(barrierCounts, "None"),
    mostSuccessfulIntervention: getMostFrequent(interventionCounts, "Micro Chunking"),
    averageReadiness: Math.round(totalReadiness / tasks.length),
    averageCompletionTime: Math.round(totalTime / tasks.length),
    mostProductiveGoalCategory: getMostFrequent(categoryCounts, "General"),
    mostProductiveWorkingHours: getMostFrequent(hourCounts, "Morning (6 AM - 12 PM)"),
    historicalConfidence: Math.round(totalConfidence / confidenceCount)
  };
}
