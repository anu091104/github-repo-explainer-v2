import axios, { type AxiosError } from "axios";
import type { AnalyzeResponse } from "@/types/analysis";

/**
 * VITE_API_BASE_URL is read at BUILD time by Vite (any env var prefixed
 * with VITE_ is baked into the JS bundle). Locally it comes from
 * frontend/.env; on Vercel from Project Settings -> Environment Variables.
 * It must point at the deployed backend (Render), not localhost.
 */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000").replace(/\/+$/, "");

const client = axios.create({
  baseURL: API_BASE_URL,
  // Render's free tier "sleeps" after ~15 min idle and needs up to a minute
  // to wake up, and Gemini itself can take a while - so allow 2 minutes.
  timeout: 120000,
});

/**
 * Sends a GitHub repo URL to the backend and returns repo metadata,
 * README, folder contents, and the AI-generated analysis.
 * Throws a plain Error with a user-friendly message on failure.
 */
export async function analyzeRepository(url: string): Promise<AnalyzeResponse> {
  try {
    const { data } = await client.post<AnalyzeResponse>("/analyze", { url });
    return data;
  } catch (err) {
    const axiosErr = err as AxiosError<{ detail?: unknown }>;
    const detail = axiosErr.response?.data?.detail;

    let message: string;
    if (typeof detail === "string") {
      message = detail; // our backend's own error message
    } else if (axiosErr.code === "ECONNABORTED") {
      message = "The server took too long to respond. It may be waking up - please try again.";
    } else if (!axiosErr.response) {
      message = `Can't reach the backend at ${API_BASE_URL}. Is it running?`;
    } else {
      message = axiosErr.message || "Something went wrong while analyzing that repository.";
    }
    throw new Error(message);
  }
}

export interface HealthResponse {
  status: string;
  gemini_configured: boolean;
}

/**
 * Pings GET /health. Called once when the page loads, which (1) powers the
 * real "API Status" badge in the sidebar and (2) starts waking up a sleeping
 * Render server before the user even clicks Analyze.
 */
export async function checkHealth(): Promise<HealthResponse> {
  const { data } = await client.get<HealthResponse>("/health", { timeout: 90000 });
  return data;
}
