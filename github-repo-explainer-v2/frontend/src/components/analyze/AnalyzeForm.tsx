import { useState, type FormEvent } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EXAMPLE_REPOS } from "@/data/mock-data";

interface AnalyzeFormProps {
  /** Called with the URL to analyze when the form is submitted. */
  onAnalyze: (url: string) => void;
  loading: boolean;
}

/**
 * The primary input for the whole app. Works for ANY public GitHub
 * repository URL typed or pasted into the text input — the Select
 * dropdown is only a convenience shortcut that fills the input with
 * one of a few example URLs, it does not restrict what can be
 * analyzed.
 */
export function AnalyzeForm({ onAnalyze, loading }: AnalyzeFormProps) {
  const [url, setUrl] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!url.trim() || loading) return;
    onAnalyze(url.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://github.com/owner/repository"
        className="font-mono text-sm"
        spellCheck={false}
        autoComplete="off"
      />

      {/* Quick-pick examples - purely a convenience, not a restriction */}
      <Select onValueChange={(value) => setUrl(value)}>
        <SelectTrigger className="sm:w-56">
          <SelectValue placeholder="Or pick an example" />
        </SelectTrigger>
        <SelectContent>
          {EXAMPLE_REPOS.map((repo) => (
            <SelectItem key={repo.url} value={repo.url}>
              {repo.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button type="submit" variant="accent" disabled={loading || !url.trim()}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight className="h-4 w-4" />
        )}
        {loading ? "Analyzing..." : "Analyze"}
      </Button>
    </form>
  );
}
