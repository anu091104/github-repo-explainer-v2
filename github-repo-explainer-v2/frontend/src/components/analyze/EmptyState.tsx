import { GitBranch } from "lucide-react";

/**
 * Shown before the first analysis runs. A blank page reads as
 * "unfinished" — this gives the dashboard a deliberate, complete look
 * even with zero data yet.
 */
export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
        <GitBranch className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="font-display text-sm font-medium">No repository analyzed yet</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        Paste any public GitHub repository URL above and click Analyze to
        get started.
      </p>
    </div>
  );
}
