import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Trophy, Zap, Flame, Star } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentProblems } from "@/components/dashboard/RecentProblems";
import { StreakDisplay } from "@/components/dashboard/StreakDisplay";
import { DifficultyChart } from "@/components/charts/DifficultyChart";
import { TopicChart } from "@/components/charts/TopicChart";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

async function getStats(userId: string) {
  const totalSolved = await prisma.problem.count({ where: { userId } });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const solvedToday = await prisma.problem.count({
    where: { userId, solvedAt: { gte: today, lt: tomorrow } },
  });

  const difficultyData = await prisma.problem.groupBy({
    by: ["difficulty"],
    where: { userId },
    _count: { difficulty: true },
  });

  const difficultyBreakdown: Record<string, number> = {
    Easy: 0,
    Medium: 0,
    Hard: 0,
  };
  for (const entry of difficultyData) {
    difficultyBreakdown[entry.difficulty] = entry._count.difficulty;
  }

  const topicData = await prisma.problem.groupBy({
    by: ["topic"],
    where: { userId },
    _count: { topic: true },
  });

  const topicBreakdown: Record<string, number> = {};
  for (const entry of topicData) {
    topicBreakdown[entry.topic] = entry._count.topic;
  }

  const streaks = await prisma.streak.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });

  let currentStreak = 0;
  let longestStreak = 0;

  if (streaks.length > 0) {
    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    const firstStreakDate = new Date(streaks[0].date);
    firstStreakDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (checkDate.getTime() - firstStreakDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays <= 1) {
      currentStreak = 1;
      for (let i = 1; i < streaks.length; i++) {
        const prevDate = new Date(streaks[i - 1].date);
        const currDate = new Date(streaks[i].date);
        prevDate.setHours(0, 0, 0, 0);
        currDate.setHours(0, 0, 0, 0);

        const dayDiff = Math.floor(
          (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (dayDiff === 1 && streaks[i].solvedCount > 0) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    let tempStreak = 1;
    longestStreak = 1;
    for (let i = 1; i < streaks.length; i++) {
      const prevDate = new Date(streaks[i - 1].date);
      const currDate = new Date(streaks[i].date);
      prevDate.setHours(0, 0, 0, 0);
      currDate.setHours(0, 0, 0, 0);

      const dayDiff = Math.floor(
        (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (dayDiff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
  }

  return {
    totalSolved,
    solvedToday,
    currentStreak,
    longestStreak,
    difficultyBreakdown,
    topicBreakdown,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const stats = await getStats(userId);

  const recentProblems = await prisma.problem.findMany({
    where: { userId },
    orderBy: { solvedAt: "desc" },
    take: 10,
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const streakData = await prisma.streak.findMany({
    where: { userId, date: { gte: thirtyDaysAgo } },
    orderBy: { date: "asc" },
  });

  const streakDays = streakData.map((s) => ({
    date: s.date.toISOString(),
    count: s.solvedCount,
  }));

  const problemsForTable = recentProblems.map((p) => ({
    ...p,
    solvedAt: p.solvedAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav
        username={session.user.username}
        image={session.user.image}
      />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session.user.username}!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Solved"
            value={stats.totalSolved}
            icon={Trophy}
            color="bg-blue-500"
          />
          <StatsCard
            title="Solved Today"
            value={stats.solvedToday}
            icon={Zap}
            color="bg-yellow-500"
          />
          <StatsCard
            title="Current Streak"
            value={stats.currentStreak}
            icon={Flame}
            color="bg-orange-500"
          />
          <StatsCard
            title="Longest Streak"
            value={stats.longestStreak}
            icon={Star}
            color="bg-purple-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DifficultyChart data={stats.difficultyBreakdown} />
          <TopicChart data={stats.topicBreakdown} />
        </div>

        <RecentProblems problems={problemsForTable} />

        <StreakDisplay streaks={streakDays} />
      </main>
    </div>
  );
}
