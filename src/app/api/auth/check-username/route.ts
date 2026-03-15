import { NextRequest, NextResponse } from "next/server";
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

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "Username parameter required" },
      { status: 400 },
    );
  }

  if (username.length < 3 || username.length > 20) {
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
    return NextResponse.json({ available: false }, { status: 200 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  return NextResponse.json({ available: !existingUser }, { status: 200 });
}
