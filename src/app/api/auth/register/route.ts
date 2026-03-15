import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

interface RegisterBody {
  username: string;
  email: string;
  password: string;
}

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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody;
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: "Username must be between 3 and 20 characters" },
        { status: 400 },
      );
    }

    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json(
        {
          error:
            "Username can only contain lowercase letters, numbers, and underscores",
        },
        { status: 400 },
      );
    }

    if (RESERVED_USERNAMES.includes(username)) {
      return NextResponse.json(
        { error: "This username is reserved" },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        usernameSet: true,
      },
    });

    return NextResponse.json(
      { message: "Registration successful" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
