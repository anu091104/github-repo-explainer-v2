import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ReadmeDialogProps {
  readme: string;
  repoName: string;
  children: ReactNode;
}

/**
 * Shows the full raw README inside a modal instead of cluttering the
 * main dashboard with a huge scroll of markdown. `children` is the
 * trigger element (the "View README" button in RepoOverviewCard).
 */
export function ReadmeDialog({ readme, repoName, children }: ReadmeDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{repoName} — README</DialogTitle>
        </DialogHeader>
        <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-foreground">
          {readme || "No README found in this repository."}
        </pre>
      </DialogContent>
    </Dialog>
  );
}
