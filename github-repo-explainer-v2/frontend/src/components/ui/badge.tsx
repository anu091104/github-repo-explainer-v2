import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Badge variants map directly to the status meanings used across the
 * dashboard:
 *   default   -> neutral / informational (e.g. a topic tag)
 *   secondary -> muted metadata (e.g. license name)
 *   accent    -> "AI-generated" content markers
 *   success   -> "Active" / "Model Trained" style positive status
 *   outline   -> lightweight, for dense areas like folder listings
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        accent: "border-transparent bg-accent text-accent-foreground",
        success:
          "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
