import { GitBranch, Home, Info, BookOpen, Github } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useApiStatus, type ApiStatus } from "@/lib/use-api-status";

const REPO_URL = import.meta.env.VITE_REPO_URL || "https://github.com/anu091104";

/** How each real backend status is shown in the sidebar badge. */
const STATUS_UI: Record<
  ApiStatus,
  { label: string; variant: "success" | "secondary" | "destructive"; dot: string; title: string }
> = {
  checking: {
    label: "Checking",
    variant: "secondary",
    dot: "bg-amber-500 animate-pulse",
    title: "Contacting the backend (a sleeping free server can take up to a minute to wake).",
  },
  online: { label: "Online", variant: "success", dot: "bg-emerald-500", title: "Backend is up." },
  misconfigured: {
    label: "No API key",
    variant: "destructive",
    dot: "bg-white",
    title: "Backend is up but GEMINI_API_KEY is not set.",
  },
  offline: {
    label: "Offline",
    variant: "destructive",
    dot: "bg-white",
    title: "Could not reach the backend.",
  },
};

/**
 * Static nav links for this single-page dashboard. In a bigger app
 * these would drive a router (react-router); here they're anchors /
 * no-ops since the whole app lives on one page — kept as real nav
 * items because the assignment asks for "clean navigation links" and
 * because it's a natural place to grow into multiple routes later
 * (e.g. a saved-analyses history page).
 */
const NAV_ITEMS = [
  { label: "Analyze", icon: Home, active: true },
  { label: "Docs", icon: BookOpen, active: false },
  { label: "About", icon: Info, active: false },
];

export function SidebarContent() {
  const status = STATUS_UI[useApiStatus()];

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2 px-2 py-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <GitBranch className="h-5 w-5" />
        </div>
        <div>
          <p className="font-display text-sm font-semibold leading-tight">
            Repo Explainer
          </p>
          <p className="text-xs text-muted-foreground">AI dashboard</p>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Nav links */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ label, icon: Icon, active }) => (
          <a
            key={label}
            href="#"
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </a>
        ))}
      </nav>

      <Separator className="my-4" />

      {/* Status + profile footer */}
      <div className="space-y-3 px-2 pb-1">
        <div className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2">
          <span className="text-xs font-medium text-muted-foreground">API Status</span>
          <Badge variant={status.variant} className="gap-1" title={status.title}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </Badge>
        </div>

        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors"
        >
          <Github className="h-4 w-4" />
          View source
        </a>
      </div>
    </div>
  );
}
