import type {
  Roadmap,
  InterviewSet,
  ProjectIdeas,
  AtsReport,
  CareerCompare,
} from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  roadmap: (resume: string, role: string, timeline: "30" | "60" | "90") =>
    post<Roadmap>("/api/roadmap", { resume, role, timeline }),

  interview: (resume: string, role: string) =>
    post<InterviewSet>("/api/interview", { resume, role }),

  projects: (role: string, gaps: string[]) =>
    post<ProjectIdeas>("/api/projects", { role, gaps }),

  ats: (resume: string, role: string) =>
    post<AtsReport>("/api/ats", { resume, role }),

  compare: (roleA: string, roleB: string) =>
    post<CareerCompare>("/api/compare", { roleA, roleB }),
};
