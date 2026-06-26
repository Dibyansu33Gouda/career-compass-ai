"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Compass, Sparkles, Target, ListChecks, ArrowRight, CheckCircle2,
  Circle, ExternalLink, Loader2, Lightbulb, TrendingUp, BookOpen,
  RefreshCw, FileDown, Gauge, MessageSquare, Github, ShieldCheck,
  GitCompare, X,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type {
  Roadmap, InterviewSet, ProjectIdeas, AtsReport, CareerCompare,
} from "@/types";
import confetti from "canvas-confetti";
import { jsPDF } from "jspdf";

// ── Constants ──────────────────────────────────────────────────────────────
const ROLES = [
  "Software Engineer","Frontend Engineer","Backend Engineer","Data Scientist",
  "Machine Learning Engineer","AI Engineer","Product Manager","DevOps / SRE",
  "Mobile Developer","Data Analyst","UX Designer","Cybersecurity Analyst",
];

const SAMPLE_RESUME = `CS undergrad (3rd year). Skills: Python, JavaScript, React, basic SQL. Built a To-do app and a small Flask API. Took an intro ML course on Coursera (covered linear regression, decision trees). Interned at a startup doing frontend bug fixes. Comfortable with Git/GitHub. Weak in system design, deployment, and statistics.`;

const STORAGE_KEY = "cc.progress.v1";
const ROADMAP_KEY = "cc.roadmap.v1";

type ProgressMap = Record<string, boolean>;

// ── Tiny UI primitives ─────────────────────────────────────────────────────
function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", className)}>
      {children}
    </span>
  );
}

function Button({
  children, onClick, disabled, variant = "primary", size = "md", type = "button", className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        variant === "primary" && "bg-primary-700 text-white hover:bg-primary-600 shadow-soft",
        variant === "outline" && "border border-border bg-white text-slate-700 hover:bg-slate-50",
        variant === "ghost" && "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
        className,
      )}
    >
      {children}
    </button>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-white shadow-soft", className)}>
      {children}
    </div>
  );
}

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={cn(
      "fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg animate-fade-in",
      type === "success" ? "bg-primary-700 text-white" : "bg-red-600 text-white",
    )}>
      {type === "success" ? <CheckCircle2 className="size-4 shrink-0" /> : <X className="size-4 shrink-0" />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="size-3" /></button>
    </div>
  );
}

// ── Score Ring ─────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const dur = 900;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * score));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const size = 112, stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (display / 100) * c;
  const color = score >= 75 ? "stroke-success" : score >= 45 ? "stroke-primary-700" : "stroke-highlight";
  const textColor = score >= 75 ? "text-success" : score >= 45 ? "text-primary-700" : "text-highlight";

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} strokeWidth={stroke} className="stroke-slate-200" fill="none" />
          <circle cx={size/2} cy={size/2} r={r} strokeWidth={stroke} className={color} fill="none"
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 200ms linear" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={cn("font-bold text-2xl", textColor)}>{display}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400">/ 100</div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
        <Gauge className="size-3" /> Resume score
      </div>
    </div>
  );
}

// ── Loading Steps ──────────────────────────────────────────────────────────
function LoadingSteps() {
  const steps = [
    "Analyzing your skills…", "Mapping skill gaps…",
    "Building weekly milestones…", "Curating free resources…", "Scoring your resume…",
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => Math.min(i + 1, steps.length - 1)), 1400);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="mt-4 rounded-xl border border-border bg-surface p-4 space-y-2">
      {steps.map((s, i) => {
        const done = i < idx, active = i === idx;
        return (
          <div key={s} className="flex items-center gap-3 text-sm">
            {done ? <CheckCircle2 className="size-4 text-success shrink-0" />
              : active ? <Loader2 className="size-4 text-primary-700 animate-spin shrink-0" />
              : <Circle className="size-4 text-slate-300 shrink-0" />}
            <span className={cn(done && "line-through text-slate-400", active && "font-medium", !done && !active && "text-slate-400")}>
              {s}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Interview Dialog ───────────────────────────────────────────────────────
function InterviewDialog({ resume, role, open, onClose }: { resume: string; role: string; open: boolean; onClose: () => void }) {
  const [data, setData] = useState<InterviewSet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && !data) {
      setLoading(true);
      api.interview(resume, role)
        .then(setData)
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [open, data, resume, role]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-xl p-6">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100">
          <X className="size-4" />
        </button>
        <h2 className="font-bold text-2xl">Mock Interview — {role}</h2>
        <p className="text-sm text-slate-500 mt-1">AI-generated questions tailored to your resume. Practice out loud.</p>
        {loading && (
          <div className="py-12 flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="size-6 animate-spin text-primary-700" />
            <div className="text-sm">Crafting role-specific questions…</div>
          </div>
        )}
        {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
        {data && (
          <div className="space-y-4 mt-5">
            {data.questions.map((q, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-4 animate-fade-in">
                <Badge className="bg-primary-50 text-primary-700 border border-primary-100">{q.type}</Badge>
                <div className="mt-2 font-semibold">Q{i + 1}. {q.question}</div>
                <div className="mt-1.5 text-xs text-slate-500 italic">Why asked: {q.whyAsked}</div>
                <div className="mt-2 text-sm">
                  <span className="font-semibold text-primary-700">Outline: </span>{q.answerOutline}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── ATS Card ───────────────────────────────────────────────────────────────
function AtsCard({ resume, role }: { resume: string; role: string }) {
  const [data, setData] = useState<AtsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = () => {
    setLoading(true);
    api.ats(resume, role)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary-700" />
          <h3 className="font-semibold text-lg">ATS Score & Fixes</h3>
        </div>
        {!data && (
          <Button size="sm" variant="outline" onClick={run} disabled={loading}>
            {loading ? <><Loader2 className="size-4 animate-spin" /> Scanning…</> : <><Sparkles className="size-4" /> Run ATS scan</>}
          </Button>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-500">Find weak phrases and missing keywords for {role} ATS filters.</p>
      {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}
      {data && (
        <div className="mt-5 space-y-5">
          <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4">
            <div className="font-bold text-4xl text-primary-700">
              {data.score}<span className="text-base text-slate-400 font-normal">/100</span>
            </div>
            <div className="flex-1 h-2 rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-primary-700 transition-all" style={{ width: `${data.score}%` }} />
            </div>
          </div>
          {data.missingKeywords?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Missing keywords</p>
              <div className="flex flex-wrap gap-2">
                {data.missingKeywords.map((k) => (
                  <span key={k} className="rounded-full bg-red-50 text-red-600 border border-red-100 px-3 py-1 text-xs font-medium">{k}</span>
                ))}
              </div>
            </div>
          )}
          {data.weakPhrases?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Replace these phrases</p>
              <div className="space-y-2">
                {data.weakPhrases.map((w, i) => (
                  <div key={i} className="grid sm:grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg border border-border bg-surface p-3 text-sm">
                    <span className="line-through text-slate-400">{w.weak}</span>
                    <ArrowRight className="size-4 text-primary-700 hidden sm:block" />
                    <div>
                      <div className="font-medium text-success">{w.suggested}</div>
                      <div className="text-xs text-slate-400">{w.why}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.tips?.length > 0 && (
            <ul className="space-y-1 text-sm">
              {data.tips.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <Lightbulb className="size-4 text-accent mt-0.5 shrink-0" />{t}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Project Ideas Card ─────────────────────────────────────────────────────
function ProjectsCard({ role, gaps }: { role: string; gaps: string[] }) {
  const [data, setData] = useState<ProjectIdeas | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = () => {
    setLoading(true);
    api.projects(role, gaps)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const diffColor = (d: string) =>
    d === "beginner" ? "bg-green-50 text-green-700 border-green-100"
    : d === "intermediate" ? "bg-amber-50 text-amber-700 border-amber-100"
    : "bg-red-50 text-red-700 border-red-100";

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Github className="size-5 text-primary-700" />
          <h3 className="font-semibold text-lg">Build these to close your gaps</h3>
        </div>
        {!data && (
          <Button size="sm" variant="outline" onClick={run} disabled={loading || gaps.length === 0}>
            {loading ? <><Loader2 className="size-4 animate-spin" /> Brainstorming…</> : <><Sparkles className="size-4" /> Suggest projects</>}
          </Button>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-500">Portfolio projects mapped to the skills you&apos;re missing.</p>
      {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}
      {data && (
        <div className="mt-5 grid md:grid-cols-3 gap-4">
          {data.ideas.map((idea, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-2 animate-fade-in">
              <Badge className={cn("border self-start", diffColor(idea.difficulty))}>{idea.difficulty}</Badge>
              <div className="font-semibold">{idea.title}</div>
              <div className="text-sm text-slate-500">{idea.description}</div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {idea.skillsCovered.map((s) => (
                  <span key={s} className="rounded-full bg-primary-700/10 text-primary-700 px-2 py-0.5 text-[10px] font-medium">{s}</span>
                ))}
              </div>
              {idea.features?.length > 0 && (
                <ul className="mt-1 text-xs text-slate-500 space-y-1">
                  {idea.features.slice(0, 4).map((f, j) => (
                    <li key={j} className="flex gap-1.5">
                      <Circle className="size-2 mt-1 fill-primary-700 text-primary-700 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
              )}
              {idea.stretchGoal && (
                <div className="mt-auto pt-2 text-xs">
                  <span className="font-semibold text-accent">Stretch: </span>
                  <span className="text-slate-500">{idea.stretchGoal}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Compare Section ────────────────────────────────────────────────────────
function CompareSection() {
  const [a, setA] = useState("Machine Learning Engineer");
  const [b, setB] = useState("Data Analyst");
  const [data, setData] = useState<CareerCompare | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = () => {
    if (!a.trim() || !b.trim()) return;
    setLoading(true);
    api.compare(a.trim(), b.trim())
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  return (
    <section id="compare" className="mx-auto max-w-6xl px-6 py-20">
      <div className="text-center max-w-2xl mx-auto">
        <Badge className="bg-slate-100 text-slate-600"><GitCompare className="size-3" /> Career compare</Badge>
        <h2 className="mt-3 font-bold text-3xl sm:text-4xl">Two careers, side by side</h2>
        <p className="mt-2 text-slate-500">Skills, salary, time-to-ready, and daily life — compared honestly.</p>
      </div>
      <Card className="mt-10 p-6">
        <div className="grid sm:grid-cols-[1fr_auto_1fr_auto] gap-3 items-end">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Career A</label>
            <input value={a} onChange={(e) => setA(e.target.value)}
              className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="hidden sm:flex items-center justify-center pb-2 text-slate-400 font-medium">vs</div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Career B</label>
            <input value={b} onChange={(e) => setB(e.target.value)}
              className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <Button onClick={run} disabled={loading || !a.trim() || !b.trim()}>
            {loading ? <><Loader2 className="size-4 animate-spin" /> Comparing…</> : <><GitCompare className="size-4" /> Compare</>}
          </Button>
        </div>
        {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}
        {data && (
          <div className="mt-8 grid md:grid-cols-2 gap-5">
            {[data.a, data.b].map((c, i) => (
              <div key={i} className="rounded-2xl border border-border bg-surface p-5 animate-fade-in">
                <div className="font-bold text-2xl text-primary-700">{c.role}</div>
                <p className="text-sm text-slate-500 mt-1">{c.oneLiner}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-border bg-white p-3">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">Avg salary</div>
                    <div className="font-semibold mt-0.5">{c.avgSalaryUsd}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-white p-3">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">Time to ready</div>
                    <div className="font-semibold mt-0.5">{c.timeToReadyMonths} months</div>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400 mb-1.5">Core skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {c.coreSkills.map((s) => (
                      <span key={s} className="rounded-full bg-primary-700/10 text-primary-700 px-2.5 py-0.5 text-xs font-medium">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 text-sm">
                  <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">A day in the life</p>
                  <p className="text-slate-500">{c.dailyWork}</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-success mb-1">Pros</div>
                    <ul className="space-y-0.5 text-slate-500">{c.prosCons.pros.map((p, j) => <li key={j}>+ {p}</li>)}</ul>
                  </div>
                  <div>
                    <div className="font-semibold text-red-500 mb-1">Cons</div>
                    <ul className="space-y-0.5 text-slate-500">{c.prosCons.cons.map((p, j) => <li key={j}>− {p}</li>)}</ul>
                  </div>
                </div>
              </div>
            ))}
            <div className="md:col-span-2 rounded-xl border border-primary-100 bg-primary-50 p-4 text-sm">
              <span className="font-semibold text-primary-700">Verdict: </span>{data.verdict}
            </div>
          </div>
        )}
      </Card>
    </section>
  );
}

// ── Roadmap View ───────────────────────────────────────────────────────────
function RoadmapView({
  roadmap, resume, progress, toggle, totals, onReset,
}: {
  roadmap: Roadmap; resume: string; progress: ProgressMap;
  toggle: (id: string) => void;
  totals: { done: number; total: number; pct: number };
  onReset: () => void;
}) {
  const [activePhase, setActivePhase] = useState(roadmap.phases[0]?.phase ?? "30");
  const [interviewOpen, setInterviewOpen] = useState(false);

  const resumeScore = useMemo(() => {
    const s = roadmap.strengths.length;
    const gapWeight = roadmap.gaps.reduce(
      (acc, g) => acc + (g.priority === "high" ? 3 : g.priority === "medium" ? 2 : 1), 0,
    );
    const denom = s + gapWeight;
    if (!denom) return 0;
    return Math.max(5, Math.min(99, Math.round((s / denom) * 100)));
  }, [roadmap]);

  const exportPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 48;
    let y = margin;
    const ensure = (need: number) => { if (y + need > pageH - margin) { doc.addPage(); y = margin; } };
    const writeLines = (lines: string[], size: number, lh = 1.35, color: [number, number, number] = [30, 41, 59]) => {
      doc.setFontSize(size); doc.setTextColor(...color);
      for (const ln of lines) { ensure(size * lh); doc.text(ln, margin, y); y += size * lh; }
    };
    doc.setFont("helvetica", "bold");
    writeLines(["CareerCompass AI — Roadmap"], 22, 1.3, [15, 118, 110]);
    y += 6;
    doc.setFont("helvetica", "normal");
    writeLines([`Target role: ${roadmap.role}`, `Resume score: ${resumeScore}/100`, `Progress: ${totals.done}/${totals.total} tasks (${totals.pct}%)`], 12, 1.4, [71, 85, 105]);
    y += 8;
    writeLines(doc.splitTextToSize(roadmap.summary, pageW - margin * 2) as string[], 11, 1.5);
    y += 10;
    doc.setFont("helvetica", "bold"); writeLines(["Strengths"], 14, 1.4, [15, 118, 110]);
    doc.setFont("helvetica", "normal"); writeLines(doc.splitTextToSize("• " + roadmap.strengths.join("  • "), pageW - margin * 2) as string[], 11, 1.5);
    y += 8;
    doc.setFont("helvetica", "bold"); writeLines(["Gaps to close"], 14, 1.4, [180, 83, 9]);
    doc.setFont("helvetica", "normal");
    for (const g of roadmap.gaps) writeLines(doc.splitTextToSize(`• [${g.priority.toUpperCase()}] ${g.skill} — ${g.why}`, pageW - margin * 2) as string[], 11, 1.5);
    y += 6;
    for (const p of roadmap.phases) {
      ensure(60); doc.setFont("helvetica", "bold");
      writeLines([`Phase: Day ${p.phase} — ${p.title}`], 15, 1.4, [15, 118, 110]);
      doc.setFont("helvetica", "normal"); writeLines(doc.splitTextToSize(p.summary, pageW - margin * 2) as string[], 11, 1.5, [71, 85, 105]);
      y += 4;
      for (const w of p.weeks) {
        ensure(40); doc.setFont("helvetica", "bold"); writeLines([`Week ${w.week}: ${w.focus}`], 12, 1.4);
        doc.setFont("helvetica", "normal");
        for (let i = 0; i < w.tasks.length; i++) {
          const t = w.tasks[i];
          const done = progress[`${p.phase}-${w.week}-${i}`] ? "[x]" : "[ ]";
          writeLines(doc.splitTextToSize(`${done} ${t.title} — ${t.detail}`, pageW - margin * 2 - 10) as string[], 11, 1.5);
          if (t.resource?.url) writeLines(doc.splitTextToSize(`    ↳ ${t.resource.label}: ${t.resource.url}`, pageW - margin * 2 - 10) as string[], 9, 1.5, [15, 118, 110]);
        }
        y += 4;
      }
    }
    doc.save(`careercompass-${roadmap.role.toLowerCase().replace(/\s+/g, "-")}.pdf`);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <InterviewDialog resume={resume} role={roadmap.role} open={interviewOpen} onClose={() => setInterviewOpen(false)} />

      <Card className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge className="bg-primary-50 text-primary-700 border border-primary-100">Your roadmap</Badge>
            <h2 className="mt-2 font-bold text-3xl sm:text-4xl">
              Path to <span className="text-primary-700">{roadmap.role}</span>
            </h2>
            <p className="mt-2 text-slate-500 max-w-2xl">{roadmap.summary}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setInterviewOpen(true)}>
              <MessageSquare className="size-4" /> Prepare for Interview
            </Button>
            <Button variant="outline" onClick={exportPdf}>
              <FileDown className="size-4" /> Export PDF
            </Button>
            <Button variant="outline" onClick={onReset}>
              <RefreshCw className="size-4" /> New
            </Button>
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-[1fr_auto] gap-5 items-center rounded-xl border border-border bg-surface p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Overall progress</p>
            <div className="mt-1 font-bold text-3xl">
              {totals.pct}%
              <span className="ml-2 text-sm text-slate-400 font-normal">({totals.done} / {totals.total} tasks)</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-primary-700 transition-all" style={{ width: `${totals.pct}%` }} />
            </div>
            {totals.pct === 100 && (
              <Badge className="mt-3 bg-green-100 text-green-700 border border-green-200">All done — go apply!</Badge>
            )}
          </div>
          <ScoreRing score={resumeScore} />
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-5">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="size-4" />
            <h3 className="font-semibold">Your strengths</h3>
          </div>
          <ul className="mt-3 flex flex-wrap gap-2">
            {roadmap.strengths.map((s, i) => (
              <li key={s} className="rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-sm font-medium animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}>{s}</li>
            ))}
          </ul>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-red-500">
            <Target className="size-4" />
            <h3 className="font-semibold">Gaps to close</h3>
          </div>
          <ul className="mt-3 space-y-2">
            {roadmap.gaps.map((g, i) => (
              <li key={g.skill} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                <span className={cn("mt-0.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  g.priority === "high" ? "bg-red-50 text-red-600"
                  : g.priority === "medium" ? "bg-amber-50 text-amber-600"
                  : "bg-slate-100 text-slate-500")}>
                  {g.priority}
                </span>
                <div>
                  <div className="font-medium">{g.skill}</div>
                  <div className="text-sm text-slate-500">{g.why}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <AtsCard resume={resume} role={roadmap.role} />
      <ProjectsCard role={roadmap.role} gaps={roadmap.gaps.map((g) => g.skill)} />

      {/* Phase Tabs */}
      <div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {roadmap.phases.map((p) => (
            <button key={p.phase} onClick={() => setActivePhase(p.phase)}
              className={cn("rounded-xl px-5 py-3 text-left shrink-0 border transition-all",
                activePhase === p.phase
                  ? "bg-white border-primary-200 shadow-soft"
                  : "bg-surface border-transparent hover:border-border")}>
              <div className="font-bold text-base">Day {p.phase}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">{p.title}</div>
            </button>
          ))}
        </div>

        {roadmap.phases.filter((p) => p.phase === activePhase).map((p) => (
          <Card key={p.phase} className="mt-4 p-6">
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <h3 className="font-bold text-2xl">{p.title}</h3>
              <Badge className="bg-slate-100 text-slate-600">Days 1–{p.phase}</Badge>
            </div>
            <p className="mt-1 text-slate-500">{p.summary}</p>
            <div className="mt-6 space-y-5">
              {p.weeks.map((w) => {
                const total = w.tasks.length;
                const done = w.tasks.filter((_, i) => progress[`${p.phase}-${w.week}-${i}`]).length;
                return (
                  <div key={w.week} className="rounded-xl border border-border bg-surface p-5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-400">Week {w.week}</p>
                        <div className="font-semibold text-lg">{w.focus}</div>
                      </div>
                      <div className="text-xs text-slate-400">{done}/{total} done</div>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {w.tasks.map((t, i) => {
                        const id = `${p.phase}-${w.week}-${i}`;
                        const checked = !!progress[id];
                        return (
                          <li key={i}
                            className={cn("group flex items-start gap-3 rounded-lg border p-3 transition-all cursor-pointer",
                              checked ? "border-green-200 bg-green-50" : "border-border bg-white hover:border-primary-200")}
                            onClick={() => toggle(id)}>
                            <button type="button" className="mt-0.5">
                              {checked
                                ? <CheckCircle2 className="size-5 text-success" />
                                : <Circle className="size-5 text-slate-300 group-hover:text-primary-700" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className={cn("font-medium", checked && "line-through text-slate-400")}>{t.title}</div>
                              <div className="text-sm text-slate-500">{t.detail}</div>
                              {t.resource?.url && (
                                <a href={t.resource.url} target="_blank" rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline">
                                  {t.resource.label} <ExternalLink className="size-3" />
                                </a>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {roadmap.resources?.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary-700" />
            <h3 className="font-semibold">Curated resources</h3>
          </div>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            {roadmap.resources.map((r) => (
              <a key={r.url} href={r.url} target="_blank" rel="noreferrer"
                className="group flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-4 hover:border-primary-200 hover:shadow-soft transition-all">
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400">{r.topic}</div>
                  <div className="mt-0.5 font-medium">{r.label}</div>
                </div>
                <ExternalLink className="size-4 text-slate-400 group-hover:text-primary-700 mt-1" />
              </a>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function Home() {
  const [resume, setResume] = useState("");
  const [role, setRole] = useState("Machine Learning Engineer");
  const [customRole, setCustomRole] = useState("");
  const [timeline, setTimeline] = useState<"30" | "60" | "90">("90");
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
  }, []);

  // Persist roadmap + progress
  useEffect(() => {
    try {
      const r = localStorage.getItem(ROADMAP_KEY);
      if (r) setRoadmap(JSON.parse(r));
      const p = localStorage.getItem(STORAGE_KEY);
      if (p) setProgress(JSON.parse(p));
    } catch {}
  }, []);

  useEffect(() => {
    if (roadmap) localStorage.setItem(ROADMAP_KEY, JSON.stringify(roadmap));
  }, [roadmap]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const totals = useMemo(() => {
    if (!roadmap) return { done: 0, total: 0, pct: 0 };
    let total = 0, done = 0;
    roadmap.phases.forEach((ph) =>
      ph.weeks.forEach((w) =>
        w.tasks.forEach((_, i) => {
          total++;
          if (progress[`${ph.phase}-${w.week}-${i}`]) done++;
        }),
      ),
    );
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [roadmap, progress]);

  const prevPct = useRef(0);
  useEffect(() => {
    if (totals.total > 0 && totals.pct === 100 && prevPct.current < 100) {
      const fire = (ratio: number, opts: confetti.Options) =>
        confetti({ particleCount: Math.floor(220 * ratio), spread: 90, origin: { y: 0.7 },
          colors: ["#0f766e", "#f59e0b", "#ef4444", "#84cc16", "#8b5cf6"], ...opts });
      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.9 });
      showToast("🎉 Roadmap complete! Time to apply.");
    }
    prevPct.current = totals.pct;
  }, [totals.pct, totals.total, showToast]);

  const toggle = (id: string) => setProgress((p) => ({ ...p, [id]: !p[id] }));

  const generate = async (res: string, r: string) => {
    setLoading(true);
    try {
      const data = await api.roadmap(res, r, timeline);
      setRoadmap(data);
      setProgress({});
      showToast("Your roadmap is ready — scroll down!");
      setTimeout(() => document.getElementById("roadmap")?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e: unknown) {
      showToast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRole = customRole.trim() || role;
    if (resume.trim().length < 20) { showToast("Please paste at least a short skills summary.", "error"); return; }
    generate(resume.trim(), finalRole);
  };

  const useSample = () => {
    setResume(SAMPLE_RESUME);
    generate(SAMPLE_RESUME, customRole.trim() || role);
  };

  return (
    <div className="min-h-screen bg-surface">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2">
            <span className="grid place-items-center size-9 rounded-xl bg-primary-700 text-white shadow-soft">
              <Compass className="size-5" />
            </span>
            <span className="font-bold text-xl tracking-tight">
              CareerCompass <span className="text-accent">AI</span>
            </span>
          </a>
          <nav className="hidden sm:flex items-center gap-7 text-sm text-slate-500">
            <a href="#how" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#generator" className="hover:text-slate-900 transition-colors">Generate</a>
            <a href="#compare" className="hover:text-slate-900 transition-colors">Compare</a>
            {roadmap && <a href="#roadmap" className="hover:text-slate-900 transition-colors">My roadmap</a>}
          </nav>
          <Button size="sm">
            <a href="#generator" className="flex items-center gap-2">Start <ArrowRight className="size-4" /></a>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative overflow-hidden bg-aurora">
        <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-24 text-center">
          <Badge className="bg-white/80 border border-slate-200 text-slate-600">
            <Sparkles className="size-3.5 text-accent" /> AI-powered career roadmap generator
          </Badge>
          <h1 className="mt-6 font-bold text-5xl sm:text-6xl lg:text-7xl leading-[1.05] text-slate-900">
            Your resume.<br />
            <span className="text-primary-700">Your goal.</span>{" "}
            <span className="text-red-500">Your path.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500 leading-relaxed">
            From skills to a personalized 30/60/90-day action plan in under 60 seconds —
            with weekly tasks, free resources, and progress tracking.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg"><a href="#generator" className="flex items-center gap-2">Build my roadmap <ArrowRight className="size-4" /></a></Button>
            <Button size="lg" variant="outline"><a href="#how">See how it works</a></Button>
          </div>
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { icon: Target, label: "Skill gap analysis", desc: "Strengths vs. gaps, ranked" },
              { icon: ListChecks, label: "Weekly action plan", desc: "Concrete tasks, not advice" },
              { icon: BookOpen, label: "Free resources", desc: "Courses, projects, docs" },
            ].map((f) => (
              <div key={f.label} className="rounded-2xl border border-white/80 bg-white/70 backdrop-blur p-5 text-left shadow-soft">
                <f.icon className="size-5 text-primary-700" />
                <div className="mt-3 font-semibold">{f.label}</div>
                <div className="text-sm text-slate-500">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <Badge className="bg-slate-100 text-slate-600">How it works</Badge>
          <h2 className="mt-3 font-bold text-3xl sm:text-4xl">Three steps to clarity</h2>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {[
            { n: "01", title: "Tell us where you are", body: "Paste your resume or a short summary of your current skills. The more honest, the better." },
            { n: "02", title: "Pick where you're going", body: "Choose a target role and a timeline — 30, 60, or 90 days. We tailor the plan to your starting point." },
            { n: "03", title: "Follow your weekly plan", body: "Check off tasks as you complete them. Watch your progress bar fill as you close the gap." },
          ].map((s) => (
            <Card key={s.n} className="p-6">
              <div className="font-bold text-3xl text-accent">{s.n}</div>
              <h3 className="mt-3 font-semibold text-lg">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{s.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Generator */}
      <section id="generator" className="mx-auto max-w-6xl px-6 py-20">
        <Card className="overflow-hidden">
          <div className="grid lg:grid-cols-[1.1fr_1fr]">
            <form onSubmit={onSubmit} className="p-8 sm:p-10 bg-surface">
              <Badge className="bg-primary-50 text-primary-700 border border-primary-100">
                <Sparkles className="size-3" /> Generate roadmap
              </Badge>
              <h2 className="mt-3 font-bold text-3xl">Build your plan</h2>
              <p className="mt-1 text-slate-500 text-sm">Takes ~30 seconds. Nothing is stored on our servers.</p>

              <div className="mt-7 space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="resume" className="text-sm font-medium text-slate-700">Your resume or skills summary</label>
                    <button type="button" onClick={useSample} disabled={loading}
                      className="text-xs text-primary-700 hover:underline flex items-center gap-1 disabled:opacity-50">
                      <Lightbulb className="size-3" /> Try with sample resume
                    </button>
                  </div>
                  <textarea id="resume" value={resume} onChange={(e) => setResume(e.target.value)}
                    placeholder="Paste your resume text, or describe your background: education, skills, projects, internships, what you're weak at..."
                    className="w-full min-h-44 resize-y rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  <div className="mt-1 text-xs text-slate-400">{resume.length} characters</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Target role</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ROLES.map((r) => (
                      <button type="button" key={r}
                        onClick={() => { setRole(r); setCustomRole(""); }}
                        className={cn("rounded-full px-3 py-1.5 text-xs font-medium border transition-all",
                          role === r && !customRole
                            ? "bg-primary-700 text-white border-primary-700"
                            : "bg-white hover:bg-slate-50 text-slate-700 border-border")}>
                        {r}
                      </button>
                    ))}
                  </div>
                  <input placeholder="…or type a custom role" value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    className="mt-3 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Timeline</label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(["30", "60", "90"] as const).map((t) => (
                      <button type="button" key={t} onClick={() => setTimeline(t)}
                        className={cn("rounded-xl border px-4 py-3 text-sm font-medium transition-all",
                          timeline === t ? "border-primary-700 bg-primary-50 text-primary-700" : "border-border bg-white text-slate-500 hover:text-slate-900")}>
                        <div className="font-bold text-xl">{t}</div>
                        <div className="text-xs">days</div>
                      </button>
                    ))}
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? <><Loader2 className="size-4 animate-spin" /> Analyzing your background…</> : <><Sparkles className="size-4" /> Generate my roadmap</>}
                </Button>
                {loading && <LoadingSteps />}
              </div>
            </form>

            <div className="p-8 sm:p-10 bg-gradient-to-br from-primary-50 via-amber-50/30 to-red-50/20 border-l border-border">
              <div className="space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400">What you&apos;ll get</p>
                  <h3 className="mt-1 font-bold text-2xl">A mentor in your pocket</h3>
                </div>
                {[
                  { icon: TrendingUp, t: "Skill gap analysis", d: "Honest read on strengths and what's missing." },
                  { icon: ListChecks, t: "Week-by-week tasks", d: "2–4 concrete actions per week." },
                  { icon: BookOpen, t: "Curated free resources", d: "Courses, docs, projects — no paywalls first." },
                  { icon: CheckCircle2, t: "Progress tracker", d: "Tick off tasks and watch momentum build." },
                ].map((f) => (
                  <div key={f.t} className="flex gap-3">
                    <div className="grid place-items-center size-9 rounded-lg bg-white border border-border shrink-0">
                      <f.icon className="size-4 text-primary-700" />
                    </div>
                    <div>
                      <div className="font-medium">{f.t}</div>
                      <div className="text-sm text-slate-500">{f.d}</div>
                    </div>
                  </div>
                ))}
                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pro tip</div>
                  <p className="mt-1 text-sm text-amber-800">Mention what you&apos;re weak at — the AI uses gaps to prioritize your plan.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Roadmap output */}
      {roadmap && (
        <section id="roadmap" className="mx-auto max-w-6xl px-6 pb-16">
          <RoadmapView roadmap={roadmap} resume={resume || SAMPLE_RESUME} progress={progress}
            toggle={toggle} totals={totals}
            onReset={() => {
              setRoadmap(null); setProgress({});
              localStorage.removeItem(ROADMAP_KEY); localStorage.removeItem(STORAGE_KEY);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }} />
        </section>
      )}

      <CompareSection />

      {/* Footer */}
      <footer className="border-t border-border bg-white/50">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <Compass className="size-4 text-primary-700" />
            <span>CareerCompass AI — built for hackathons &amp; humans.</span>
          </div>
          <div>
            Built by{" "}
            <a href="https://github.com/Dibyansu33Gouda" target="_blank" rel="noreferrer"
              className="text-primary-700 font-medium hover:underline">
              Dibyansu Gouda
            </a>
            {" · "}
            <a href="https://github.com/Dibyansu33Gouda/career-compass-ai-242" target="_blank" rel="noreferrer"
              className="hover:text-slate-700 transition-colors inline-flex items-center gap-1">
              <Github className="size-3.5" /> View on GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
