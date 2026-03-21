"use client";

import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, TrendingUp, Flame, Target, Zap } from "lucide-react";

interface StreakDay {
  date: string;
  count: number;
}

const CELL_SIZE = 14;
const CELL_GAP = 4;
const TOTAL = CELL_SIZE + CELL_GAP;

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAY_LABELS = ["Mon", "Wed", "Fri"];

function getColor(count: number): string {
  if (count === 0) return "#e5e7eb";
  if (count === 1) return "#86efac";
  if (count === 2) return "#4ade80";
  if (count <= 4) return "#22c55e";
  return "#16a34a";
}

function getColorClass(count: number): string {
  if (count === 0) return "bg-muted";
  if (count === 1) return "bg-emerald-300 dark:bg-emerald-900/50";
  if (count === 2) return "bg-emerald-400 dark:bg-emerald-700";
  if (count <= 4) return "bg-emerald-500 dark:bg-emerald-600";
  return "bg-emerald-600 dark:bg-emerald-500";
}

interface DayData {
  date: Date;
  count: number;
  dateStr: string;
}

export function StreakDisplay({ streaks }: { streaks: StreakDay[] }) {
  const calendarContainerRef = useRef<HTMLDivElement | null>(null);
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const streakMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of streaks) {
      const d = new Date(item.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      map.set(key, item.count);
    }
    return map;
  }, [streaks]);

  // Build 365 days of data (past year up to today)
  const { days, weeks, monthPositions } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allDays: DayData[] = [];
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      allDays.push({
        date,
        count: streakMap.get(key) ?? 0,
        dateStr: key,
      });
    }

    // Group into weeks (columns). Each week is Sun(0)-Sat(6)
    const weekGroups: DayData[][] = [];
    let currentWeek: DayData[] = [];

    // Pad the first week with empty days before the first day
    const firstDayOfWeek = allDays[0].date.getDay(); // 0=Sun
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({
        date: new Date(0),
        count: -1, // sentinel for empty cell
        dateStr: "",
      });
    }

    for (const day of allDays) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weekGroups.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      weekGroups.push(currentWeek);
    }

    // Determine month label positions
    const monthPos: { month: number; col: number }[] = [];
    let lastMonth = -1;
    for (let col = 0; col < weekGroups.length; col++) {
      const realDays = weekGroups[col].filter((d) => d.count >= 0);
      if (realDays.length > 0) {
        const firstRealDay = realDays[0];
        const month = firstRealDay.date.getMonth();
        if (month !== lastMonth) {
          monthPos.push({ month, col });
          lastMonth = month;
        }
      }
    }

    return { days: allDays, weeks: weekGroups, monthPositions: monthPos };
  }, [streakMap]);

  // Stats
  const activeDays = days.filter((d) => d.count > 0).length;
  const totalSolved = days.reduce((sum, d) => sum + d.count, 0);
  const bestDay = days.reduce((max, d) => Math.max(max, d.count), 0);
  const last30 = days.slice(-30);
  const solvedLast30 = last30.reduce((sum, d) => sum + d.count, 0);

  // Build area chart data for last 30 days
  const chartData = useMemo(() => {
    const recent = days.slice(-30);
    const maxVal = Math.max(...recent.map((d) => d.count), 1);
    const chartW = 100;
    const chartH = 40;
    const step = chartW / (recent.length - 1 || 1);

    const points = recent.map((d, i) => ({
      x: Math.round(i * step * 100) / 100,
      y: Math.round((chartH - (d.count / maxVal) * chartH) * 100) / 100,
    }));

    const linePath = points.map((p) => `${p.x},${p.y}`).join(" ");
    const areaPath = `0,${chartH} ${linePath} ${points[points.length - 1]?.x ?? 0},${chartH}`;

    return { points, linePath, areaPath, maxVal, chartW, chartH };
  }, [days]);

  // SVG dimensions for the heatmap
  const labelOffset = 36;
  const svgWidth = labelOffset + weeks.length * TOTAL;
  const svgHeight = 24 + 7 * TOTAL;

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-primary/10 p-2">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold tracking-tight">
                Activity & progress
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Last 365 days · {totalSolved} problems solved
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Activity calendar (contribution-style heatmap) */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">
            Activity calendar
          </h3>
          <div
            ref={calendarContainerRef}
            className="rounded-xl border border-border bg-muted/20 p-4 overflow-x-auto relative min-h-35"
          >
            <svg
              width={svgWidth}
              height={svgHeight}
              className="min-w-full"
              style={{ minWidth: svgWidth }}
            >
              {/* Month labels */}
              {monthPositions.map(({ month, col }, i) => (
                <text
                  key={`month-${i}`}
                  x={labelOffset + col * TOTAL}
                  y={14}
                  className="fill-muted-foreground"
                  fontSize="11"
                  fontFamily="inherit"
                  fontWeight="500"
                >
                  {MONTH_LABELS[month]}
                </text>
              ))}

              {/* Day-of-week labels */}
              {DAY_LABELS.map((label, i) => {
                const row = [1, 3, 5][i];
                return (
                  <text
                    key={`day-${i}`}
                    x={0}
                    y={24 + row * TOTAL + CELL_SIZE - 2}
                    className="fill-muted-foreground"
                    fontSize="10"
                    fontFamily="inherit"
                  >
                    {label}
                  </text>
                );
              })}

              {/* Grid cells */}
              {weeks.map((week, col) =>
                week.map((day, row) => {
                  if (day.count < 0) return null;
                  return (
                    <rect
                      key={`${col}-${row}`}
                      x={labelOffset + col * TOTAL}
                      y={24 + row * TOTAL}
                      width={CELL_SIZE}
                      height={CELL_SIZE}
                      rx={3}
                      ry={3}
                      fill={getColor(day.count)}
                      stroke="rgba(0,0,0,0.06)"
                      strokeWidth={0.5}
                      className="cursor-pointer transition-opacity hover:opacity-90"
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const parent =
                          calendarContainerRef.current?.getBoundingClientRect();
                        if (parent) {
                          setTooltip({
                            text: `${day.count} problem${day.count !== 1 ? "s" : ""} on ${day.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
                            x: rect.left - parent.left + CELL_SIZE / 2,
                            y: rect.top - parent.top - 8,
                          });
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                }),
              )}
            </svg>

            {tooltip && (
              <div
                className="pointer-events-none absolute z-50 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md"
                style={{
                  left: tooltip.x,
                  top: tooltip.y,
                  transform: "translate(-50%, -100%)",
                }}
              >
                {tooltip.text}
              </div>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <span className="text-xs text-muted-foreground">Less</span>
              <div className="flex items-center gap-0.5">
                {[0, 1, 2, 3, 5].map((count, i) => (
                  <div
                    key={i}
                    className={`h-3 w-3 rounded-sm ${getColorClass(count)}`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">More</span>
            </div>
          </div>
        </div>

        {/* Progress (last 30 days) + Activity summary */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Last 30 days progress chart */}
          <div className="rounded-xl border border-border bg-muted/10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Last 30 days
              </h3>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/50 p-4">
              <svg
                viewBox={`0 0 ${chartData.chartW} ${chartData.chartH}`}
                className="h-36 w-full"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                    <stop
                      offset="100%"
                      stopColor="#6366f1"
                      stopOpacity="0.02"
                    />
                  </linearGradient>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                {[0.25, 0.5, 0.75].map((frac) => (
                  <line
                    key={frac}
                    x1={0}
                    y1={chartData.chartH * frac}
                    x2={chartData.chartW}
                    y2={chartData.chartH * frac}
                    stroke="#e5e7eb"
                    strokeOpacity={0.6}
                    strokeWidth={0.3}
                  />
                ))}
                <polygon
                  points={chartData.areaPath}
                  fill="url(#areaGradient)"
                />
                <polyline
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={chartData.linePath}
                />
                {chartData.points.map(
                  (p, i) =>
                    last30[i]?.count > 0 && (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={1.5}
                        fill="#6366f1"
                      />
                    ),
                )}
              </svg>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>30 days ago</span>
                <span className="font-medium text-foreground">Today</span>
              </div>
            </div>
          </div>

          {/* Activity summary (streak & progress stats) */}
          <div className="rounded-xl border border-border bg-muted/10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="h-4 w-4 text-orange-500" />
              <h3 className="text-sm font-semibold text-foreground">
                Activity summary
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Active days",
                  value: activeDays,
                  sub: "out of 365",
                  icon: Target,
                  cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                },
                {
                  label: "Total solved",
                  value: totalSolved,
                  sub: "this year",
                  icon: Zap,
                  cls: "bg-primary/10 text-primary border-primary/20",
                },
                {
                  label: "Best day",
                  value: bestDay,
                  sub: "problems in a day",
                  icon: TrendingUp,
                  cls: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
                },
                {
                  label: "Last 30 days",
                  value: solvedLast30,
                  sub: "problems",
                  icon: Calendar,
                  cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                },
              ].map(({ label, value, sub, icon: Icon, cls }) => (
                <div
                  key={label}
                  className="rounded-xl border border-border/60 bg-background/50 p-3 flex items-start gap-3"
                >
                  <div className={`rounded-lg p-1.5 border ${cls}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold tabular-nums text-foreground">
                      {value}
                    </p>
                    <p className="text-xs font-medium text-foreground">
                      {label}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
