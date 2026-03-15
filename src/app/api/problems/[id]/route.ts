import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { solvedByMe, needsRetry, retryNotes } = body;

    // Verify user owns this problem
    const problem = await prisma.problem.findUnique({
      where: { id },
    });

    if (!problem || problem.userId !== session.user.id) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Sanitize and validate retryNotes
    let sanitizedNotes = retryNotes;
    if (typeof retryNotes === "string") {
      sanitizedNotes = retryNotes.trim().slice(0, 500);
    }

    // Build update object
    const updateData: any = {};
    if (typeof solvedByMe === "boolean") {
      updateData.solvedByMe = solvedByMe;
    }
    if (typeof needsRetry === "boolean") {
      updateData.needsRetry = needsRetry;
    }
    if (retryNotes !== undefined) {
      updateData.retryNotes = sanitizedNotes || "";
    }

    const updatedProblem = await prisma.problem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedProblem);
  } catch (error) {
    console.error("Problem update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
