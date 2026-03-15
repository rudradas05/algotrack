import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EditProfileButton } from "@/components/profile/EditProfileButton";
import { Trophy, Flame, Calendar, ExternalLink } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) redirect("/login");

  const totalSolved = await prisma.problem.count({
    where: { userId: user.id },
  });

  const streaks = await prisma.streak.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });

  let currentStreak = 0;
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
  }

  const recentProblems = await prisma.problem.findMany({
    where: { userId: user.id },
    orderBy: { solvedAt: "desc" },
    take: 5,
  });

  const difficultyColor: Record<string, string> = {
    Easy: "bg-green-500/10 text-green-500",
    Medium: "bg-yellow-500/10 text-yellow-500",
    Hard: "bg-red-500/10 text-red-500",
  };

  return (
    <div className="min-h-screen">
      <DashboardNav username={user.username} image={user.image} />
      <main className="container mx-auto px-4 py-10 max-w-2xl space-y-6">
        {/* Profile Card */}
        <Card className="glass-card rounded-3xl overflow-hidden">
          {/* Gradient banner */}
          <div className="h-28 bg-gradient-to-r from-blue-600 via-cyan-500 to-orange-400" />
          <CardContent className="flex flex-col items-center gap-3 -mt-14 pb-8 px-6">
            <Avatar className="h-28 w-28 border-4 border-white shadow-lg ring-2 ring-blue-500/20">
              <AvatarImage src={user.image || undefined} alt={user.username} />
              <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-blue-500 to-cyan-400 text-white">
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center mt-1">
              <h1 className="text-2xl font-bold gradient-title">
                {user.username}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {user.email}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Member since {user.createdAt.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-xs mt-3">
              <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-blue-500/8 border border-blue-500/15 py-4 px-3">
                <Trophy className="h-5 w-5 text-blue-500" />
                <p className="text-2xl font-bold">{totalSolved}</p>
                <p className="text-xs text-muted-foreground">Problems Solved</p>
              </div>
              <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-orange-500/8 border border-orange-500/15 py-4 px-3">
                <Flame className="h-5 w-5 text-orange-500" />
                <p className="text-2xl font-bold">{currentStreak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </div>

            <EditProfileButton />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="glass-card rounded-3xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {recentProblems.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No problems solved yet. Start your journey!
              </p>
            ) : (
              <div className="space-y-1">
                {recentProblems.map((problem, i) => (
                  <div
                    key={problem.id}
                    className={`flex items-center justify-between gap-3 py-3 px-3 rounded-xl transition-colors hover:bg-black/[0.03] ${
                      i < recentProblems.length - 1 ? "border-b border-border/50" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <a
                        href={problem.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 group"
                      >
                        <span className="truncate">{problem.title}</span>
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </a>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {problem.topic}
                        </span>
                        <span className="text-muted-foreground/40 text-xs">&middot;</span>
                        <span className="text-xs text-muted-foreground">
                          {problem.solvedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={difficultyColor[problem.difficulty] || ""}
                    >
                      {problem.difficulty}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
