import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn() — the standard shadcn/ui helper.
 * clsx() lets you conditionally combine class names:
 *   cn("p-2", isActive && "bg-primary")
 * twMerge() then resolves conflicts between Tailwind classes so the
 * LAST one wins instead of both being applied (e.g. if a parent passes
 * `className="p-4"` to override a component's own `p-2`, twMerge keeps
 * only `p-4` instead of both fighting in the DOM).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
