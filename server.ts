/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini SDK with telemetry header
const getGeminiClient = (): GoogleGenAI => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not defined. AI analysis will fall back to simulation.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "MOCK_KEY",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

const ai = getGeminiClient();

// High-fidelity fallback simulated generators to keep the user unblocked in case of 503 / API key limits
const safeGenerateContent = async (
  params: any
): Promise<any> => {
  const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const tryParams = { ...params, model };
      return await ai.models.generateContent(tryParams);
    } catch (error: any) {
      lastError = error;
      console.log(`[Gemini Safe fallback] Model ${model} returned error/unavailability. Proceeding to next fallback if available...`);
    }
  }

  // If we reach here, all fallbacks failed
  console.log("All configured Gemini models failed. Activating local smart offline generators.");
  throw lastError;
};

const getCategoryAndFallbackQuestions = (title: string, description: string = "", deadline: string = "") => {
  const titleLower = title.toLowerCase();
  let category = "Personal";
  
  if (titleLower.includes("study") || titleLower.includes("exam") || titleLower.includes("learn") || titleLower.includes("read") || titleLower.includes("class") || titleLower.includes("math") || titleLower.includes("school") || titleLower.includes("assignment") || titleLower.includes("homework") || titleLower.includes("lecture") || titleLower.includes("course") || titleLower.includes("history") || titleLower.includes("science")) {
    category = "Study";
  } else if (titleLower.includes("work") || titleLower.includes("project") || titleLower.includes("report") || titleLower.includes("email") || titleLower.includes("resume") || titleLower.includes("presentation") || titleLower.includes("client") || titleLower.includes("meeting") || titleLower.includes("code") || titleLower.includes("develop") || titleLower.includes("write") || titleLower.includes("draft") || titleLower.includes("essay") || titleLower.includes("paper") || titleLower.includes("doc")) {
    category = "Work";
  } else if (titleLower.includes("exercise") || titleLower.includes("run") || titleLower.includes("gym") || titleLower.includes("workout") || titleLower.includes("yoga") || titleLower.includes("fit") || titleLower.includes("stretch") || titleLower.includes("health") || titleLower.includes("walk") || titleLower.includes("sport") || titleLower.includes("train")) {
    category = "Fitness";
  } else if (titleLower.includes("business") || titleLower.includes("start") || titleLower.includes("marketing") || titleLower.includes("revenue") || titleLower.includes("pitch") || titleLower.includes("fund") || titleLower.includes("strategy")) {
    category = "Business";
  }

  // Predefined questions based on category
  const questionsByCat: Record<string, any[]> = {
    "Study": [
      {
        id: "q1",
        text: "What feels like the heaviest cognitive block for this study session?",
        type: "choice",
        choices: ["The sheer volume of material is overwhelming.", "I don't know which concept or page to start with.", "I keep drifting to tabs, my phone, or social media.", "I'm afraid I won't understand it or will perform poorly."]
      },
      {
        id: "q2",
        text: "Have you started reviewing this material yet?",
        type: "choice",
        choices: ["No, haven't touched it", "I've skimmed/opened it briefly", "I've studied a decent chunk already", "I am almost fully prepared"]
      },
      {
        id: "q3",
        text: "How confident are you that you can successfully comprehend and finish this by the deadline?",
        type: "slider",
        min: 1,
        max: 10,
        minLabel: "Struggling / No confidence",
        maxLabel: "Fully confident"
      },
      {
        id: "q4",
        text: "Approximately how much of the study scope still remains unlearned?",
        type: "choice",
        choices: ["25% remains", "50% remains", "75% remains", "Almost everything (100%)"]
      }
    ],
    "Work": [
      {
        id: "q1",
        text: "What is causing the highest starting friction for this professional deliverable?",
        type: "choice",
        choices: ["The task feels massive, tedious, or dry.", "The expectations are vague or I don't know the first step.", "I am afraid of doing an imperfect job and being judged.", "I am physically and mentally exhausted from other work."]
      },
      {
        id: "q2",
        text: "Have you started working on this task?",
        type: "choice",
        choices: ["No, blank page", "Just a rough outline or headline", "Some drafts/code are written", "Almost fully done"]
      },
      {
        id: "q3",
        text: "How confident are you that you'll submit this on time with high quality?",
        type: "slider",
        min: 1,
        max: 10,
        minLabel: "Very low",
        maxLabel: "Extremely confident"
      },
      {
        id: "q4",
        text: "How much work remains before this professional task is ready to submit?",
        type: "choice",
        choices: ["25% remains", "50% remains", "75% remains", "Almost 100% remains"]
      }
    ],
    "Fitness": [
      {
        id: "q1",
        text: "What is keeping you from starting your active movement right now?",
        type: "choice",
        choices: ["The initial physical effort feels unappealing.", "My mind wants immediate comfort or distraction instead.", "I don't have a clear, structured routine ready.", "I am feeling too physically low-energy or tired."]
      },
      {
        id: "q2",
        text: "Have you changed into your activewear or prepared your space?",
        type: "choice",
        choices: ["No, still in casual wear", "Partially prepared/found shoes", "Fully dressed and ready in space", "I've started warm-up already"]
      },
      {
        id: "q3",
        text: "How excited or committed are you to executing this session today?",
        type: "slider",
        min: 1,
        max: 10,
        minLabel: "Dragging myself",
        maxLabel: "Hyped / Highly committed"
      },
      {
        id: "q4",
        text: "How much of the planned workout routine remains to be completed?",
        type: "choice",
        choices: ["25% remains", "50% remains", "75% remains", "100% remains"]
      }
    ],
    "Business": [
      {
        id: "q1",
        text: "What feels like the biggest strategic hurdle right now?",
        type: "choice",
        choices: ["Fear of rejection or market failure.", "Overcomplicating the strategy / analysis paralysis.", "High friction in reaching out or starting marketing.", "Lack of capital, tools, or resources."]
      },
      {
        id: "q2",
        text: "Have you launched or drafted any of the core components?",
        type: "choice",
        choices: ["No, just an idea", "Rough drafts or pitch materials ready", "Active testing or partial launch", "Almost fully complete"]
      },
      {
        id: "q3",
        text: "How confident are you in the commercial execution of this step?",
        type: "slider",
        min: 1,
        max: 10,
        minLabel: "Doubtful",
        maxLabel: "Unshakable belief"
      },
      {
        id: "q4",
        text: "What proportion of this business milestone remains unexecuted?",
        type: "choice",
        choices: ["25% remains", "50% remains", "75% remains", "Almost all (100%)"]
      }
    ],
    "Personal": [
      {
        id: "q1",
        text: "What is the primary psychological blocker for this personal goal?",
        type: "choice",
        choices: ["It feels tedious, boring, or low-stimulation.", "I don't know the exact sequence or where to begin.", "I get easily distracted by more comfortable habits.", "I keep overthinking the best way to do it."]
      },
      {
        id: "q2",
        text: "Have you taken any preliminary steps or gathered materials?",
        type: "choice",
        choices: ["No, haven't started at all", "Gathered some info or materials", "Begun the initial work already", "Very close to finished"]
      },
      {
        id: "q3",
        text: "How confident are you that you'll follow through on this today?",
        type: "slider",
        min: 1,
        max: 10,
        minLabel: "Very doubtful",
        maxLabel: "100% committed"
      },
      {
        id: "q4",
        text: "How much effort or time is still required to finalize this?",
        type: "choice",
        choices: ["Less than 15 minutes", "Around 30-60 minutes", "A few hours", "A major multi-day effort"]
      }
    ]
  };

  return {
    goalCategory: category,
    questions: questionsByCat[category] || questionsByCat["Personal"]
  };
};

const generateHighQualitySimulatedAnalysis = (title: string, description: string = "", deadline: string = "", answers: any[] = [], goalCategory?: string) => {
  const normalizedTitle = title.toLowerCase();
  
  // Detect category
  let category = goalCategory || "Personal";
  if (!goalCategory) {
    if (normalizedTitle.includes("study") || normalizedTitle.includes("exam") || normalizedTitle.includes("learn") || normalizedTitle.includes("read") || normalizedTitle.includes("lecture") || normalizedTitle.includes("course") || normalizedTitle.includes("math") || normalizedTitle.includes("class") || normalizedTitle.includes("history") || normalizedTitle.includes("science")) {
      category = "Study";
    } else if (normalizedTitle.includes("write") || normalizedTitle.includes("draft") || normalizedTitle.includes("essay") || normalizedTitle.includes("report") || normalizedTitle.includes("paper") || normalizedTitle.includes("email") || normalizedTitle.includes("letter") || normalizedTitle.includes("blog") || normalizedTitle.includes("cv") || normalizedTitle.includes("resume") || normalizedTitle.includes("doc") || normalizedTitle.includes("work")) {
      category = "Work";
    } else if (normalizedTitle.includes("exercise") || normalizedTitle.includes("run") || normalizedTitle.includes("gym") || normalizedTitle.includes("workout") || normalizedTitle.includes("walk") || normalizedTitle.includes("stretch") || normalizedTitle.includes("yoga") || normalizedTitle.includes("sport") || normalizedTitle.includes("fit") || normalizedTitle.includes("train")) {
      category = "Fitness";
    } else if (normalizedTitle.includes("business") || normalizedTitle.includes("start") || normalizedTitle.includes("marketing") || normalizedTitle.includes("revenue") || normalizedTitle.includes("pitch")) {
      category = "Business";
    }
  }

  // Set default scores
  let confidenceVal = 60;
  let readinessScoreVal = 40;
  let secondaryBarrier = "Planning Fallacy";
  let obstacleAnswer = "The task feels too big.";

  // Parse actual answers if present
  if (answers && Array.isArray(answers)) {
    answers.forEach((ans: any) => {
      const qText = (ans.questionText || "").toLowerCase();
      const aVal = String(ans.answer || "");
      if (qText.includes("confident") || qText.includes("excited")) {
        const parsed = parseInt(aVal, 10);
        if (!isNaN(parsed)) {
          confidenceVal = parsed * 10; // Convert 1-10 to percentage
        }
      }
      if (qText.includes("obstacle") || qText.includes("block") || qText.includes("friction") || qText.includes("obstacle")) {
        obstacleAnswer = aVal;
      }
    });
  }

  // Compute readiness score based on confidence and whether they've started
  readinessScoreVal = Math.max(15, Math.min(95, Math.floor((confidenceVal * 0.7) + (normalizedTitle.length % 15))));

  let primaryBarrier = "Task Aversion";
  if (obstacleAnswer.includes("too big") || obstacleAnswer.includes("overwhelming")) {
    primaryBarrier = "Task Aversion";
    secondaryBarrier = "Cognitive Overload";
  } else if (obstacleAnswer.includes("where to begin") || obstacleAnswer.includes("sequence") || obstacleAnswer.includes("expectations")) {
    primaryBarrier = "Planning Fallacy";
    secondaryBarrier = "Amotivation";
  } else if (obstacleAnswer.includes("distract") || obstacleAnswer.includes("phone")) {
    primaryBarrier = "Distal Rewards / Impulsivity";
    secondaryBarrier = "Choice Overload";
  } else if (obstacleAnswer.includes("badly") || obstacleAnswer.includes("perfection") || obstacleAnswer.includes("judged")) {
    primaryBarrier = "Perfectionism";
    secondaryBarrier = "Fear of Failure";
  } else if (obstacleAnswer.includes("exhausted") || obstacleAnswer.includes("energy") || obstacleAnswer.includes("tired")) {
    primaryBarrier = "Cognitive Fatigue";
    secondaryBarrier = "Amotivation";
  }

  let baseAnalysis: any = {};

  if (category === "Study") {
    baseAnalysis = {
      psychologicalBarrier: `${primaryBarrier} (Cognitive Overload)`,
      explanation: `Your brain is feeling overwhelmed by the sheer volume of information associated with this learning task. It shuts down as a protective reflex to prevent mental fatigue.`,
      microAction: {
        title: "Read exactly one single paragraph or slide",
        duration: "60 seconds",
        instructions: "Open your study materials, lecture notes, or textbook. Find the very first paragraph or bullet point. Read it slowly, then close the document immediately if you feel like stopping."
      },
      todayLossWarning: "If you do not complete this 2-minute action right now, you risk carrying the heavy cloud of academic guilt all evening and starting tomorrow even more behind.",
      microReward: "+12 Focus Coins and instant cognitive momentum",
      identityAffirmation: "You are an intentional learner who understands that mastery is built one paragraph at a time.",
      recommendedIntervention: "Fogg B=MAP: Reduce Cognitive friction by making the initial reading micro-sized (Offline Mode)."
    };
  } else if (category === "Work") {
    baseAnalysis = {
      psychologicalBarrier: `${primaryBarrier} (Blank Page Anxiety)`,
      explanation: `You want to do such an incredible job writing "${title}" that the empty cursor feels like a harsh critic. This fear of starting imperfectly is paralyzing you.`,
      microAction: {
        title: "Write a deliberately terrible, 10-word draft",
        duration: "45 seconds",
        instructions: "Open your editor or document. Type one completely messy, grammatically incorrect, and poorly structured sentence about your topic. Permit yourself to write absolute garbage."
      },
      todayLossWarning: "If you do not complete this 2-minute action right now, you risk staying trapped in the cycle of perfection-paralysis and wasting hours thinking about starting.",
      microReward: "+15 Focus Coins and absolute liberation from the blank page",
      identityAffirmation: "You are a practitioner who knows that a messy first draft is the only pathway to a brilliant final copy.",
      recommendedIntervention: "Fogg B=MAP: Bypass perfectionism by explicitly rewarding ugly first attempts (Offline Mode)."
    };
  } else if (category === "Fitness") {
    baseAnalysis = {
      psychologicalBarrier: `${primaryBarrier} (Temporal Discounting)`,
      explanation: `The physical effort of starting your workout feels unappealing right now, while the long-term health benefits feel too far in the future to trigger immediate action.`,
      microAction: {
        title: "Put on your workout shoes and stand up",
        duration: "60 seconds",
        instructions: "Simply find your exercise shoes and put them on. Lace them up and stand up. You do not have to do the workout—just complete this physical transition cue."
      },
      todayLossWarning: "If you do not complete this 2-minute action right now, you risk waking up tomorrow feeling sluggish, carrying physical tension, and wishing you had given your body just 2 minutes of care.",
      microReward: "+12 Focus Coins and an awakened physical drive",
      identityAffirmation: "You are a healthy action-taker who honors their body's physical energy with gentle first steps.",
      recommendedIntervention: "Fogg B=MAP: Bridge the motivation gap by isolating the physical preparation phase (Offline Mode)."
    };
  } else {
    // Personal or Business
    baseAnalysis = {
      psychologicalBarrier: `${primaryBarrier} (High Starting Friction)`,
      explanation: `Your brain is perceiving "${title}" as a massive, exhausting mountain of work. It is trying to protect you from discomfort by steering you toward easier activities.`,
      microAction: {
        title: "Open the file or draft a single header line",
        duration: "90 seconds",
        instructions: "Open your workspace or editor and type a single headline title. Nothing more. You are permitted to close it immediately after."
      },
      todayLossWarning: `If you do not complete this 2-minute action right now, you risk losing a clean slate for tomorrow and carrying this nagging low-grade anxiety with you all evening.`,
      microReward: "+10 Focus Coins and an instant sigh of relief.",
      identityAffirmation: "You are an action-taker who respects their peace of mind.",
      recommendedIntervention: "Fogg Behavior Model (B=MAP): Boost Ability by reducing task friction (Offline Mode)"
    };
  }

  return {
    ...baseAnalysis,
    goalCategory: category,
    primaryBarrier,
    secondaryBarrier,
    confidence: confidenceVal,
    readinessScore: readinessScoreVal,
    reason: `The user reports: "${obstacleAnswer}". Confidence score is ${confidenceVal}% with a readiness index of ${readinessScoreVal}/100.`,
    recommendedIntervention: baseAnalysis.recommendedIntervention || "Micro-Chunk Execution"
  };
};

const generateHighQualitySimulatedCoachResponse = (message: string, task: any) => {
  const msgLower = message.toLowerCase();

  if (msgLower.includes("done") || msgLower.includes("finish") || msgLower.includes("complete") || msgLower.includes("did it") || msgLower.includes("yes") || msgLower.includes("worked") || msgLower.includes("success") || msgLower.includes("achieved")) {
    return {
      text: `🎉 **Fantastic work!** You did it! By taking that absolute first step, you've broken the friction barrier and proved to your brain that starting is not painful. 
  
This is a major victory for your **Identity-Based Habits**. You are officially an action-taker!

Do you feel the momentum? If you want to keep going for another 5 minutes, go for it. If not, celebrate this win—you've earned your **micro-reward**! What would you like to tackle next?`
    };
  }

  if (msgLower.includes("hard") || msgLower.includes("difficult") || msgLower.includes("cannot") || msgLower.includes("can't") || msgLower.includes("fail") || msgLower.includes("unable") || msgLower.includes("struggle") || msgLower.includes("lazy") || msgLower.includes("stuck") || msgLower.includes("scared") || msgLower.includes("afraid") || msgLower.includes("anxious")) {
    return {
      text: `I hear you, and that is completely okay. Let's practice some radical self-compassion. Procrastination is not a moral failing or laziness; it is simply your brain's **emotional regulation response** to stress or discomfort.

Let's lower the bar even further. If "${task?.analysis?.microAction?.title || "that step"}" still feels too big, can we reduce it to something requiring literally 10 seconds? 

For example, can you just *touch* your materials, or just open the browser tab and close it? Tell me what feels like a 0-effort action, and let's do that together right now. No pressure, you've got this!`
    };
  }

  return {
    text: `That makes total sense. As your **Fogg AI Coach** (running in Smart Offline Fallback Mode), my main goal is to make action feel completely effortless.

According to the **Fogg Behavior Model (B=MAP)**, we cannot always rely on high Motivation. Instead, we must design the task so that it requires very low **Ability** (making it incredibly easy to start).

Let's focus on **${task?.analysis?.microAction?.title || "the micro-step"}**. Can we commit to just starting that for exactly 60 seconds? No pressure to finish—just start. Tell me, what specifically is the biggest friction point holding you back from doing this tiny step right now?`
  };
};

// API endpoint to dynamically generate questions
app.post("/api/generate-questions", async (req: Request, res: Response) => {
  const { title, description, deadline } = req.body;

  if (!title) {
    res.status(400).json({ error: "Goal title is required." });
    return;
  }

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
    const fallback = getCategoryAndFallbackQuestions(title, description, deadline);
    res.json(fallback);
    return;
  }

  try {
    const prompt = `Determine the goal category and generate exactly 3 to 5 highly relevant, custom, and adaptive behavioral questions to diagnose procrastination barriers for this task:
Task: "${title}"
Description: "${description || 'None provided'}"
Deadline: "${deadline || 'None specified'}"

Categories should be one of: Study, Work, Fitness, Business, Personal.
The questions should discover emotional resistance, cognitive load, planning confidence, motivation level, current progress, or starting friction.
Limit choices to max 4 options per choice question. Keep all questions and choice options extremely concise (less than 15 words each). Ensure there is a slider question for confidence (1-10) and choice questions for barriers. Make sure the output fits the response schema exactly. Do not repeat questions or loop.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        goalCategory: {
          type: Type.STRING,
          description: "One of: Study, Work, Fitness, Business, Personal"
        },
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              text: { type: Type.STRING, description: "A highly conversational, extremely concise question relevant to this specific task." },
              type: { type: Type.STRING, description: "Must be 'choice' or 'slider'" },
              choices: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of 3 to 4 answers. Only required if type is 'choice'."
              },
              min: { type: Type.INTEGER, description: "Minimum slider value (e.g., 1)." },
              max: { type: Type.INTEGER, description: "Maximum slider value (e.g., 10)." },
              minLabel: { type: Type.STRING, description: "Label for min value, e.g., 'Not confident'." },
              maxLabel: { type: Type.STRING, description: "Label for max value, e.g., 'Very confident'." }
            },
            required: ["id", "text", "type"]
          }
        }
      },
      required: ["goalCategory", "questions"]
    };

    const response = await safeGenerateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Fogg AI's Adaptive Behavioral Assessment Engine. You generate highly personalized and extremely concise questions to help procrastinators understand their cognitive blocks.",
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2
      }
    });

    let text = response.text?.trim() || "{}";
    // Clean any accidental markdown code blocks if present
    if (text.startsWith("```")) {
      text = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }
    const data = JSON.parse(text);
    res.json(data);
  } catch (error: any) {
    console.warn("Gemini adaptive question generation failed, using fallback:", error.message || error);
    const fallback = getCategoryAndFallbackQuestions(title, description, deadline);
    res.json(fallback);
  }
});

// API endpoint for Fogg Behavior Model task analysis
app.post("/api/analyze-task", async (req: Request, res: Response) => {
  const { title, description, deadline, goalCategory, answers } = req.body;

  if (!title) {
    res.status(400).json({ error: "Task title is required." });
    return;
  }

  // If API key is not configured, send a simulated high-quality response
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
    const data = generateHighQualitySimulatedAnalysis(title, description, deadline, answers, goalCategory);
    res.json(data);
    return;
  }

  try {
    let answersText = "None provided.";
    if (answers && Array.isArray(answers)) {
      answersText = answers.map((ans: any) => `- Question: "${ans.questionText}"\n  Answer Given: "${ans.answer}"`).join("\n");
    }

    const prompt = `Analyze this task to identify the procrastinator's psychological barrier and generate a 2-minute micro-action:
Task Title: "${title}"
Description: "${description || 'None provided'}"
Deadline: "${deadline || 'None specified'}"
Goal Category: "${goalCategory || 'Other'}"

Adaptive Behavioral Questionnaire Answers:
${answersText}

Evaluate this dynamically using behavioral science (Fogg Behavior Model where B=MAP: Behavior = Motivation * Ability * Prompt, Loss Aversion, Hyperbolic Discounting). 
Generate a response in JSON format. Provide highly motivating, specific, and realistic coaching advice.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        goalCategory: {
          type: Type.STRING,
          description: "One of: Study, Work, Fitness, Business, Personal"
        },
        primaryBarrier: {
          type: Type.STRING,
          description: "Primary psychological barrier, e.g. 'Task Aversion', 'Perfectionism', 'Planning Fallacy', 'Distal Rewards', 'Cognitive Fatigue'"
        },
        secondaryBarrier: {
          type: Type.STRING,
          description: "Secondary psychological barrier"
        },
        confidence: {
          type: Type.INTEGER,
          description: "Estimated follow-through confidence score from 0 to 100 based on answers"
        },
        readinessScore: {
          type: Type.INTEGER,
          description: "Readiness score from 0 to 100"
        },
        reason: {
          type: Type.STRING,
          description: "A summary explanation (max 2 sentences) of their psychological diagnosis from their answers."
        },
        psychologicalBarrier: {
          type: Type.STRING,
          description: "The primary psychological barrier identified (e.g. Perfectionism, Task Aversion, Distal Rewards, Cognitive Overload, Amotivation)."
        },
        explanation: {
          type: Type.STRING,
          description: "A warm, concise (max 2 sentences) explanation of why their brain is delaying this task."
        },
        microAction: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Exactly ONE micro-action that takes less than 2 minutes and has absolute zero friction (e.g., 'Open the document and write 1 bad sentence', 'Scribble 3 words on a post-it note')."
            },
            duration: {
              type: Type.STRING,
              description: "Estimated time, e.g., '60 seconds', '2 minutes'."
            },
            instructions: {
              type: Type.STRING,
              description: "Reassuring, step-by-step guidance on how to do this tiny step."
            }
          },
          required: ["title", "duration", "instructions"]
        },
        todayLossWarning: {
          type: Type.STRING,
          description: "A sharp, personal, context-aware 'Today's Loss Warning' based on Loss Aversion/Hyperbolic Discounting. What do they lose today (guilt-free relaxation, sound sleep, weekend peace) if they skip this 2-minute task?"
        },
        microReward: {
          type: Type.STRING,
          description: "A tiny gamified reward description to trigger a dopamine loop (e.g., '+10 Focus Coins and guilt-free relaxation')."
        },
        identityAffirmation: {
          type: Type.STRING,
          description: "A supportive coaching affirmation that labels them with an identity-based action-taker prefix (e.g., 'You are someone who values taking action and respects their future self')."
        },
        recommendedIntervention: {
          type: Type.STRING,
          description: "The specific intervention type, e.g. 'Fogg B=MAP: Boost Ability by minimizing friction'"
        }
      },
      required: [
        "goalCategory",
        "primaryBarrier",
        "secondaryBarrier",
        "confidence",
        "readinessScore",
        "reason",
        "psychologicalBarrier",
        "explanation",
        "microAction",
        "todayLossWarning",
        "microReward",
        "identityAffirmation",
        "recommendedIntervention"
      ]
    };

    const response = await safeGenerateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are the core behavioral intelligence engine for "Fogg AI" (an AI Execution Companion). You are a world-class Behavioral Psychologist, UX Researcher, and Expert AI Prompt Engineer. Your only responsibility is to analyze a user's daunting task and their adaptive questionnaire answers, identify their psychological barriers, and return a highly structured, actionable workflow that breaks procrastination using the Fogg Behavior Model (B=MAP) and Behavioral Economics. Keep it simple, direct, empathetic, and scientifically sound.`,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2
      }
    });

    let text = response.text?.trim() || "{}";
    // Clean any accidental markdown code blocks if present
    if (text.startsWith("```")) {
      text = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }
    const data = JSON.parse(text);
    res.json(data);
  } catch (error: any) {
    console.log("Gemini task analysis failed or rate limited, falling back to smart offline analyzer:", error.message || error);
    // Graceful fallback to prevent app crashes or blocking users
    const fallbackData = generateHighQualitySimulatedAnalysis(title, description, deadline, answers, goalCategory);
    res.json(fallbackData);
  }
});

// API endpoint for interactive AI Coach Chat
app.post("/api/coach-chat", async (req: Request, res: Response) => {
  const { message, history, task } = req.body;

  if (!message) {
    res.status(400).json({ error: "Message is required." });
    return;
  }

  // Simulated AI coach if key is not available
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
    const data = generateHighQualitySimulatedCoachResponse(message, task);
    res.json(data);
    return;
  }

  try {
    const formattedHistory = (history || []).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

    const systemInstruction = `You are the ultimate Fogg AI Behavioral Coach. Your goal is to guide the user in overcoming procrastination on their active task: "${task?.title}" (Barrier identified: "${task?.analysis?.psychologicalBarrier || 'Procrastination'}").
    
    Adhere strictly to these coaching guidelines:
    1. Be empathetic, scientifically informed, and warm. 
    2. Focus entirely on lowering the bar for entry (Ability focusing). Keep breaking down any friction.
    3. Use BJ Fogg's B=MAP formula: to trigger action, make the step ridiculously tiny.
    4. Keep your replies concise (maximum 3-4 paragraphs), formatting key terms with bold markdown.
    5. Encourage immediate micro-steps. Praise them when they express any progress.`;

    let response;
    const coachModels = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let coachError: any = null;

    for (const model of coachModels) {
      try {
        const chat = ai.chats.create({
          model,
          config: {
            systemInstruction,
          },
          history: formattedHistory
        });
        response = await chat.sendMessage({ message });
        break; // Success
      } catch (err: any) {
        coachError = err;
        console.log(`[Gemini Coach fallback] Chat model ${model} was unavailable. Trying next...`);
      }
    }

    if (!response) {
      throw coachError || new Error("All chat models failed.");
    }

    res.json({ text: response.text });
  } catch (error: any) {
    console.log("Gemini Chat Coach failed, falling back to offline advisor:", error.message || error);
    const fallbackData = generateHighQualitySimulatedCoachResponse(message, task);
    res.json(fallbackData);
  }
});

const generateHighQualitySimulatedNextStep = (
  originalGoal: string,
  description: string = "",
  goalCategory: string = "Other",
  previousCompletedSteps: any[] = [],
  lastStepFeeling: string = "Neutral",
  currentStepNumber: number = 2
) => {
  // Let's create a solid list of logical progress steps based on the category
  const stepsByCategory: Record<string, string[]> = {
    Study: [
      "Open your textbook or lecture slides to the first page.",
      "Read the first subheading and summarize it in one sentence.",
      "Write down the three main keywords or formulas on a blank paper.",
      "Read the next two paragraphs of the most important chapter.",
      "Do one single practice question or write a definition.",
      "Review the notes you just wrote for exactly 2 minutes.",
      "Skim the chapter summary to consolidate your learning."
    ],
    Work: [
      "Open the project document or codebase and create the main workspace/file.",
      "Write down the title and three bullet points outlining the core objective.",
      "Draft the introductory paragraph or the first function header.",
      "Flesh out the next section of the report or write the first test case.",
      "Add two sentences of detail to each of your bullet points.",
      "Do a quick self-review and fix any immediate formatting errors.",
      "Draft a brief summary email or comment explaining your progress."
    ],
    Business: [
      "Create a document named 'Business_Plan_Notes.txt' or open your dashboard.",
      "Draft the core value proposition of your business idea in one sentence.",
      "List three potential customers or target audience groups.",
      "Research one direct competitor and list their main strength.",
      "Draft a 2-sentence outreach or elevator pitch draft.",
      "Define the pricing structure or your main revenue model in simple numbers.",
      "Identify the next major technical or physical hurdle to launch."
    ],
    Fitness: [
      "Put on your activewear and stand in your designated workout area.",
      "Do a gentle 2-minute warmup: stretch your arms and legs or do light pacing.",
      "Perform exactly 5 bodyweight squats or 5 jumping jacks.",
      "Do 5 pushups or a 20-second plank to engage your core.",
      "Walk/jog in place for 3 minutes or do another round of light stretching.",
      "Take 3 deep breaths and record your physical status in a notebook.",
      "Celebrate your movement by drinking a full glass of water."
    ],
    Personal: [
      "Walk to the target room or area and pick up exactly one misplaced item.",
      "Declutter or clean one tiny surface area (e.g. half of your desk).",
      "Put away five items that are currently out of place.",
      "Wipe down or dust the area you just cleared for 60 seconds.",
      "Take a trash bag and throw away or recycle any immediate waste in the room.",
      "Sort the remaining items into two simple piles: 'Keep' and 'Donate/Trash'.",
      "Organize the 'Keep' items back into their designated storage locations."
    ]
  };

  const steps = stepsByCategory[goalCategory] || stepsByCategory["Work"];
  // Determine step title based on currentStepNumber (adjust index, wrapping around if needed)
  const stepIndex = (currentStepNumber - 1) % steps.length;
  let baseTitle = steps[stepIndex];

  // Adjust complexity/size based on lastStepFeeling
  let duration = "2 minutes";
  let instructions = "Take a deep breath. Focus ONLY on this micro-step. Do not think about the rest of the goal.";
  
  if (lastStepFeeling === "Difficult" || lastStepFeeling === "Very Difficult") {
    // Shrink the action drastically
    baseTitle = `Shrunk: ${baseTitle.replace(/\b(read|write|do|perform|clean|research|list|wipe)\b/gi, "Quickly glance at / prep for")}`;
    duration = "60 seconds";
    instructions = `Since the last step felt challenging, we've automatically reduced the size of this step to zero friction. Simply execute this extremely lightweight preparation action. No pressure.`;
  } else if (lastStepFeeling === "Easy") {
    // Increase difficulty or expand
    baseTitle = `Expanded: ${baseTitle} + spend 2 more minutes refining it`;
    duration = "5 minutes";
    instructions = `Since the last step felt easy, you have built solid momentum! Let's keep it going by adding a small progressive challenge. Take your time and go slightly deeper.`;
  } else {
    // Manageable / Neutral
    instructions = `You are doing beautifully! Maintain your steady pace. Focus entirely on completing this single, isolated step.`;
  }

  return {
    microAction: {
      title: baseTitle,
      duration,
      instructions
    },
    todayLossWarning: `If you pause now, you risk breaking your momentum score of ${Math.min(99, 15 + currentStepNumber * 8)}% and re-inviting starting friction.`,
    microReward: `+${lastStepFeeling === "Easy" ? 20 : 15} Focus Coins & Momentum level up!`,
    identityAffirmation: `You are an action-taker who navigates ${lastStepFeeling.toLowerCase()} challenges with resilience.`
  };
};

// API endpoint to generate subsequent micro-actions in a continuous session
app.post("/api/generate-next-step", async (req: Request, res: Response) => {
  const {
    originalGoal,
    description,
    deadline,
    goalCategory,
    behavioralDiagnosis,
    previousCompletedSteps,
    lastStepFeeling,
    currentStepNumber
  } = req.body;

  if (!originalGoal) {
    res.status(400).json({ error: "Original goal title is required." });
    return;
  }

  // If API key is not configured, send a simulated high-quality response
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
    const data = generateHighQualitySimulatedNextStep(
      originalGoal,
      description,
      goalCategory,
      previousCompletedSteps,
      lastStepFeeling,
      currentStepNumber
    );
    res.json(data);
    return;
  }

  try {
    const prompt = `You are Fogg AI's Adaptive Next-Step Generator.
The user is in a continuous execution session.
Goal: "${originalGoal}"
Description: "${description || 'None provided'}"
Deadline: "${deadline || 'None specified'}"
Goal Category: "${goalCategory || 'Other'}"

Behavioral Diagnosis:
- Primary Barrier: "${behavioralDiagnosis?.primaryBarrier || 'None'}"
- Secondary Barrier: "${behavioralDiagnosis?.secondaryBarrier || 'None'}"
- Readiness Score: ${behavioralDiagnosis?.readinessScore || 50}

Completed Steps So Far:
${previousCompletedSteps && previousCompletedSteps.length > 0 ? previousCompletedSteps.map((step: any, idx: number) => `Step ${idx+1}: ${step}`).join("\n") : "None yet (this was their first step)."}

Feedback on Last Step:
The user reported that the last step felt: "${lastStepFeeling || 'Neutral'}"

We are now on Step Number ${currentStepNumber}.

Generate the single next logical, hyper-focused micro-action to build momentum towards the goal.
CRITICAL BEHAVIORAL ADJUSTMENTS:
1. If the user reported the last step felt "Difficult" or "Very Difficult", you MUST automatically reduce the scope and size of this next micro-action (make it extremely low effort, e.g. a 30-to-60-second preparation task).
2. If the user reported the last step felt "Easy", you can gradually and safely increase the scope, challenge, or depth of this step (make it a 3-to-5-minute focused task to capitalize on high momentum).
3. If the user reported the last step felt "Manageable" or "Neutral", maintain a comfortable, steady, bite-sized pace (under 2 minutes).

Do not jump straight to completing the whole goal. Keep it step-by-step.
Return a structured JSON.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        microAction: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "A hyper-focused, extremely concise next micro-action (under 15 words) that represents the immediate next step."
            },
            duration: {
              type: Type.STRING,
              description: "Estimated duration of this micro-action, e.g. '60 seconds', '2 minutes'."
            },
            instructions: {
              type: Type.STRING,
              description: "Clear, encouraging, step-by-step guidance on how to do this tiny step."
            }
          },
          required: ["title", "duration", "instructions"]
        },
        todayLossWarning: {
          type: Type.STRING,
          description: "A sharp, personal, context-aware Today's Loss Warning based on Loss Aversion/Hyperbolic Discounting."
        },
        microReward: {
          type: Type.STRING,
          description: "A tiny gamified reward description to trigger a dopamine loop."
        },
        identityAffirmation: {
          type: Type.STRING,
          description: "A supportive coaching affirmation that labels them with an identity-based action-taker prefix."
        }
      },
      required: ["microAction"]
    };

    const response = await safeGenerateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Fogg AI's Adaptive Next-Step Generator. You generate personalized and progressive micro-steps based on past performance and user feedback.",
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.3
      }
    });

    let text = response.text?.trim() || "{}";
    if (text.startsWith("```")) {
      text = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }
    const data = JSON.parse(text);
    res.json(data);
  } catch (error: any) {
    console.log("Gemini Next Step generation failed, using fallback:", error.message || error);
    const fallbackData = generateHighQualitySimulatedNextStep(
      originalGoal,
      description,
      goalCategory,
      previousCompletedSteps,
      lastStepFeeling,
      currentStepNumber
    );
    res.json(fallbackData);
  }
});


// Express serving configuration (Vite integration for Development and Production)
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Fogg AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
