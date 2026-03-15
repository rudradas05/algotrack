import { NextRequest, NextResponse } from "next/server";
import { verifyGitHubWebhook, GitHubPushEvent } from "@/lib/github";
import { fetchLeetCodeMetadata } from "@/lib/leetcode";
import { appendToGoogleSheet } from "@/lib/sheets";
import { prisma } from "@/lib/prisma";

const COMMIT_MESSAGE_PATTERNS = [
  /^Add solution:\s*\d+\.\s*(.+)$/i,
  /(?:leetcode\.com\/problems\/)([a-z0-9-]+)(?:\/|\b)/i,
  /^(?:add|added|solve|solved)[:\s-]+(?:\d+\.\s*)?(.+)$/i,
];

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function extractSlugFromPath(path: string): string | null {
  const normalized = path.toLowerCase();
  const pieces = normalized.split("/").filter(Boolean);

  for (const piece of pieces) {
    const cleaned = piece.replace(/\.[a-z0-9]+$/i, "");
    const maybeSlug = cleaned
      .replace(/^\d+[-_]+/, "")
      .replace(/_/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    if (maybeSlug.includes("-") && maybeSlug.length >= 3) {
      return maybeSlug;
    }
  }

  return null;
}

function extractSlugCandidates(
  commit: GitHubPushEvent["commits"][number],
): string[] {
  const candidates = new Set<string>();

  for (const pattern of COMMIT_MESSAGE_PATTERNS) {
    const match = commit.message.match(pattern);
    if (!match?.[1]) continue;

    const raw = match[1].trim();
    const normalized = titleToSlug(raw);
    if (normalized) candidates.add(normalized);
  }

  const changedFiles = [
    ...(commit.added ?? []),
    ...(commit.modified ?? []),
    ...(commit.removed ?? []),
  ];

  for (const filePath of changedFiles) {
    const fromPath = extractSlugFromPath(filePath);
    if (fromPath) candidates.add(fromPath);
  }

  return Array.from(candidates);
}

function extractGitHubNoreplyUsername(email?: string): string | null {
  if (!email) return null;

  const match = email
    .toLowerCase()
    .match(/^(?:\d+\+)?([a-z0-9-]+)@users\.noreply\.github\.com$/);

  return match?.[1] ?? null;
}

async function resolveUserForEvent(event: GitHubPushEvent) {
  const senderLogin = event.sender.login.toLowerCase();

  const linkedAccountUser = await prisma.user.findFirst({
    where: {
      accounts: {
        some: {
          provider: "github",
          providerAccountId: senderLogin,
        },
      },
    },
  });
  if (linkedAccountUser) return linkedAccountUser;

  const usernameMatch = await prisma.user.findUnique({
    where: { username: senderLogin },
  });
  if (usernameMatch) return usernameMatch;

  const authorEmail = event.commits[0]?.author?.email;
  if (authorEmail) {
    const emailMatch = await prisma.user.findUnique({
      where: { email: authorEmail.toLowerCase() },
    });
    if (emailMatch) return emailMatch;
  }

  const noreplyUser = extractGitHubNoreplyUsername(authorEmail);
  if (noreplyUser) {
    const noreplyUsernameMatch = await prisma.user.findUnique({
      where: { username: noreplyUser },
    });
    if (noreplyUsernameMatch) return noreplyUsernameMatch;
  }

  const userCount = await prisma.user.count();
  if (userCount === 1) {
    console.warn(
      `Webhook fallback: mapping sender ${event.sender.login} to the only user in DB`,
    );
    return prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  }

  return null;
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
    const user = await resolveUserForEvent(event);

    if (!user) {
      console.warn(
        `No user mapping for sender ${event.sender.login} from ${event.repository.full_name}`,
      );
      return NextResponse.json({ processed: 0 }, { status: 200 });
    }

    for (const commit of event.commits) {
      const slugCandidates = extractSlugCandidates(commit);
      if (slugCandidates.length === 0) continue;

      try {
        let metadata = null;
        for (const slug of slugCandidates) {
          try {
            metadata = await fetchLeetCodeMetadata(slug);
            break;
          } catch {
            // Try next candidate extracted from commit/path.
          }
        }

        if (!metadata) continue;

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
          const message =
            sheetError instanceof Error
              ? sheetError.message
              : String(sheetError);
          console.error(
            `Google Sheets append error for slug ${savedProblem.slug} (user ${user.id}): ${message}`,
          );
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
