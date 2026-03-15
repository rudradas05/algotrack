import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StreakDay {
  date: string;
  count: number;
}

export function StreakDisplay({ streaks }: { streaks: StreakDay[] }) {
  const days: { date: Date; count: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const streakEntry = streaks.find((s) => {
      const sDate = new Date(s.date);
      sDate.setHours(0, 0, 0, 0);
      return sDate.getTime() === date.getTime();
    });

    days.push({ date, count: streakEntry?.count || 0 });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Streak Calendar — Last 30 Days</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-10 gap-1.5">
          {days.map((day, i) => (
            <div
              key={i}
              className={`aspect-square rounded-sm ${
                day.count > 0 ? "bg-green-500" : "bg-muted"
              }`}
              title={`${day.date.toLocaleDateString()}: ${day.count} problem${day.count !== 1 ? "s" : ""}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <span>No solves</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <span>Solved</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
