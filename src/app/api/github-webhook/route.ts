import { NextRequest, NextResponse } from "next/server";
import { verifyGitHubWebhook, GitHubPushEvent } from "@/lib/github";
import { fetchLeetCodeMetadata } from "@/lib/leetcode";
import { appendToGoogleSheet } from "@/lib/sheets";
import { prisma } from "@/lib/prisma";

const COMMIT_PATTERN = /^Add solution:\s*\d+\.\s*(.+)$/i;

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
      console.error("GITHUB_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      );
    }

    const rawBody = Buffer.from(await request.arrayBuffer());
    const signature = request.headers.get("x-hub-signature-256");

    if (!verifyGitHubWebhook(rawBody, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event: GitHubPushEvent = JSON.parse(rawBody.toString("utf-8"));
    let processed = 0;

    for (const commit of event.commits) {
      const match = commit.message.match(COMMIT_PATTERN);
      if (!match) continue;

      const problemTitle = match[1].trim();
      const slug = titleToSlug(problemTitle);

      try {
        const metadata = await fetchLeetCodeMetadata(slug);

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { username: event.sender.login },
              {
                accounts: {
                  some: {
                    provider: "github",
                    providerAccountId: event.sender.login,
                  },
                },
              },
            ],
          },
        });

        if (!user) {
          console.warn(
            `No user found for GitHub username: ${event.sender.login}`,
          );
          continue;
        }

        const savedProblem = await prisma.problem.upsert({
          where: {
            slug_userId: {
              slug: metadata.slug,
              userId: user.id,
            },
          },
          update: {
            githubUrl: commit.url,
            solvedAt: new Date(),
          },
          create: {
            title: metadata.title,
            slug: metadata.slug,
            difficulty: metadata.difficulty,
            topic: metadata.topic,
            githubUrl: commit.url,
            userId: user.id,
          },
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await prisma.streak.upsert({
          where: {
            date_userId: {
              date: today,
              userId: user.id,
            },
          },
          update: {
            solvedCount: { increment: 1 },
          },
          create: {
            date: today,
            solvedCount: 1,
            userId: user.id,
          },
        });

        try {
          await appendToGoogleSheet(savedProblem);
        } catch (sheetError) {
          console.error("Google Sheets append error:", sheetError);
        }

        processed++;
      } catch (error) {
        console.error(`Error processing commit "${commit.message}":`, error);
      }
    }

    return NextResponse.json({ processed }, { status: 200 });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
