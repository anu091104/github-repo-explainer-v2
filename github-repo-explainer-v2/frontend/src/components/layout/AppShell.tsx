import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarContent } from "./SidebarContent";
import { ThemeToggle } from "./ThemeToggle";

interface AppShellProps {
  children: ReactNode;
}

/**
 * Overall page layout: a fixed sidebar on desktop (md: and up), a
 * slide-in Sheet drawer on mobile (triggered by the hamburger button
 * in the header), and a sticky top header. `children` is the routed
 * page content — currently just the single Analyze dashboard.
 */
export function AppShell({ children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar - hidden below md breakpoint */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-card px-4 py-6 md:block">
        <SidebarContent />
      </aside>

      <div className="md:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile nav trigger - only visible below md breakpoint */}
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SidebarContent />
              </SheetContent>
            </Sheet>

            <div>
              <h1 className="font-display text-sm font-semibold sm:text-base">
                Repository Analysis
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Paste any public GitHub URL to get started
              </p>
            </div>
          </div>

          <ThemeToggle />
        </header>

        {/* Page content */}
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
