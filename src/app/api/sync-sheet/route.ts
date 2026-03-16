import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncAllToGoogleSheet } from "@/lib/sheets";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const problems = await prisma.problem.findMany({
      where: { userId: session.user.id },
      select: { title: true, slug: true, topic: true, difficulty: true },
      orderBy: { solvedAt: "asc" },
    });

    if (problems.length === 0) {
      return NextResponse.json({
        synced: 0,
        alreadyInSheet: 0,
        message: "No problems found in database",
      });
    }

    const result = await syncAllToGoogleSheet(problems);

    return NextResponse.json({
      ...result,
      totalInDb: problems.length,
      message:
        result.synced > 0
          ? `Synced ${result.synced} new problem(s) to Google Sheet`
          : "All problems already in Google Sheet",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Sync sheet error:", message);
    return NextResponse.json(
      { error: "Failed to sync to Google Sheet", details: message },
      { status: 500 },
    );
  }
}
