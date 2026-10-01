import { useState } from "react";
import {
  Sparkles,
  Network,
  Layers,
  Terminal,
  MessageCircleQuestion,
  Wrench,
  TriangleAlert,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { AnalyzeForm } from "@/components/analyze/AnalyzeForm";
import { RepoOverviewCard } from "@/components/analyze/RepoOverviewCard";
import { FolderStructureTable } from "@/components/analyze/FolderStructureTable";
import { AnalysisSection } from "@/components/analyze/AnalysisSection";
import {
  TechStackBadges,
  StepList,
  BulletList,
  QuestionList,
} from "@/components/analyze/AnalysisLists";
import { AnalysisLoadingState } from "@/components/analyze/AnalysisLoadingState";
import { EmptyState } from "@/components/analyze/EmptyState";
import { TooltipProvider } from "@/components/ui/tooltip";

import { analyzeRepository } from "@/lib/api";
import type { AnalyzeResponse } from "@/types/analysis";

/**
 * Top-level page component. Owns three pieces of state:
 *   - result:  the last successful AnalyzeResponse (or null before any search)
 *   - loading: whether a request is currently in flight
 *   - error:   a user-facing error message, if the last request failed
 *
 * `handleAnalyze` is the ONLY place that calls the backend — swapping
 * mock data for real data, or changing the API contract, only ever
 * touches this one function plus lib/api.ts and types/analysis.ts.
 */
export default function App() {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(url: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // This works for ANY public GitHub repo URL - not just the
      // examples in the Select dropdown, which are just shortcuts.
      const data = await analyzeRepository(url);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <TooltipProvider delayDuration={150}>
      <AppShell>
        <div className="space-y-6">
          <AnalyzeForm onAnalyze={handleAnalyze} loading={loading} />

          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading && <AnalysisLoadingState />}

          {!loading && !result && !error && <EmptyState />}

          {!loading && result && (
            <div className="space-y-6">
              <RepoOverviewCard repo={result.repo} readme={result.readme} />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
                {/* Main column: text + list-based analysis sections */}
                <div className="order-2 space-y-6 lg:order-1">
                  <AnalysisSection icon={Sparkles} title="Purpose">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {result.analysis.purpose}
                    </p>
                  </AnalysisSection>

                  <AnalysisSection icon={Network} title="Architecture">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {result.analysis.architecture}
                    </p>
                  </AnalysisSection>

                  <AnalysisSection icon={Layers} title="Tech stack">
                    <TechStackBadges items={result.analysis.tech_stack} />
                  </AnalysisSection>

                  <AnalysisSection icon={MessageCircleQuestion} title="Interview questions">
                    <QuestionList items={result.analysis.interview_questions} />
                  </AnalysisSection>

                  <AnalysisSection icon={Wrench} title="Potential improvements">
                    <BulletList items={result.analysis.improvements} />
                  </AnalysisSection>
                </div>

                {/* Side column: folder structure + how to run */}
                <div className="order-1 space-y-6 lg:order-2">
                  <FolderStructureTable contents={result.contents} />
                  <AnalysisSection icon={Terminal} title="How to run">
                    <StepList items={result.analysis.how_to_run} />
                  </AnalysisSection>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </TooltipProvider>
  );
}
