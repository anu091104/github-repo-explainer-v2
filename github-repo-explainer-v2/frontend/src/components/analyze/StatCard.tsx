import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
}

/**
 * A single metric tile (used for Stars / Forks / Open Issues in the
 * repo overview row). Deliberately generic/reusable — any {icon,
 * label, value} triple can be dropped in without changing this file.
 */
export function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-lg font-semibold leading-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
