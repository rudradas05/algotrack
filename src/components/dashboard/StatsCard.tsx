import { Card, CardContent } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  /** Optional subtitle (e.g. "days in a row" for streak) */
  subtitle?: string;
  /** Optional: emphasize card (e.g. for streak) */
  variant?: "default" | "streak";
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
  variant = "default",
}: StatsCardProps) {
  const isStreak = variant === "streak";
  return (
    <Card
      className={
        isStreak
          ? "rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
          : "glass-card"
      }
    >
      <CardContent
        className={`flex items-center justify-between gap-4 p-5 ${
          isStreak ? "bg-gradient-to-br from-orange-500/5 to-amber-500/5 dark:from-orange-500/10 dark:to-amber-500/10" : ""
        }`}
      >
        <div className="space-y-0.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          <p className="text-3xl font-bold leading-none tabular-nums">{value}</p>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>

        <div
          className={`rounded-xl p-3 shadow-sm ${color} ${
            isStreak ? "ring-2 ring-orange-400/20" : ""
          }`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
      </CardContent>
    </Card>
  );
}
