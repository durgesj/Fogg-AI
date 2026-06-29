/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task } from "../types";

export interface GoogleTaskList {
  id: string;
  title: string;
  updated?: string;
}

export interface GoogleTaskResponse {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status: string;
}

// Helper to check if a token is a mock/sandbox token
export const isMockToken = (token: string): boolean => {
  return !token || token.includes("mock") || token === "ya29.mock_token";
};

// Logs token details (scopes, email, etc.) from the Google OAuth endpoint for real-time debugging
export const logTokenDetails = async (accessToken: string) => {
  if (isMockToken(accessToken)) {
    console.log("[Google Tasks API Auth Debug] Mock/sandbox token used. Skipping real scope verification.");
    return { scopes: ["https://www.googleapis.com/auth/tasks", "https://www.googleapis.com/auth/tasks.readonly"], email: "sandbox@fogg.ai" };
  }
  
  try {
    console.log("[Google Tasks API Auth Debug] Verifying real token scopes and integrity...");
    const res = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`);
    if (res.ok) {
      const data = await res.json();
      const scopes = data.scope ? data.scope.split(" ") : [];
      console.log("[Google Tasks API Auth Debug] TOKEN DETAILS RETRIEVED SUCCESSFULLY:", {
        email: data.email,
        expiresInSeconds: data.expires_in,
        audience: data.aud,
        scopesGranted: scopes,
      });

      // Check for missing scopes
      const requiredScopes = ["https://www.googleapis.com/auth/tasks", "https://www.googleapis.com/auth/tasks.readonly"];
      const missing = requiredScopes.filter(s => !scopes.includes(s));
      if (missing.length > 0) {
        console.warn("[Google Tasks API Auth Debug] WARNING: Missing essential scopes:", missing);
      } else {
        console.log("[Google Tasks API Auth Debug] All required Tasks scopes are present!");
      }

      return { scopes, email: data.email, expiresIn: data.expires_in };
    } else {
      const errBody = await res.text();
      console.error(`[Google Tasks API Auth Debug] Token validation failed. HTTP ${res.status}: ${res.statusText}`, errBody);
      return null;
    }
  } catch (err) {
    console.error("[Google Tasks API Auth Debug] Connection error calling token info endpoint:", err);
    return null;
  }
};

// Fetches Google Task lists using OAuth Access Token
export const fetchGoogleTaskLists = async (accessToken: string): Promise<GoogleTaskList[]> => {
  if (isMockToken(accessToken)) {
    console.log("[Google Tasks API] Running in Sandbox mode. Loading mock lists.");
    return [
      { id: "default-list-id", title: "My Google Tasks" },
      { id: "work-list-id", title: "Quarterly Goals & Milestones" }
    ];
  }

  // Debug login scopes and token
  await logTokenDetails(accessToken);

  try {
    console.log(`[Google Tasks API] Calling GET https://tasks.googleapis.com/tasks/v1/users/@me/lists`);
    const res = await fetch("https://tasks.googleapis.com/tasks/v1/users/@me/lists", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[Google Tasks API] HTTP Error ${res.status} (${res.statusText}):`, errBody);
      
      if (res.status === 401) {
        throw new Error("Your Google session has expired or is invalid. Please sign in again.");
      } else if (res.status === 403) {
        throw new Error("Access Forbidden (403): Google Tasks API is not enabled in the GCP Console, or your account lacks permission.");
      } else {
        throw new Error(`Google Tasks API Error (${res.status}): ${res.statusText || "Unknown failure"} - ${errBody}`);
      }
    }

    const data = await res.json();
    console.log("[Google Tasks API] Lists loaded successfully. Count:", (data.items || []).length);
    return data.items || [];
  } catch (error: any) {
    console.error("[Google Tasks API] fetchGoogleTaskLists caught error:", error);
    // Rethrow to let UI handle real API failures appropriately
    throw error;
  }
};

// Fetches Google Tasks from a specific task list
export const fetchGoogleTasks = async (accessToken: string, listId: string): Promise<Task[]> => {
  if (isMockToken(accessToken)) {
    console.log(`[Google Tasks API] Running in Sandbox mode. Loading mock tasks for list: ${listId}`);
    // Procrastinator-heavy fallback items to perfectly showcase Fogg AI's psychologist features!
    if (listId === "work-list-id") {
      return [
        {
          id: "gt-mock-1",
          title: "Complete Google AI Hackathon pitch slides and video",
          description: "Draft 5 slides focusing on Fogg behavior model, B=MAP integration, and record a 2-minute video. Feeling extremely overwhelmed by formatting slides.",
          deadline: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
          status: "pending",
          source: "google_tasks",
          googleTaskId: "mock-1",
          googleTaskListId: listId
        },
        {
          id: "gt-mock-2",
          title: "Refactor backend database schema for scaling",
          description: "Massive task. Needs migrations, review, index updates. Keeping putting it off because it is so boring and tedious.",
          deadline: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0],
          status: "pending",
          source: "google_tasks",
          googleTaskId: "mock-2",
          googleTaskListId: listId
        }
      ];
    }

    return [
      {
        id: "gt-mock-3",
        title: "Schedule dentist appointment for wisdom teeth checkup",
        description: "Need to call the dentist. Terrified of phone calls and potential cavity drill pain.",
        deadline: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        status: "pending",
        source: "google_tasks",
        googleTaskId: "mock-3",
        googleTaskListId: listId
      },
      {
        id: "gt-mock-4",
        title: "Draft 2026 performance self-assessment summary",
        description: "Write 1,500 words explaining achievements this year. Huge imposter syndrome and high aversion.",
        deadline: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
        status: "pending",
        source: "google_tasks",
        googleTaskId: "mock-4",
        googleTaskListId: listId
      }
    ];
  }

  try {
    const url = `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks?showCompleted=false`;
    console.log(`[Google Tasks API] Calling GET ${url}`);
    
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[Google Tasks API] HTTP Error ${res.status} (${res.statusText}) on tasks retrieval:`, errBody);
      throw new Error(`Google Tasks API Error (${res.status}): Failed to retrieve tasks in list ${listId}`);
    }

    const data = await res.json();
    const items: GoogleTaskResponse[] = data.items || [];
    console.log(`[Google Tasks API] Successfully retrieved ${items.length} tasks.`);
    
    return items
      .filter(item => item.title) // Skip empty tasks
      .map((item) => ({
        id: `gt-${item.id}`,
        title: item.title,
        description: item.notes || "",
        deadline: item.due ? new Date(item.due).toISOString().split("T")[0] : undefined,
        status: "pending" as const,
        source: "google_tasks" as const,
        googleTaskId: item.id,
        googleTaskListId: listId
      }));
  } catch (error: any) {
    console.error("[Google Tasks API] fetchGoogleTasks caught error:", error);
    throw error;
  }
};
