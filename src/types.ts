/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MicroAction {
  title: string;
  duration: string;
  instructions: string;
}

export interface BehaviorAnalysis {
  psychologicalBarrier: string;
  explanation: string;
  microAction: MicroAction;
  todayLossWarning: string;
  microReward: string;
  identityAffirmation: string;
  recommendedIntervention: string;
  // Stage 2 properties
  goalCategory?: string;
  primaryBarrier?: string;
  secondaryBarrier?: string;
  confidence?: number;
  readinessScore?: number;
  reason?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  status: "pending" | "analyzed" | "completed";
  source: "manual" | "google_tasks";
  googleTaskId?: string;
  googleTaskListId?: string;
  analysis?: BehaviorAnalysis;
  completedAt?: string;
}

export interface UserStats {
  focusCoins: number;
  streak: number;
  tasksCompletedCount: number;
  lastCompletedDate: string | null;
}

export interface CoachMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}
