import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { AllProblemsClient } from "@/components/problems/AllProblemsClient";

export default async function AllProblemsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // Fetch all user problems
  const problems = await prisma.problem.findMany({
    where: { userId },
    orderBy: { solvedAt: "desc" },
  });

  // Get distinct difficulties and topics for filters
  const difficultyData = await prisma.problem.groupBy({
    by: ["difficulty"],
    where: { userId },
  });

  const topicData = await prisma.problem.groupBy({
    by: ["topic"],
    where: { userId },
  });

  const difficulties = difficultyData
    .map((d) => d.difficulty)
    .filter(Boolean)
    .sort();
  const topics = topicData
    .map((t) => t.topic)
    .filter(Boolean)
    .sort();

  // Compute stats from the data we already fetched
  const stats = {
    total: problems.length,
    easy: problems.filter((p) => p.difficulty === "Easy").length,
    medium: problems.filter((p) => p.difficulty === "Medium").length,
    hard: problems.filter((p) => p.difficulty === "Hard").length,
    retry: problems.filter((p) => p.needsRetry).length,
    solvedByMe: problems.filter((p) => p.solvedByMe).length,
  };

  // Convert dates to ISO strings for serialization
  const problemsData = problems.map((p) => ({
    ...p,
    solvedAt: p.solvedAt.toISOString(),
  }));

  return (
    <div className="min-h-screen">
      <DashboardNav
        username={session.user.username}
        image={session.user.image}
      />
      <main className="container mx-auto px-4 py-8">
        <div className="glass-card mb-8 rounded-3xl p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Problem Library
          </p>
          <h1 className="mt-2 text-3xl font-bold">All Problems</h1>
          <p className="mt-2 text-muted-foreground">
            Manage and track all your LeetCode problems
          </p>
        </div>

        <AllProblemsClient
          initialProblems={problemsData}
          availableDifficulties={difficulties}
          availableTopics={topics}
          stats={stats}
        />
      </main>
    </div>
  );
}
