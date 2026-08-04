/**
 * Seed language-sample library: ≥3 sessions per client.
 * Voices: one shared therapist + one unique client voice (never shared across clients).
 * Transcripts are written so analytics (TTR, MLU, engagement) align with each
 * client's clinical profile / rating-scale pattern in seed data.
 */

import type { LanguageSampleType } from "../lib/sessionAnalytics";
import type { TranscriptTurn } from "./sampleSession";

export type SessionMode = "demo";

export interface SessionDef {
  id: string;
  clientId: string;
  title: string;
  /** Days before today for seed createdAt */
  daysAgo: number;
  /** Filename under /samples/ */
  audioFile: string;
  therapistVoice: string;
  clientVoice: string;
  /** Clinical sample elicitation type */
  sampleType: LanguageSampleType;
  /** Clinical rationale for demo consistency */
  profileNote: string;
  turns: Omit<TranscriptTurn, "id" | "startSec" | "endSec">[];
}

/** Shared clinician voice across every dyad. */
export const THERAPIST_VOICE = "Samantha";

/**
 * One stable client voice each (must not overlap).
 * Maya → Junior (younger child)
 * Jordan → Fred (male middle-school)
 * Sam → Kathy
 * Alex → Albert
 */
export const CLIENT_VOICES: Record<string, string> = {
  "cli-maya": "Junior",
  "cli-jordan": "Fred",
  "cli-sam": "Kathy",
  "cli-alex": "Albert",
};

function t(
  speaker: "therapist" | "client",
  text: string
): Omit<TranscriptTurn, "id" | "startSec" | "endSec"> {
  return { speaker, text };
}

/**
 * Maya Rivera — social communication / peer-interaction referral (SRS pending).
 * Pattern: short, concrete answers; thin social detail; lower reciprocity.
 * Sessions stay in the same mild–elevated concern band.
 */
const MAYA_SESSIONS: SessionDef[] = [
  {
    id: "sess-maya-01-recess",
    clientId: "cli-maya",
    title: "Language sample — recess with peers",
    daysAgo: 14,
    audioFile: "maya-01-recess.wav",
    therapistVoice: THERAPIST_VOICE,
    clientVoice: CLIENT_VOICES["cli-maya"],
    sampleType: "conversation",
    profileNote:
      "Sparse peer narrative; short MLU; limited social vocabulary (matches social communication referral).",
    turns: [
      t("therapist", "Hi Maya. Tell me about recess today. Who did you play with?"),
      t("client", "I sat. I watched kids. I had my snack."),
      t("therapist", "Did anyone invite you to join a game?"),
      t("client", "No. I stayed by the wall."),
      t("therapist", "What do other kids usually do at recess?"),
      t("client", "They run. They yell. It is loud."),
      t("therapist", "Is there a game you would like to try?"),
      t("client", "Maybe balls. I do not know how."),
      t("therapist", "Who could you ask for help?"),
      t("client", "I do not know. Maybe the aide."),
      t("therapist", "Thanks for telling me. We will practice asking next time."),
      t("client", "Okay."),
    ],
  },
  {
    id: "sess-maya-02-friend",
    clientId: "cli-maya",
    title: "Language sample — describing a friend",
    daysAgo: 7,
    audioFile: "maya-02-friend.wav",
    therapistVoice: THERAPIST_VOICE,
    clientVoice: CLIENT_VOICES["cli-maya"],
    sampleType: "conversation",
    profileNote: "Limited social descriptors; few elaborations after prompts.",
    turns: [
      t("therapist", "Maya, can you tell me about a friend at school?"),
      t("client", "There is a girl. Her name is Ava."),
      t("therapist", "What do you like about Ava?"),
      t("client", "She is nice. She has long hair."),
      t("therapist", "What do you and Ava do together?"),
      t("client", "Sometimes art. We color. We do not talk much."),
      t("therapist", "How do you know when Ava wants to play?"),
      t("client", "She looks at me. Or she sits near me."),
      t("therapist", "What could you say to start a conversation?"),
      t("client", "Hi. Want to color? That is hard."),
      t("therapist", "That is a great start. We can practice those words."),
      t("client", "Okay. Hi. Want to color."),
    ],
  },
  {
    id: "sess-maya-03-weekend",
    clientId: "cli-maya",
    title: "Language sample — weekend narrative",
    daysAgo: 1,
    audioFile: "maya-03-weekend.wav",
    therapistVoice: THERAPIST_VOICE,
    clientVoice: CLIENT_VOICES["cli-maya"],
    sampleType: "narrative",
    profileNote: "Weekend story remains concrete and brief; engagement still emerging.",
    turns: [
      t("therapist", "Hi Maya. What did you do this weekend?"),
      t("client", "I stayed home. I watched shows. I ate pizza."),
      t("therapist", "Did you see any friends or family?"),
      t("client", "My brother. He played games. I watched."),
      t("therapist", "How did you feel watching him play?"),
      t("client", "Fine. Kind of bored."),
      t("therapist", "What is something fun you could ask him next time?"),
      t("client", "Can I play too? Maybe."),
      t("therapist", "What would you say if he says yes?"),
      t("client", "Thanks. I will try."),
      t("therapist", "Nice work practicing those words today."),
      t("client", "Thanks."),
    ],
  },
];

/**
 * Jordan Kim — SRS parent mild–moderate (avg ~1.8); ABAS in progress (lower adaptive items).
 * Pattern: verbally capable (longer MLU) with mild peer/group friction — not as impaired as Sam,
 * not as thin as Maya. Engagement stays high-moderate (not “elite”) to leave room for SRS mild elevation.
 */
const JORDAN_SESSIONS: SessionDef[] = [
  {
    id: "sess-jordan-01-classroom",
    clientId: "cli-jordan",
    title: "Language sample — classroom routines",
    daysAgo: 11,
    audioFile: "jordan-01-classroom.wav",
    therapistVoice: THERAPIST_VOICE,
    clientVoice: CLIENT_VOICES["cli-jordan"],
    sampleType: "routines",
    profileNote:
      "Solid MLU and contingency; mild group-work friction (aligns with mild–moderate parent SRS).",
    turns: [
      t("therapist", "Jordan, walk me through a normal morning in class."),
      t(
        "client",
        "I put my bag away, get my folder, and sit down. Sometimes I forget a pencil."
      ),
      t("therapist", "What do you do if you need help from a classmate?"),
      t(
        "client",
        "I ask the person next to me. If they look busy I wait, then I raise my hand."
      ),
      t("therapist", "How do group projects go for you?"),
      t(
        "client",
        "Okay if jobs are clear. When people talk over each other I get annoyed and go quiet."
      ),
      t("therapist", "What helps you stay in the group conversation?"),
      t(
        "client",
        "A direct question. Open free talk is harder. I miss jokes sometimes."
      ),
      t("therapist", "That is useful insight. Thanks for explaining."),
      t("client", "Sure. I want group work to feel less stressful."),
    ],
  },
  {
    id: "sess-jordan-02-soccer",
    clientId: "cli-jordan",
    title: "Language sample — soccer and teammates",
    daysAgo: 8,
    audioFile: "jordan-02-soccer.wav",
    therapistVoice: THERAPIST_VOICE,
    clientVoice: CLIENT_VOICES["cli-jordan"],
    sampleType: "conversation",
    profileNote:
      "Social motivation present; mild rigidity and awkward peer banter (mild–moderate band).",
    turns: [
      t("therapist", "Tell me about soccer practice this week."),
      t(
        "client",
        "We did passing drills and a scrimmage. I played midfield and tried to call for the ball."
      ),
      t("therapist", "How do you handle it when a teammate makes a mistake?"),
      t(
        "client",
        "I used to get mad. Now I say next time or pass again. Coach said that helps."
      ),
      t("therapist", "Who is a teammate you work well with?"),
      t(
        "client",
        "Marcus. He listens and does not joke during new plays. That is easier for me."
      ),
      t("therapist", "What is still hard about being on the team socially?"),
      t(
        "client",
        "Locker room jokes. I do not always get them, so I smile and check my phone."
      ),
      t("therapist", "You described that clearly. Good work today."),
      t("client", "Thanks. Soccer is where I try hardest socially."),
    ],
  },
  {
    id: "sess-jordan-03-homework",
    clientId: "cli-jordan",
    title: "Language sample — homework and home routines",
    daysAgo: 4,
    audioFile: "jordan-03-homework.wav",
    therapistVoice: THERAPIST_VOICE,
    clientVoice: CLIENT_VOICES["cli-jordan"],
    sampleType: "routines",
    profileNote:
      "Practical language adequate; needs structure for chores (ABAS parent still in progress).",
    turns: [
      t("therapist", "How do you organize homework after school?"),
      t(
        "client",
        "Snack first, then planner. Math first because it is hardest, then reading."
      ),
      t("therapist", "What happens when an assignment is confusing?"),
      t(
        "client",
        "I message a friend or ask my mom. If I just guess, my grades drop."
      ),
      t("therapist", "How do you ask for help without getting frustrated?"),
      t(
        "client",
        "I try to say which part is stuck instead of saying I hate this."
      ),
      t("therapist", "What about chores or other home responsibilities?"),
      t(
        "client",
        "Dishes on weekdays. Laundry needs reminders. Checklists help a lot."
      ),
      t("therapist", "Checklists sound like a strong strategy for you."),
      t("client", "Yeah. When steps are clear I follow through."),
    ],
  },
];

/**
 * Sam Torres — scored SRS-2 elevated (parent/teacher high; Social Cognition/Communication elevated).
 * Pattern: topic perseveration, lower contingent answers, repetitive wording, uneven social reciprocity.
 */
const SAM_SESSIONS: SessionDef[] = [
  {
    id: "sess-sam-01-trains",
    clientId: "cli-sam",
    title: "Language sample — preferred topic (trains)",
    daysAgo: 40,
    audioFile: "sam-01-trains.wav",
    therapistVoice: THERAPIST_VOICE,
    clientVoice: CLIENT_VOICES["cli-sam"],
    sampleType: "conversation",
    profileNote:
      "High talk time on restricted interest; weaker contingency (matches elevated SRS social communication).",
    turns: [
      t("therapist", "Sam, what did you do at school today?"),
      t(
        "client",
        "Trains. Freight trains and passenger trains. Diesel engines are louder. Trains trains trains."
      ),
      t("therapist", "Who did you sit with at lunch?"),
      t("therapist", "Sam, I need an answer about lunch, not trains."),
      t(
        "client",
        "Trains have coupling systems. Knuckles connect the cars. Freight cars freight cars."
      ),
      t("therapist", "Can you tell me one thing about lunch?"),
      t("client", "Lunch was fine. Then trains. Trains trains."),
      t("therapist", "How did your friend respond when you talked about trains?"),
      t("client", "They looked away. I said freight cars. Freight cars."),
      t("therapist", "What is one question you could ask your friend about their day?"),
      t("client", "What train did you see? Trains. Hard."),
      t("therapist", "We will practice a different question together."),
      t("client", "Trains. Okay."),
    ],
  },
  {
    id: "sess-sam-02-group",
    clientId: "cli-sam",
    title: "Language sample — group project friction",
    daysAgo: 35,
    audioFile: "sam-02-group.wav",
    therapistVoice: THERAPIST_VOICE,
    clientVoice: CLIENT_VOICES["cli-sam"],
    sampleType: "conversation",
    profileNote: "Social cognition/communication strain in collaborative talk; repetitive repair phrases.",
    turns: [
      t("therapist", "Tell me about the science group project."),
      t(
        "client",
        "Engines. I wanted engines on the poster. Engines engines engines. My idea was better."
      ),
      t("therapist", "How did the group decide what to do?"),
      t("therapist", "Did they vote, or did a teacher choose?"),
      t(
        "client",
        "They voted. I said engines. Engines again. They said stop."
      ),
      t("therapist", "How do you think they felt?"),
      t("client", "Mad. Faces are hard. Engines."),
      t("therapist", "What could you try next time in a group?"),
      t("client", "Ask wait share. Wait wait wait. Engines. Hard."),
      t("therapist", "Yes — ask, wait, then share. Nice recall."),
      t("client", "Ask wait share. Engines. Okay."),
    ],
  },
  {
    id: "sess-sam-03-emotions",
    clientId: "cli-sam",
    title: "Language sample — feelings after a hard day",
    daysAgo: 32,
    audioFile: "sam-03-emotions.wav",
    therapistVoice: THERAPIST_VOICE,
    clientVoice: CLIENT_VOICES["cli-sam"],
    sampleType: "conversation",
    profileNote: "Limited emotion vocabulary; social motivation dips; RRB-style repetition present.",
    turns: [
      t("therapist", "You looked upset after specials. What happened?"),
      t("client", "Noise. Noise noise. Ears hurt. Trains in my head."),
      t("therapist", "What feeling word fits that moment?"),
      t("therapist", "Was it scared, mad, or overloaded?"),
      t("client", "Bad. Bad bad. Noise. Trains."),
      t("therapist", "Did you tell a teacher what you needed?"),
      t("client", "I said trains. Wrong words. Noise."),
      t("therapist", "What words can we use for a quiet break request?"),
      t("client", "Quiet break. Quiet break. Noise."),
      t("therapist", "That is clearer. We will keep practicing."),
      t("client", "Quiet break. Trains. Okay."),
    ],
  },
];

/**
 * Alex Patel — ABAS-3 baseline below average → progress to low average / average practical.
 * Sessions 1→3 show improving adaptive language, MLU, and engagement (progress monitoring).
 */
const ALEX_SESSIONS: SessionDef[] = [
  {
    id: "sess-alex-01-baseline",
    clientId: "cli-alex",
    title: "Language sample — daily living baseline",
    daysAgo: 310,
    audioFile: "alex-01-baseline.wav",
    therapistVoice: THERAPIST_VOICE,
    clientVoice: CLIENT_VOICES["cli-alex"],
    sampleType: "routines",
    profileNote:
      "Baseline: short steps, heavy prompting, lower independence language (ABAS T1 below average).",
    turns: [
      t("therapist", "Alex, how do you get ready for school in the morning?"),
      t("client", "Mom wakes me. I get dressed. Sometimes wrong shirt."),
      t("therapist", "What about breakfast and your backpack?"),
      t("client", "Mom makes food. She packs the bag. I forget stuff."),
      t("therapist", "Can you list the steps for packing your backpack?"),
      t("client", "Folder. Chromebook. Uh. Lunch. I think that is it."),
      t("therapist", "Who checks if you are ready?"),
      t("client", "Mom. Always mom. I wait for her checklist."),
      t("therapist", "What is one step you want to do by yourself?"),
      t("client", "Pack the bag. That would be good."),
      t("therapist", "We will build a simple checklist for that."),
      t("client", "Okay. Checklist helps."),
    ],
  },
  {
    id: "sess-alex-02-mid",
    clientId: "cli-alex",
    title: "Language sample — chores mid-year",
    daysAgo: 120,
    audioFile: "alex-02-chores.wav",
    therapistVoice: THERAPIST_VOICE,
    clientVoice: CLIENT_VOICES["cli-alex"],
    sampleType: "routines",
    profileNote: "Mid progress: longer sequences, some self-monitoring language.",
    turns: [
      t("therapist", "What chores are you doing at home now?"),
      t(
        "client",
        "I take out trash on Tuesdays and load the dishwasher after dinner most nights."
      ),
      t("therapist", "How do you remember those jobs?"),
      t(
        "client",
        "Phone reminders. Also a whiteboard. If I skip one I fix it the next day."
      ),
      t("therapist", "Walk me through loading the dishwasher."),
      t(
        "client",
        "Rinse plates, bottom rack plates, top rack cups, soap, then start. I still mess up knives sometimes."
      ),
      t("therapist", "What do you do when you are unsure about a step?"),
      t(
        "client",
        "I check the picture list on the fridge before I ask Mom. That is new for me."
      ),
      t("therapist", "That is real progress in independence."),
      t("client", "Yeah. I feel less behind than last fall."),
    ],
  },
  {
    id: "sess-alex-03-progress",
    clientId: "cli-alex",
    title: "Language sample — community & routines progress",
    daysAgo: 20,
    audioFile: "alex-03-community.wav",
    therapistVoice: THERAPIST_VOICE,
    clientVoice: CLIENT_VOICES["cli-alex"],
    sampleType: "narrative",
    profileNote:
      "Progress check: multi-step community narrative, higher engagement (aligns with ABAS T2 gains).",
    turns: [
      t("therapist", "Tell me how you handled the store trip this weekend."),
      t(
        "client",
        "I made a list with Mom, found the aisle signs myself, compared two prices, and paid with the card while she watched."
      ),
      t("therapist", "What was the hardest part?"),
      t(
        "client",
        "Talking to the cashier. I practiced saying hi, my total, and thank you. It felt awkward but I did it."
      ),
      t("therapist", "How are morning routines going now?"),
      t(
        "client",
        "I pack my bag the night before and check three things: charger, folder, and lunch money. Mom only spot-checks."
      ),
      t("therapist", "What goal do you want next?"),
      t(
        "client",
        "Cook a simple dinner once a week. Pasta and salad. I can follow a recipe if steps are short."
      ),
      t("therapist", "That is a strong, specific plan. Excellent work today."),
      t(
        "client",
        "Thanks. I can explain the steps better than I could last year."
      ),
    ],
  },
];

export const ALL_SESSION_DEFS: SessionDef[] = [
  ...MAYA_SESSIONS,
  ...JORDAN_SESSIONS,
  ...SAM_SESSIONS,
  ...ALEX_SESSIONS,
];

export function sessionsForClientDef(clientId: string): SessionDef[] {
  return ALL_SESSION_DEFS.filter((s) => s.clientId === clientId);
}

/** Estimate turn timings from word counts for seed analytics (audio gen uses real durations). */
export function turnsWithEstimatedTiming(
  lines: SessionDef["turns"],
  wordsPerSec = 2.4,
  pauseSec = 0.45
): TranscriptTurn[] {
  let t0 = 0;
  return lines.map((line, i) => {
    const words = line.text.trim().split(/\s+/).filter(Boolean).length;
    const dur = Math.max(1.2, words / wordsPerSec);
    const startSec = t0;
    const endSec = t0 + dur;
    t0 = endSec + pauseSec;
    return {
      id: `turn-${i}`,
      speaker: line.speaker,
      text: line.text,
      startSec: Math.round(startSec * 10) / 10,
      endSec: Math.round(endSec * 10) / 10,
    };
  });
}

export function audioUrlFor(def: SessionDef): string {
  return `/samples/${def.audioFile}`;
}

/** Actual WAV durations from TTS generation (seconds). */
export const SESSION_DURATIONS: Record<string, number> = {
  "sess-maya-01-recess": 38.0,
  "sess-maya-02-friend": 39.56,
  "sess-maya-03-weekend": 35.45,
  "sess-jordan-01-classroom": 45.49,
  "sess-jordan-02-soccer": 46.37,
  "sess-jordan-03-homework": 42.78,
  "sess-sam-01-trains": 52.29,
  "sess-sam-02-group": 44.28,
  "sess-sam-03-emotions": 40.74,
  "sess-alex-01-baseline": 44.34,
  "sess-alex-02-mid": 44.16,
  "sess-alex-03-progress": 53.28,
};

export function getSessionDef(id: string): SessionDef | undefined {
  return ALL_SESSION_DEFS.find((s) => s.id === id);
}
