import { cn } from "@/lib/utils";

/**
 * A pulsing placeholder block. Used to show the shape of content
 * (cards, table rows, text lines) while the /analyze request is in
 * flight, so the UI never looks "broken" or blank during loading.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
