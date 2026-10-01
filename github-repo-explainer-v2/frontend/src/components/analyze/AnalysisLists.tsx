import { Badge } from "@/components/ui/badge";

/** Renders the tech_stack string array as a row of badges. */
export function TechStackBadges({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((tech, i) => (
        <Badge key={`${tech}-${i}`} variant="secondary" className="font-mono">
          {tech}
        </Badge>
      ))}
    </div>
  );
}

/** Renders an ordered list of steps (used for "how_to_run"). */
export function StepList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2.5">
      {items.map((step, i) => (
        <li key={i} className="flex gap-3 text-sm">
          <span className="mt-0.5 shrink-0 font-mono text-xs text-accent">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="text-muted-foreground leading-relaxed">{step}</span>
        </li>
      ))}
    </ol>
  );
}

/** Renders a plain bulleted list (used for "improvements"). */
export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <span className="text-muted-foreground leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Renders a Q-numbered list (used for "interview_questions"). */
export function QuestionList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((q, i) => (
        <li key={i} className="flex gap-3 text-sm">
          <span className="mt-0.5 shrink-0 font-mono text-xs text-primary">Q{i + 1}</span>
          <span className="text-muted-foreground leading-relaxed">{q}</span>
        </li>
      ))}
    </ul>
  );
}
