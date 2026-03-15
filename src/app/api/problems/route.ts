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

    const [data, total] = await Promise.all([
      prisma.problem.findMany({
        where: { userId: session.user.id },
        orderBy: { solvedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.problem.count({
        where: { userId: session.user.id },
      }),
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
