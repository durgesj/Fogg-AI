export interface AssessmentQuestion {
  id: string;
  text: string;
  type: 'slider' | 'choice';
  choices?: string[];
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  dimension: 'motivation' | 'confidence' | 'difficulty' | 'progress' | 'blocker';
}

export const CATEGORIES = [
  "Study",
  "Work",
  "Business",
  "Fitness",
  "Personal",
  "Health",
  "Finance",
  "Career",
  "Creative",
  "Other"
] as const;

export type GoalCategory = typeof CATEGORIES[number];

export const DEFAULT_QUESTION_BANK: Record<GoalCategory, AssessmentQuestion[]> = {
  Study: [
    {
      id: "study_motivation_1",
      text: "How energized do you feel to study this material right now?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Zero energy",
      maxLabel: "Extremely hyped",
      dimension: "motivation"
    },
    {
      id: "study_motivation_2",
      text: "How important is mastering this specific subject to your long-term goals?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Not important",
      maxLabel: "Life-changing",
      dimension: "motivation"
    },
    {
      id: "study_confidence_1",
      text: "How confident are you that you can grasp this concepts without getting stuck?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Very confused",
      maxLabel: "Completely clear",
      dimension: "confidence"
    },
    {
      id: "study_confidence_2",
      text: "How confident are you that you will score well or pass if tested on this soon?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Panic mode",
      maxLabel: "Total mastery",
      dimension: "confidence"
    },
    {
      id: "study_difficulty_1",
      text: "How dense or complex does this study material feel to your brain?",
      type: "choice",
      choices: [
        "Light reading (Just needs time)",
        "Moderately tricky (Requires focus)",
        "Extremely technical/dense",
        "Total gibberish (No clue what it means)"
      ],
      dimension: "difficulty"
    },
    {
      id: "study_difficulty_2",
      text: "What part of this study task feels like it will require the most brainpower?",
      type: "choice",
      choices: [
        "Memorizing random facts/terms",
        "Solving complex analytical problems",
        "Writing a long, structured essay",
        "Just sitting still and reading"
      ],
      dimension: "difficulty"
    },
    {
      id: "study_progress_1",
      text: "Where do you currently stand with this study material?",
      type: "choice",
      choices: [
        "Haven't even opened the book",
        "Looked at the syllabus/first slide",
        "In the middle but completely stalled",
        "Just need to review and polish"
      ],
      dimension: "progress"
    },
    {
      id: "study_progress_2",
      text: "How much syllabus or study content is remaining for this goal?",
      type: "choice",
      choices: [
        "Almost 100% (The whole thing)",
        "About 75% remains unread",
        "Roughly 50% remains",
        "Less than 25% (Nearly finished)"
      ],
      dimension: "progress"
    },
    {
      id: "study_blocker_1",
      text: "What is the biggest mental block stopping you from studying?",
      type: "choice",
      choices: [
        "It's incredibly dry and boring",
        "I am terrified of failing the test",
        "The sheer volume feels paralyzing",
        "My phone and social media are too tempting"
      ],
      dimension: "blocker"
    },
    {
      id: "study_blocker_2",
      text: "Which of these study-related fears is whispering in your ear?",
      type: "choice",
      choices: [
        "Fear that I'm not smart enough",
        "Fear of wasting hours and getting nowhere",
        "Resentment that I have to study this at all",
        "Exhaustion from other academic pressures"
      ],
      dimension: "blocker"
    }
  ],
  Work: [
    {
      id: "work_motivation_1",
      text: "How driven or motivated do you feel to deliver this work item?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Forcing myself",
      maxLabel: "Fully locked in",
      dimension: "motivation"
    },
    {
      id: "work_motivation_2",
      text: "How much external pressure (boss, client, peers) is on you for this?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Zero pressure",
      maxLabel: "Extreme scrutiny",
      dimension: "motivation"
    },
    {
      id: "work_confidence_1",
      text: "How confident are you that you can execute this work without guidance?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Need total help",
      maxLabel: "I am the expert",
      dimension: "confidence"
    },
    {
      id: "work_confidence_2",
      text: "How confident are you that the final result will meet professional expectations?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Imposter syndrome",
      maxLabel: "Flawless delivery",
      dimension: "confidence"
    },
    {
      id: "work_difficulty_1",
      text: "How cognitively demanding is this professional task?",
      type: "choice",
      choices: [
        "Brainless grunt work (Just tedious)",
        "Standard execution (Requires effort)",
        "Highly strategic (Critical thinking needed)",
        "Overwhelming (Way outside my comfort zone)"
      ],
      dimension: "difficulty"
    },
    {
      id: "work_difficulty_2",
      text: "Which aspect of this project is creating the highest cognitive load?",
      type: "choice",
      choices: [
        "Structuring the massive outline/draft",
        "Integrating feedback or requirements",
        "The technical coding or math aspects",
        "Communicating or presenting it"
      ],
      dimension: "difficulty"
    },
    {
      id: "work_progress_1",
      text: "What is your current progress on this professional deliverable?",
      type: "choice",
      choices: [
        "Completely blank page",
        "A few scattered notes/rough bullet points",
        "First draft complete but messy",
        "90% finished, just needs polishing"
      ],
      dimension: "progress"
    },
    {
      id: "work_progress_2",
      text: "How many times have you put off starting this specific task?",
      type: "choice",
      choices: [
        "This is my first attempt",
        "Delayed it for a day or two",
        "Procrastinating on this for over a week",
        "It's a chronic backlog item (weeks old)"
      ],
      dimension: "progress"
    },
    {
      id: "work_blocker_1",
      text: "What is the primary starting friction you are experiencing?",
      type: "choice",
      choices: [
        "The task feels incredibly boring/dry",
        "Vague directions (Not sure what to do first)",
        "Fear of making mistakes or being judged",
        "Burnout and physical fatigue"
      ],
      dimension: "blocker"
    },
    {
      id: "work_blocker_2",
      text: "What micro-distraction usually steals your work momentum?",
      type: "choice",
      choices: [
        "Checking Slack/emails endlessly",
        "Going to grab snacks or coffee",
        "Reading news or articles",
        "Helping others with their tasks instead"
      ],
      dimension: "blocker"
    }
  ],
  Business: [
    {
      id: "biz_motivation_1",
      text: "How passionate and excited are you about this business milestone?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Feeling indifferent",
      maxLabel: "Pure founder energy",
      dimension: "motivation"
    },
    {
      id: "biz_motivation_2",
      text: "How critical is this specific task to your business's survival or growth?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Minor detail",
      maxLabel: "Make or break",
      dimension: "motivation"
    },
    {
      id: "biz_confidence_1",
      text: "How confident are you that this step will yield positive results?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Very risky/uncertain",
      maxLabel: "Guaranteed win",
      dimension: "confidence"
    },
    {
      id: "biz_confidence_2",
      text: "How confident are you in your ability to pitch, sell, or market this?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Imposter syndrome",
      maxLabel: "Natural sales leader",
      dimension: "confidence"
    },
    {
      id: "biz_difficulty_1",
      text: "What makes this entrepreneurial task feel complicated?",
      type: "choice",
      choices: [
        "Legal/administrative hurdles",
        "Marketing and reaching out to strangers",
        "Product/technical development friction",
        "Financial modeling or pricing decisions"
      ],
      dimension: "difficulty"
    },
    {
      id: "biz_difficulty_2",
      text: "How clear is the strategic execution roadmap for this task?",
      type: "choice",
      choices: [
        "Crystal clear step-by-step plan",
        "I have a general idea but need to research",
        "Vague and depends on market reactions",
        "Totally blind (No idea what is best)"
      ],
      dimension: "difficulty"
    },
    {
      id: "biz_progress_1",
      text: "What have you accomplished on this business task so far?",
      type: "choice",
      choices: [
        "Just a mental concept",
        "Written basic strategy or raw pitch",
        "Set up landing page or initial wireframe",
        "Tested a draft/prototype, now iterating"
      ],
      dimension: "progress"
    },
    {
      id: "biz_progress_2",
      text: "Is this business milestone dependent on someone else?",
      type: "choice",
      choices: [
        "No, entirely up to me",
        "Yes, waiting for a partner/contractor",
        "Waiting for client response/approval",
        "Need funding/budget approval first"
      ],
      dimension: "progress"
    },
    {
      id: "biz_blocker_1",
      text: "What feels like the biggest emotional block in your business venture?",
      type: "choice",
      choices: [
        "Fear of rejection, criticism, or cold calls",
        "Analysis paralysis (Overthinking every detail)",
        "Overwhelmed by the number of hats I have to wear",
        "Fear of spending money and getting no return"
      ],
      dimension: "blocker"
    },
    {
      id: "biz_blocker_2",
      text: "Which psychological trap are you currently experiencing?",
      type: "choice",
      choices: [
        "Perfectionism (Delaying launch until flawless)",
        "Product focus (Avoiding marketing/sales tasks)",
        "Shiny Object Syndrome (Wanting to start a new idea)",
        "Imposter syndrome (Am I really a founder?)"
      ],
      dimension: "blocker"
    }
  ],
  Fitness: [
    {
      id: "fit_motivation_1",
      text: "How much physical or mental energy do you have for a workout today?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Running on empty",
      maxLabel: "Beast mode ready",
      dimension: "motivation"
    },
    {
      id: "fit_motivation_2",
      text: "How important is staying consistent with your workout schedule this week?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Can skip easily",
      maxLabel: "Absolute priority",
      dimension: "motivation"
    },
    {
      id: "fit_confidence_1",
      text: "How confident are you that you can complete the intended routine?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Will quit early",
      maxLabel: "100% completion",
      dimension: "confidence"
    },
    {
      id: "fit_confidence_2",
      text: "How confident are you in your form and knowledge of this exercise?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Might injure myself",
      maxLabel: "Expert form",
      dimension: "confidence"
    },
    {
      id: "fit_difficulty_1",
      text: "How physically intimidating does this workout feel to you right now?",
      type: "choice",
      choices: [
        "A light stretch or walk (Zero effort)",
        "Moderate aerobic/weights (Comfortable)",
        "High intensity/heavy weights (Challenging)",
        "Grueling session (Exhausting to think about)"
      ],
      dimension: "difficulty"
    },
    {
      id: "fit_difficulty_2",
      text: "What is the physical nature of your fitness task today?",
      type: "choice",
      choices: [
        "Strength / Resistance training",
        "Cardio / Running / Cycling",
        "Mobility / Yoga / Rehabilitation",
        "Outdoor sports / Active recreation"
      ],
      dimension: "difficulty"
    },
    {
      id: "fit_progress_1",
      text: "What preparation steps have you taken so far?",
      type: "choice",
      choices: [
        "Sitting on the couch in work clothes",
        "Found my activewear and shoes",
        "Fully dressed and standing in exercise space",
        "Already started a quick warmup stretch"
      ],
      dimension: "progress"
    },
    {
      id: "fit_progress_2",
      text: "How active have you been in the past 7 days?",
      type: "choice",
      choices: [
        "Zero workouts (Complete couch potato)",
        "1-2 sessions (Struggling to stay regular)",
        "3-4 sessions (Solid momentum)",
        "Daily movement (Extremely active)"
      ],
      dimension: "progress"
    },
    {
      id: "fit_blocker_1",
      text: "What is the main excuse your brain is making to skip this workout?",
      type: "choice",
      choices: [
        "I am too physically tired or sore",
        "I don't have enough time right now",
        "Going to the gym or setting up is too high friction",
        "Exercise feels incredibly boring"
      ],
      dimension: "blocker"
    },
    {
      id: "fit_blocker_2",
      text: "Which environmental trigger is holding you back?",
      type: "choice",
      choices: [
        "Cold/bad weather outside",
        "A cluttered workout space or packed gym",
        "Lack of a workout buddy or tracking app",
        "Comfortable couch and active TV/gaming setup"
      ],
      dimension: "blocker"
    }
  ],
  Personal: [
    {
      id: "pers_motivation_1",
      text: "How motivated are you to handle this personal task or chore?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Hate doing it",
      maxLabel: "Ready to clean/fix",
      dimension: "motivation"
    },
    {
      id: "pers_motivation_2",
      text: "How annoying is it to have this chore lingering on your mind?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Doesn't bother me",
      maxLabel: "Constantly irritating",
      dimension: "motivation"
    },
    {
      id: "pers_confidence_1",
      text: "How confident are you that you can finish this quickly once you start?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "It will take hours",
      maxLabel: "Done in 5 minutes",
      dimension: "confidence"
    },
    {
      id: "pers_confidence_2",
      text: "How confident are you that you have all the tools/supplies to do this?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "No supplies ready",
      maxLabel: "Fully stocked",
      dimension: "confidence"
    },
    {
      id: "pers_difficulty_1",
      text: "How would you describe the physical or mental friction of this chore?",
      type: "choice",
      choices: [
        "Mindless and boring (e.g., laundry, dishes)",
        "Messy and physical (e.g., deep cleaning, fixing)",
        "Complex coordination (e.g., booking flights, planning)",
        "Awkward social friction (e.g., calling customer service)"
      ],
      dimension: "difficulty"
    },
    {
      id: "pers_difficulty_2",
      text: "How much active organization is required for this personal goal?",
      type: "choice",
      choices: [
        "Zero setup, just do it",
        "Light sorting or cleaning of tools",
        "Decluttering a major physical area",
        "Meticulous planning and digital cataloging"
      ],
      dimension: "difficulty"
    },
    {
      id: "pers_progress_1",
      text: "Have you made any attempt to tackle this chore recently?",
      type: "choice",
      choices: [
        "Completely ignored it for weeks",
        "Stared at the mess but walked away",
        "Started a tiny bit (e.g. piled clothes)",
        "Halfway done, just abandoned it"
      ],
      dimension: "progress"
    },
    {
      id: "pers_progress_2",
      text: "How visible is the clutter or task in your daily living space?",
      type: "choice",
      choices: [
        "Tucked away in a drawer/closet (Out of sight)",
        "In a corner, I can easily ignore it",
        "Directly in my line of sight daily",
        "Overrunning my space, causing active stress"
      ],
      dimension: "progress"
    },
    {
      id: "pers_blocker_1",
      text: "What is your brain's primary objection to doing this right now?",
      type: "choice",
      choices: [
        "It's just incredibly boring/tedious",
        "I'd rather scroll, play games, or relax",
        "I don't know where to start sorting",
        "I am too tired after work/school"
      ],
      dimension: "blocker"
    },
    {
      id: "pers_blocker_2",
      text: "What reward or relief would completing this task bring you?",
      type: "choice",
      choices: [
        "A tidy, clean, relaxing living room/desk",
        "Mental relief of crossing off a lingering task",
        "Stopping partners/family from nagging me",
        "No major relief, just standard maintenance"
      ],
      dimension: "blocker"
    }
  ],
  Health: [
    {
      id: "health_motivation_1",
      text: "How committed are you to prioritizing this health/wellness habit today?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Ignoring health",
      maxLabel: "Health is wealth",
      dimension: "motivation"
    },
    {
      id: "health_motivation_2",
      text: "How much is your physical well-being actively suffering due to this delay?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Feeling fine",
      maxLabel: "Active pain/stress",
      dimension: "motivation"
    },
    {
      id: "health_confidence_1",
      text: "How confident are you that you can stick to this diet or medical routine?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Will cheat/fail",
      maxLabel: "100% disciplined",
      dimension: "confidence"
    },
    {
      id: "health_confidence_2",
      text: "How confident are you in navigating health systems or booking care?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Paralyzed by admin",
      maxLabel: "No worries",
      dimension: "confidence"
    },
    {
      id: "health_difficulty_1",
      text: "What makes this health-related step feel difficult?",
      type: "choice",
      choices: [
        "Breaking a deeply ingrained bad habit",
        "Enduring tedious administration/booking",
        "The physical discomfort involved",
        "Unclear instructions or dietary rules"
      ],
      dimension: "difficulty"
    },
    {
      id: "health_difficulty_2",
      text: "How much active lifestyle adjustment does this wellness task require?",
      type: "choice",
      choices: [
        "Just a 1-minute action (taking a pill)",
        "A light habit adjustment (drinking water)",
        "A major daily sacrifice (diet change)",
        "High friction setup (scheduling medical visit)"
      ],
      dimension: "difficulty"
    },
    {
      id: "health_progress_1",
      text: "When was the last time you successfully practiced this health habit?",
      type: "choice",
      choices: [
        "Never (A completely new regime)",
        "More than a month ago",
        "Sometime in the last week",
        "Yesterday (Trying to maintain a streak)"
      ],
      dimension: "progress"
    },
    {
      id: "health_progress_2",
      text: "Have you gathered the required wellness tools (supplements, water bottle, etc.)?",
      type: "choice",
      choices: [
        "No, don't have them yet",
        "Ordered/bought but not accessible",
        "On my desk/counter but unopened",
        "Fully prepared and ready to consume"
      ],
      dimension: "progress"
    },
    {
      id: "health_blocker_1",
      text: "What is the primary psychological barrier behind this health delay?",
      type: "choice",
      choices: [
        "Anxiety or fear of medical diagnosis/dentists",
        "Craving unhealthy comfort alternatives",
        "Forgetting to do it (Out of sight, out of mind)",
        "Feeling like the effort won't make a difference"
      ],
      dimension: "blocker"
    },
    {
      id: "health_blocker_2",
      text: "How does your brain justify avoiding this self-care task?",
      type: "choice",
      choices: [
        "'I'll start tomorrow, one more cheat day'",
        "'I'm too busy taking care of others'",
        "'It's too expensive or high hassle'",
        "'I'm too young/healthy to worry about this'"
      ],
      dimension: "blocker"
    }
  ],
  Finance: [
    {
      id: "fin_motivation_1",
      text: "How motivated are you to organize your personal finances today?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Sticking head in sand",
      maxLabel: "Master of money",
      dimension: "motivation"
    },
    {
      id: "fin_motivation_2",
      text: "How much financial anxiety is this pending task causing you?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Zero worry",
      maxLabel: "Constant panic",
      dimension: "motivation"
    },
    {
      id: "fin_confidence_1",
      text: "How confident are you that you can budget or manage this math?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Math phobic",
      maxLabel: "Excel wizard",
      dimension: "confidence"
    },
    {
      id: "fin_confidence_2",
      text: "How confident are you in your short-term financial safety?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Paycheck to paycheck",
      maxLabel: "Very secure",
      dimension: "confidence"
    },
    {
      id: "fin_difficulty_1",
      text: "What is the core technical friction of this financial task?",
      type: "choice",
      choices: [
        "Sifting through endless bank statement lines",
        "Completing official government tax paperwork",
        "Comparing complicated investment options",
        "Simply setting up a standard budget sheet"
      ],
      dimension: "difficulty"
    },
    {
      id: "fin_difficulty_2",
      text: "How clear are the numerical inputs needed for this task?",
      type: "choice",
      choices: [
        "Fully compiled on my laptop",
        "Scattered across physical receipts/emails",
        "Need to request them from banks/peers",
        "Totally unknown, need to guess"
      ],
      dimension: "difficulty"
    },
    {
      id: "fin_progress_1",
      text: "How long have you been putting off this budget/bill/tax task?",
      type: "choice",
      choices: [
        "Just came up today",
        "A few days (Slightly past due)",
        "Over two weeks",
        "Months (A chronic, dreaded burden)"
      ],
      dimension: "progress"
    },
    {
      id: "fin_progress_2",
      text: "Have you logged into the relevant banking portal or spreadsheet?",
      type: "choice",
      choices: [
        "No, active avoidance",
        "Browser tab is open but untouched",
        "Logged in and looking at the numbers",
        "Partially drafted/calculated already"
      ],
      dimension: "progress"
    },
    {
      id: "fin_blocker_1",
      text: "What emotional block are you experiencing with this financial chore?",
      type: "choice",
      choices: [
        "Fear of seeing how much money I spent",
        "Resentment over paying bills/taxes",
        "Sheer boredom of manual calculation",
        "Anxiety about making a bad investment/decision"
      ],
      dimension: "blocker"
    },
    {
      id: "fin_blocker_2",
      text: "Which mental defense mechanism is currently active?",
      type: "choice",
      choices: [
        "Denial ('If I don't look at my bank, it's fine')",
        "Defeatism ('I'm bad with money, why bother?')",
        "Distraction ('Let me shop or scroll to feel better')",
        "Optimism bias ('I will earn more next month')"
      ],
      dimension: "blocker"
    }
  ],
  Career: [
    {
      id: "car_motivation_1",
      text: "How ambitious and motivated do you feel to grow your career today?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Feeling stuck/coasting",
      maxLabel: "Career climber",
      dimension: "motivation"
    },
    {
      id: "car_motivation_2",
      text: "How urgent is finding a new job or landing a promotion?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "No rush at all",
      maxLabel: "Extremely urgent",
      dimension: "motivation"
    },
    {
      id: "car_confidence_1",
      text: "How confident are you in the strength of your resume or CV?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Very outdated/weak",
      maxLabel: "World-class pedigree",
      dimension: "confidence"
    },
    {
      id: "car_confidence_2",
      text: "How confident are you in passing an interview or networking call?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Complete stage fright",
      maxLabel: "Extremely charming",
      dimension: "confidence"
    },
    {
      id: "car_difficulty_1",
      text: "What feels like the most challenging aspect of your career search?",
      type: "choice",
      choices: [
        "Drafting resumes and custom cover letters",
        "Reaching out or networking on LinkedIn",
        "Prepping for technical/case interviews",
        "Filling out endless corporate job portals"
      ],
      dimension: "difficulty"
    },
    {
      id: "car_difficulty_2",
      text: "How clear is your target job or industry direction?",
      type: "choice",
      choices: [
        "Laser-focused on a specific role",
        "Choosing between 2 distinct paths",
        "Broad search (Applying to anything)",
        "Completely lost (Don't know what I want)"
      ],
      dimension: "difficulty"
    },
    {
      id: "car_progress_1",
      text: "What is your current progress on this career milestone?",
      type: "choice",
      choices: [
        "No CV or profile set up",
        "Resume drafted but not optimized",
        "CV is polished, but haven't applied/reached out",
        "Active interviews ongoing, need to follow up"
      ],
      dimension: "progress"
    },
    {
      id: "car_progress_2",
      text: "How many job applications or networking messages have you sent this month?",
      type: "choice",
      choices: [
        "Absolutely zero",
        "1 to 5 (Slight effort)",
        "6 to 20 (Consistent applications)",
        "20+ (Aggressive search)"
      ],
      dimension: "progress"
    },
    {
      id: "car_blocker_1",
      text: "What psychological hurdle is keeping you from advancing?",
      type: "choice",
      choices: [
        "Fear of rejection or ghosting by recruiters",
        "Imposter syndrome ('I'm not qualified')",
        "Exhaustion from a toxic current job",
        "Tedium of filling out identical forms"
      ],
      dimension: "blocker"
    },
    {
      id: "car_blocker_2",
      text: "What excuses are holding your networking efforts back?",
      type: "choice",
      choices: [
        "'I don't want to bother busy professionals'",
        "'I'm too introverted for networking'",
        "'My resume isn't perfect enough yet'",
        "'Nobody is hiring right now anyway'"
      ],
      dimension: "blocker"
    }
  ],
  Creative: [
    {
      id: "cre_motivation_1",
      text: "How strong is your creative spark or inspiration today?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Complete block",
      maxLabel: "Overflowing ideas",
      dimension: "motivation"
    },
    {
      id: "cre_motivation_2",
      text: "How important is completing this creative piece to your personal identity?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Just a hobby",
      maxLabel: "My absolute calling",
      dimension: "motivation"
    },
    {
      id: "cre_confidence_1",
      text: "How confident are you in your artistic or technical skill for this piece?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Doubt my talent",
      maxLabel: "Complete mastery",
      dimension: "confidence"
    },
    {
      id: "cre_confidence_2",
      text: "How confident are you that other people will appreciate or buy this work?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Fear of ridicule",
      maxLabel: "They will love it",
      dimension: "confidence"
    },
    {
      id: "cre_difficulty_1",
      text: "What part of the creative process is blocking you right now?",
      type: "choice",
      choices: [
        "Staring at the blank page/canvas (Initial idea)",
        "Developing details and structural flow",
        "Editing, revising, and cutting down draft",
        "Publishing, exporting, or uploading it"
      ],
      dimension: "difficulty"
    },
    {
      id: "cre_difficulty_2",
      text: "How would you describe the style of this creative project?",
      type: "choice",
      choices: [
        "Strictly written word (Fiction, essay, poem)",
        "Visual design/art (Draw, paint, edit, render)",
        "Audio/Music composition or production",
        "Video editing / Interactive media design"
      ],
      dimension: "difficulty"
    },
    {
      id: "cre_progress_1",
      text: "Where are you on this creative journey?",
      type: "choice",
      choices: [
        "An abstract idea in my head",
        "A few scribbles, sketches, or test files",
        "A solid draft/prototype that needs iteration",
        "Practically finished, just avoiding the final upload"
      ],
      dimension: "progress"
    },
    {
      id: "cre_progress_2",
      text: "How often do you suffer from 'blank page' anxiety?",
      type: "choice",
      choices: [
        "Never, I start easily but struggle to finish",
        "Occasionally, but I can overcome it",
        "Frequently, it takes hours to start",
        "Always, I feel completely paralyzed by a blank page"
      ],
      dimension: "progress"
    },
    {
      id: "cre_blocker_1",
      text: "What mental resistance is blocking your artistic flow?",
      type: "choice",
      choices: [
        "Fear of making bad, ugly, or embarrassing art",
        "Overthinking the concept instead of creating",
        "Distractions from high-dopamine video games/feeds",
        "Burnout and fatigue from non-creative demands"
      ],
      dimension: "blocker"
    },
    {
      id: "cre_blocker_2",
      text: "Which artistic shadow is holding your hand back?",
      type: "choice",
      choices: [
        "Extreme perfectionism ('It must be a masterpiece')",
        "Self-doubt ('I am a fraud / imposter')",
        "Lack of designated creative space or quiet",
        "Comparison to highly successful viral creators"
      ],
      dimension: "blocker"
    }
  ],
  Other: [
    {
      id: "oth_motivation_1",
      text: "How driven are you to get this unique task done today?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Extremely sluggish",
      maxLabel: "Laser focused",
      dimension: "motivation"
    },
    {
      id: "oth_motivation_2",
      text: "How much is this task lingering in your thoughts and causing background stress?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Zero stress",
      maxLabel: "Major mental weight",
      dimension: "motivation"
    },
    {
      id: "oth_confidence_1",
      text: "How confident are you that you can finish this without outside support?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "No clue what to do",
      maxLabel: "Absolute confidence",
      dimension: "confidence"
    },
    {
      id: "oth_confidence_2",
      text: "How confident are you that taking action today will solve the underlying issue?",
      type: "slider",
      min: 1,
      max: 10,
      minLabel: "Highly skeptical",
      maxLabel: "Fully guaranteed",
      dimension: "confidence"
    },
    {
      id: "oth_difficulty_1",
      text: "How complex is the execution of this particular task?",
      type: "choice",
      choices: [
        "Super simple (Just requires showing up)",
        "Moderate (Requires planning and attention)",
        "Complicated (Lots of small moving parts)",
        "Highly ambiguous (Vague goals and steps)"
      ],
      dimension: "difficulty"
    },
    {
      id: "oth_difficulty_2",
      text: "What kind of resources are required for this action?",
      type: "choice",
      choices: [
        "Just a computer and internet connection",
        "Physical materials / tools / travel",
        "Social interaction / phone calls / meetings",
        "Heavy physical labor / strength"
      ],
      dimension: "difficulty"
    },
    {
      id: "oth_progress_1",
      text: "What preliminary action have you taken for this goal?",
      type: "choice",
      choices: [
        "Absolutely nothing",
        "Thought about it or researched a tiny bit",
        "Wrote down some plans/tasks",
        "Started but stalled early on"
      ],
      dimension: "progress"
    },
    {
      id: "oth_progress_2",
      text: "How long has this task remained in your queue?",
      type: "choice",
      choices: [
        "Brand new task",
        "A few days",
        "A couple of weeks",
        "More than a month"
      ],
      dimension: "progress"
    },
    {
      id: "oth_blocker_1",
      text: "What is the primary cognitive block holding you back?",
      type: "choice",
      choices: [
        "It's tedious, boring, and unstimulating",
        "Fear of the consequences of finishing or failing",
        "Overwhelmed by other life obligations",
        "I just keep forgetting about it"
      ],
      dimension: "blocker"
    },
    {
      id: "oth_blocker_2",
      text: "Which resistance pattern matches your current state?",
      type: "choice",
      choices: [
        "Active procrastination (Doing other easy tasks instead)",
        "Passive procrastination (Paralyzed, doing nothing)",
        "Perfectionism (Waiting for 'perfect' conditions)",
        "Avoidance of emotional discomfort"
      ],
      dimension: "blocker"
    }
  ]
};

/**
 * Instantly categorizes a task based on lightweight local keyword matching.
 */
export function detectCategory(title: string, description: string = ""): GoalCategory {
  const text = `${title} ${description}`.toLowerCase();
  
  if (/\b(study|exam|learn|read|class|course|quiz|test|math|homework|assignment|lecture|biology|physics|chemistry|history|school|college|university|vocabulary|memorize|degree)\b/.test(text)) {
    return "Study";
  }
  if (/\b(workout|gym|exercise|run|cardio|fitness|yoga|stretch|lift|training|jog|swim|weights|cycle|pushup|plank)\b/.test(text)) {
    return "Fitness";
  }
  if (/\b(health|doctor|medicine|diet|water|sleep|clinic|appointment|therapy|dentist|nutrition|meditation|supplement|vitamins)\b/.test(text)) {
    return "Health";
  }
  if (/\b(business|start|startup|marketing|launch|client|revenue|pitch|funding|strategy|partner|sales|product|analytics|incorporate)\b/.test(text)) {
    return "Business";
  }
  if (/\b(finance|money|budget|tax|bill|invoice|save|credit|bank|invest|pay|expense|debt|portfolio)\b/.test(text)) {
    return "Finance";
  }
  if (/\b(career|resume|cv|interview|job|apply|linkedin|networking|promotion|portfolio|recruiter|negotiation)\b/.test(text)) {
    return "Career";
  }
  if (/\b(creative|write|draw|paint|music|design|video|art|draft|essay|poem|song|sketch|illustrate|craft|photography|edit)\b/.test(text)) {
    return "Creative";
  }
  if (/\b(work|project|report|email|meeting|schedule|presentation|code|develop|slack|jira|spreadsheet|docs|task|admin)\b/.test(text)) {
    return "Work";
  }
  if (/\b(personal|groceries|cleaning|laundry|organize|home|family|declutter|call|gift|chores|vacation|trip|booking)\b/.test(text)) {
    return "Personal";
  }
  return "Other";
}

/**
 * Get or load from cache the question bank. Caches locally so repeated assessments are instantaneous.
 */
export function getLocalQuestionBank(): Record<GoalCategory, AssessmentQuestion[]> {
  const CACHE_KEY = "fogg_question_bank_cache";
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.warn("Failed to read question bank cache:", e);
  }
  
  // Write to cache so next loads read from cache
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(DEFAULT_QUESTION_BANK));
  } catch (e) {
    console.warn("Failed to write question bank cache:", e);
  }
  return DEFAULT_QUESTION_BANK;
}

/**
 * Instantly retrieves exactly 5 questions for a category, selecting one from each of the 5 key dimensions:
 * motivation, confidence, difficulty, progress, blocker.
 * This guarantees a high-quality multi-dimensional assessment dataset.
 */
export function getInstantQuestions(category: GoalCategory): AssessmentQuestion[] {
  const bank = getLocalQuestionBank();
  const catQuestions = bank[category] || bank["Other"];
  
  const dimensions: AssessmentQuestion["dimension"][] = [
    "motivation",
    "confidence",
    "difficulty",
    "progress",
    "blocker"
  ];
  
  const selected: AssessmentQuestion[] = [];
  
  dimensions.forEach((dim) => {
    // Find all questions of this dimension in the category
    const matches = catQuestions.filter((q) => q.dimension === dim);
    if (matches.length > 0) {
      // Pick a random match, or fallback to the first one
      const idx = Math.floor(Math.random() * matches.length);
      selected.push(matches[idx]);
    }
  });
  
  // Return selected questions, if for some reason we don't have all 5, fill up from general questions
  if (selected.length < 5) {
    const usedIds = new Set(selected.map((q) => q.id));
    for (const q of catQuestions) {
      if (selected.length >= 5) break;
      if (!usedIds.has(q.id)) {
        selected.push(q);
        usedIds.add(q.id);
      }
    }
  }
  
  return selected;
}
