/**
 * These types mirror the FastAPI backend's response shape EXACTLY —
 * see backend/main.py's `/analyze` endpoint and backend/gemini.py's
 * forced JSON schema. Keeping the frontend types and backend response
 * in lockstep means swapping mock data for the real API call (see
 * lib/api.ts) requires zero type changes — just a different data source.
 */

/** One entry in the repo's top-level folder listing. */
export interface RepoContentItem {
  name: string;
  type: "dir" | "file";
}

/** Repository metadata, as returned by GitHub's REST API (trimmed to what we use). */
export interface RepoInfo {
  name: string;
  full_name: string;
  description: string | null;
  stars: number;
  forks: number;
  open_issues: number;
  language: string | null;
  owner: string;
  owner_avatar: string;
  html_url: string;
  topics: string[];
  default_branch: string;
  license: string | null;
  created_at: string;
  updated_at: string;
}

/** The structured explanation Gemini returns (schema is enforced server-side). */
export interface GeminiAnalysis {
  purpose: string;
  architecture: string;
  tech_stack: string[];
  how_to_run: string[];
  interview_questions: string[];
  improvements: string[];
}

/** The full payload returned by POST /analyze. */
export interface AnalyzeResponse {
  repo: RepoInfo;
  readme: string;
  contents: RepoContentItem[];
  analysis: GeminiAnalysis;
}

/** A quick-pick example shown in the Select dropdown next to the search bar. */
export interface ExampleRepo {
  label: string;
  url: string;
}
