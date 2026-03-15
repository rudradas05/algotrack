import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const page = Math.max(
      1,
      parseInt(request.nextUrl.searchParams.get("page") || "1"),
    );
    const limit = Math.min(
      100,
      Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") || "20")),
    );

    // Get search and filter parameters
    const search = request.nextUrl.searchParams.get("search") || "";
    const difficulty = request.nextUrl.searchParams.get("difficulty") || "";
    const topic = request.nextUrl.searchParams.get("topic") || "";
    const solvedByMe = request.nextUrl.searchParams.get("solvedByMe");
    const needsRetry = request.nextUrl.searchParams.get("needsRetry");

    // Build where conditions
    const where: any = { userId: session.user.id };

    if (search.trim()) {
      where.title = { contains: search, mode: "insensitive" };
    }

    if (difficulty && difficulty !== "all") {
      where.difficulty = difficulty;
    }

    if (topic && topic !== "all") {
      where.topic = topic;
    }

    if (solvedByMe !== null) {
      where.solvedByMe = solvedByMe === "true";
    }

    if (needsRetry !== null) {
      where.needsRetry = needsRetry === "true";
    }

    const [data, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        orderBy: { solvedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.problem.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Problems API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
