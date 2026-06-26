// ── Roadmap ────────────────────────────────────────────────────────────────
export type RoadmapTask = {
  title: string;
  detail: string;
  resource?: { label: string; url: string };
};

export type RoadmapWeek = {
  week: number;
  focus: string;
  tasks: RoadmapTask[];
};

export type RoadmapPhase = {
  phase: "30" | "60" | "90";
  title: string;
  summary: string;
  weeks: RoadmapWeek[];
};

export type Roadmap = {
  role: string;
  summary: string;
  strengths: string[];
  gaps: { skill: string; priority: "high" | "medium" | "low"; why: string }[];
  phases: RoadmapPhase[];
  resources: { label: string; url: string; topic: string }[];
};

// ── Interview ──────────────────────────────────────────────────────────────
export type InterviewQuestion = {
  question: string;
  type: "behavioral" | "technical" | "system-design" | "role-fit";
  whyAsked: string;
  answerOutline: string;
};
export type InterviewSet = { role: string; questions: InterviewQuestion[] };

// ── Projects ───────────────────────────────────────────────────────────────
export type ProjectIdea = {
  title: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  skillsCovered: string[];
  description: string;
  features: string[];
  stretchGoal: string;
};
export type ProjectIdeas = { ideas: ProjectIdea[] };

// ── ATS ────────────────────────────────────────────────────────────────────
export type AtsIssue = { weak: string; suggested: string; why: string };
export type AtsReport = {
  score: number;
  missingKeywords: string[];
  weakPhrases: AtsIssue[];
  tips: string[];
};

// ── Career Compare ─────────────────────────────────────────────────────────
export type CareerSummary = {
  role: string;
  oneLiner: string;
  coreSkills: string[];
  avgSalaryUsd: string;
  timeToReadyMonths: number;
  dailyWork: string;
  prosCons: { pros: string[]; cons: string[] };
};
export type CareerCompare = { a: CareerSummary; b: CareerSummary; verdict: string };
