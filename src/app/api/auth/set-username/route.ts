import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const USERNAME_REGEX = /^[a-z0-9_]+$/;
const RESERVED_USERNAMES = [
  "admin",
  "algotrack",
  "support",
  "root",
  "api",
  "me",
  "dashboard",
  "profile",
  "onboarding",
  "login",
  "register",
];

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.usernameSet) {
      return NextResponse.json(
        { error: "Username already set" },
        { status: 403 },
      );
    }

    const body = (await request.json()) as { username: string };
    const { username } = body;

    if (!username || username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: "Invalid username format" },
        { status: 400 },
      );
    }

    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json(
        { error: "Invalid username format" },
        { status: 400 },
      );
    }

    if (RESERVED_USERNAMES.includes(username)) {
      return NextResponse.json(
        { error: "This username is reserved" },
        { status: 400 },
      );
    }

    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { username, usernameSet: true },
      });

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (dbError) {
      const errorMessage =
        dbError instanceof Error ? dbError.message : "Unknown error";
      if (errorMessage.includes("Unique constraint")) {
        return NextResponse.json(
          { error: "Username just taken, try another" },
          { status: 409 },
        );
      }
      throw dbError;
    }
  } catch (error) {
    console.error("Set username error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
