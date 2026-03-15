import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const totalSolved = await prisma.problem.count({
      where: { userId },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const solvedToday = await prisma.problem.count({
      where: {
        userId,
        solvedAt: { gte: today, lt: tomorrow },
      },
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
        (checkDate.getTime() - firstStreakDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (diffDays > 1) {
        currentStreak = 0;
      } else {
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

    return NextResponse.json({
      totalSolved,
      solvedToday,
      currentStreak,
      longestStreak,
      difficultyBreakdown,
      topicBreakdown,
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
