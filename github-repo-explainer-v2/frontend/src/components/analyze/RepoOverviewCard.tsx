import { ExternalLink, Star, GitFork, CircleAlert, FileText } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "./StatCard";
import { ReadmeDialog } from "./ReadmeDialog";
import type { RepoInfo } from "@/types/analysis";

interface RepoOverviewCardProps {
  repo: RepoInfo;
  readme: string;
}

/** Formats large numbers as e.g. "82.4k" for compact stat display. */
function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function RepoOverviewCard({ repo, readme }: RepoOverviewCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted-foreground">{repo.owner}/</p>
          <a
            href={repo.html_url}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-2 font-display text-xl font-semibold hover:text-primary transition-colors"
          >
            {repo.name}
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </a>
          {repo.description && (
            <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
              {repo.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {repo.language && <Badge variant="accent">{repo.language}</Badge>}
          <ReadmeDialog readme={readme} repoName={repo.name}>
            <Button variant="outline" size="sm">
              <FileText className="h-3.5 w-3.5" />
              View README
            </Button>
          </ReadmeDialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stat row - reuses StatCard for each metric */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={Star} label="Stars" value={formatCount(repo.stars)} />
          <StatCard icon={GitFork} label="Forks" value={formatCount(repo.forks)} />
          <StatCard icon={CircleAlert} label="Open issues" value={repo.open_issues} />
        </div>

        {/* Topics + license. Previously the license only showed if the repo had topics. */}
        {(repo.topics?.length > 0 || repo.license) && (
          <div className="flex flex-wrap gap-1.5">
            {(repo.topics ?? []).map((topic) => (
              <Badge key={topic} variant="outline">
                {topic}
              </Badge>
            ))}
            {repo.license && <Badge variant="secondary">{repo.license}</Badge>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
