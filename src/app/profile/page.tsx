import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EditProfileButton } from "@/components/profile/EditProfileButton";

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
    <div className="min-h-screen bg-background">
      <DashboardNav username={user.username} image={user.image} />
      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 pt-8 pb-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.image || undefined} alt={user.username} />
              <AvatarFallback className="text-2xl">
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h1 className="text-2xl font-bold">{user.username}</h1>
              <p className="text-sm text-muted-foreground">
                Permanent — shown on leaderboards
              </p>
            </div>
            <p className="text-muted-foreground">{user.email}</p>
            <p className="text-sm text-muted-foreground">
              Member since {user.createdAt.toLocaleDateString()}
            </p>
            <div className="flex gap-8 pt-2">
              <div className="text-center">
                <p className="text-2xl font-bold">{totalSolved}</p>
                <p className="text-xs text-muted-foreground">Total Solved</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{currentStreak}</p>
                <p className="text-xs text-muted-foreground">Current Streak</p>
              </div>
            </div>
            <EditProfileButton />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Problems</CardTitle>
          </CardHeader>
          <CardContent>
            {recentProblems.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No problems solved yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recentProblems.map((problem) => (
                  <div
                    key={problem.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <a
                        href={problem.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {problem.title}
                      </a>
                      <p className="text-xs text-muted-foreground">
                        {problem.topic} —{" "}
                        {problem.solvedAt.toLocaleDateString()}
                      </p>
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
