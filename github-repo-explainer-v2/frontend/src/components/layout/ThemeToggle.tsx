import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Reads/writes localStorage directly (no React Context needed for an
 * app this size — a context provider would be the next step if theme
 * state needed to be read in many disconnected component trees).
 * Tailwind's `darkMode: ["class"]` setting (tailwind.config.ts) means
 * adding/removing the "dark" class on <html> is ALL that's needed to
 * flip every `dark:` utility across the whole app.
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsDark((prev) => !prev)}
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
