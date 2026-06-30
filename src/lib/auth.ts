/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserStats } from "../types";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfigImport from "../../firebase-applet-config.json";

// Merge or override with environment variables for local/CI deployment safety
const firebaseConfig = {
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || firebaseConfigImport.projectId,
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID || firebaseConfigImport.appId,
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || firebaseConfigImport.apiKey,
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigImport.authDomain,
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigImport.storageBucket,
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigImport.messagingSenderId,
  measurementId: (import.meta as any).env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigImport.measurementId,
  firestoreDatabaseId: (import.meta as any).env.VITE_FIREBASE_DATABASE_ID || (firebaseConfigImport as any).firestoreDatabaseId
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "ai-studio-foggai-db69550f-e62d-4b1d-a91a-eac5022b68a1");

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isGuest?: boolean;
}

// In-memory token cache for Google Workspace APIs
let cachedAccessToken: string | null = null;

// Mock user storage key
const USER_STORAGE_KEY = "fogg_ai_user";
const STATS_STORAGE_KEY = "fogg_ai_stats";

export const getStoredUser = (): User | null => {
  const stored = localStorage.getItem(USER_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const getStoredStats = (): UserStats => {
  const stored = localStorage.getItem(STATS_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Default stats for new user
  const defaults: UserStats = {
    focusCoins: 100,
    streak: 3,
    tasksCompletedCount: 5,
    lastCompletedDate: null,
  };
  localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(defaults));
  return defaults;
};

export const saveStoredStats = (stats: UserStats) => {
  localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  const provider = new GoogleAuthProvider();
  // Request Google Tasks scopes
  provider.addScope("https://www.googleapis.com/auth/tasks");
  provider.addScope("https://www.googleapis.com/auth/tasks.readonly");
  provider.addScope("https://www.googleapis.com/auth/userinfo.profile");
  provider.addScope("https://www.googleapis.com/auth/userinfo.email");

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to retrieve Google Access Token.");
    }
    const token = credential.accessToken;
    cachedAccessToken = token;
    localStorage.setItem("fogg_ai_google_access_token", token);

    const mappedUser: User = {
      uid: result.user.uid,
      displayName: result.user.displayName,
      email: result.user.email,
      photoURL: result.user.photoURL,
      isGuest: false,
    };

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mappedUser));
    return { user: mappedUser, accessToken: token };
  } catch (error: any) {
    console.error("Firebase Google OAuth failed:", error);
    
    const errorCode = error?.code;
    const errorMessage = error?.message || "";
    
    if (
      errorCode === "auth/popup-closed-by-user" ||
      errorCode === "auth/cancelled-popup-request" ||
      errorCode === "auth/popup-blocked"
    ) {
      throw new Error("Please try again.");
    } else if (
      errorCode === "auth/access-denied" || 
      errorMessage.includes("access_denied") || 
      errorMessage.includes("permission_denied") ||
      errorMessage.includes("cancelled")
    ) {
      throw new Error("Permission denied.");
    } else if (
      errorCode === "auth/network-request-failed" || 
      errorMessage.includes("network")
    ) {
      throw new Error("Unable to connect to Google.");
    } else {
      throw new Error("Unable to connect to Google.");
    }
  }
};

export const guestSignIn = async (name: string): Promise<User> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockUser: User = {
        uid: `guest-${Math.random().toString(36).substr(2, 9)}`,
        displayName: name || "Fogg Executioner",
        email: null,
        photoURL: null,
        isGuest: true,
      };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser));
      resolve(mockUser);
    }, 400);
  });
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.error("Firebase signOut failed:", e);
  }
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem("fogg_ai_google_access_token");
  cachedAccessToken = null;
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken || localStorage.getItem("fogg_ai_google_access_token");
};
