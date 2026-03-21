import { NextRequest, NextResponse } from "next/server";
import { verifyGitHubWebhook, GitHubPushEvent } from "@/lib/github";
import { fetchLeetCodeMetadata } from "@/lib/leetcode";
import { appendToGoogleSheet } from "@/lib/sheets";
import { prisma } from "@/lib/prisma";

const LEETCODE_COMMIT_MESSAGE_PATTERNS = [
  /^Add solution:\s*\d+\.\s*(.+)$/i,
  /(?:leetcode\.com\/problems\/)([a-z0-9-]+)(?:\/|\b)/i,
  /^(?:add|added|solve|solved)[:\s-]+(?:\d+\.\s*)?(.+)$/i,
];

const GFG_URL_PATTERN =
  /(?:https?:\/\/)?(?:www\.)?geeksforgeeks\.org\/(problems\/[a-z0-9-]+\/\d+|dsa\/[a-z0-9-]+)/i;

type ProblemCandidate =
  | { platform: "LeetCode"; slug: string }
  | { platform: "GFG"; slug: string };

interface WebhookProblemMetadata {
  title: string;
  slug: string;
  difficulty: string;
  topic: string;
  platform: "LeetCode" | "GFG";
}

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

function extractGfgPathFromText(value: string): string | null {
  const match = value.toLowerCase().match(GFG_URL_PATTERN);
  return match?.[1]?.replace(/\/+$/, "") ?? null;
}

function extractGfgPathFromFilePath(path: string): string | null {
  const normalized = path.toLowerCase();

  const extracted = extractGfgPathFromText(normalized);
  if (extracted) return extracted;

  if (!normalized.includes("gfg") && !normalized.includes("geeksforgeeks")) {
    return null;
  }

  const fileName = normalized.split("/").pop() ?? "";
  const cleaned = fileName
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/^\d+[-_]+/, "")
    .replace(/_/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!cleaned) {
    return null;
  }

  return `problems/${cleaned}/1`;
}

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildGfgMetadata(slugPath: string): WebhookProblemMetadata {
  const parts = slugPath.split("/").filter(Boolean);
  const titleSlug =
    parts[0] === "problems" && parts.length >= 2
      ? parts[1]
      : (parts[parts.length - 1] ?? "problem");

  return {
    title: slugToTitle(titleSlug),
    slug: slugPath,
    difficulty: "Unknown",
    topic: "GFG",
    platform: "GFG",
  };
}

function extractProblemCandidates(
  commit: GitHubPushEvent["commits"][number],
): ProblemCandidate[] {
  const candidates: ProblemCandidate[] = [];
  const seen = new Set<string>();

  const addCandidate = (candidate: ProblemCandidate) => {
    const key = `${candidate.platform}:${candidate.slug}`;
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(candidate);
  };

  for (const pattern of LEETCODE_COMMIT_MESSAGE_PATTERNS) {
    const match = commit.message.match(pattern);
    if (!match?.[1]) continue;

    const raw = match[1].trim();
    const normalized = titleToSlug(raw);
    if (normalized) addCandidate({ platform: "LeetCode", slug: normalized });
  }

  const gfgPathFromMessage = extractGfgPathFromText(commit.message);
  if (gfgPathFromMessage) {
    addCandidate({ platform: "GFG", slug: gfgPathFromMessage });
  }

  const changedFiles = [
    ...(commit.added ?? []),
    ...(commit.modified ?? []),
    ...(commit.removed ?? []),
  ];

  for (const filePath of changedFiles) {
    const fromPath = extractSlugFromPath(filePath);
    if (fromPath) addCandidate({ platform: "LeetCode", slug: fromPath });

    const gfgPath = extractGfgPathFromFilePath(filePath);
    if (gfgPath) addCandidate({ platform: "GFG", slug: gfgPath });
  }

  return candidates;
}

function extractGitHubNoreplyUsername(email?: string): string | null {
  if (!email) return null;

  const match = email
    .toLowerCase()
    .match(/^(?:\d+\+)?([a-z0-9-]+)@users\.noreply\.github\.com$/);

  return match?.[1] ?? null;
}

function normalizeGitHubHandle(value?: string | null): string | null {
  if (!value) return null;

  const normalized = value.trim().toLowerCase().replace(/^@/, "");
  return normalized || null;
}

function parseCommaSeparatedList(value?: string): string[] {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function shouldProcessRepository(event: GitHubPushEvent): boolean {
  const allowedFullNames = parseCommaSeparatedList(
    process.env.GITHUB_WEBHOOK_ALLOWED_REPOS,
  );

  if (allowedFullNames.length === 0) {
    return true;
  }

  return allowedFullNames.includes(event.repository.full_name.toLowerCase());
}

function collectEventAuthorEmails(event: GitHubPushEvent): string[] {
  const emails = new Set<string>();

  for (const commit of event.commits) {
    const email = commit.author?.email?.toLowerCase();
    if (email) emails.add(email);
  }

  return Array.from(emails);
}

function collectEventAuthorUsernames(event: GitHubPushEvent): string[] {
  const usernames = new Set<string>();

  for (const commit of event.commits) {
    const username = normalizeGitHubHandle(commit.author?.username);
    if (username) usernames.add(username);

    const fromNoreply = extractGitHubNoreplyUsername(commit.author?.email);
    if (fromNoreply) usernames.add(fromNoreply);
  }

  return Array.from(usernames);
}

async function resolveUserForEvent(event: GitHubPushEvent) {
  const senderLogin = normalizeGitHubHandle(event.sender.login);
  const senderId = String(event.sender.id);

  const senderIdAccountUser = await prisma.user.findFirst({
    where: {
      accounts: {
        some: {
          provider: "github",
          providerAccountId: senderId,
        },
      },
    },
  });
  if (senderIdAccountUser) return senderIdAccountUser;

  if (senderLogin) {
    const senderLoginAccountUser = await prisma.user.findFirst({
      where: {
        accounts: {
          some: {
            provider: "github",
            providerAccountId: senderLogin,
          },
        },
      },
    });
    if (senderLoginAccountUser) return senderLoginAccountUser;
  }

  if (senderLogin) {
    const usernameMatch = await prisma.user.findUnique({
      where: { username: senderLogin },
    });
    if (usernameMatch) return usernameMatch;
  }

  const authorEmails = collectEventAuthorEmails(event);
  for (const authorEmail of authorEmails) {
    const emailMatch = await prisma.user.findUnique({
      where: { email: authorEmail },
    });
    if (emailMatch) return emailMatch;
  }

  const authorUsernames = collectEventAuthorUsernames(event);
  for (const authorUsername of authorUsernames) {
    const authorUsernameMatch = await prisma.user.findUnique({
      where: { username: authorUsername },
    });
    if (authorUsernameMatch) return authorUsernameMatch;
  }

  const preferredAppUsername = normalizeGitHubHandle(
    process.env.WEBHOOK_TARGET_APP_USERNAME,
  );
  if (preferredAppUsername) {
    const appUser = await prisma.user.findUnique({
      where: { username: preferredAppUsername },
    });
    if (appUser) return appUser;
  }

  const preferredAppEmail =
    process.env.WEBHOOK_TARGET_APP_EMAIL?.trim().toLowerCase();
  if (preferredAppEmail) {
    const emailUser = await prisma.user.findUnique({
      where: { email: preferredAppEmail },
    });
    if (emailUser) return emailUser;
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
    const eventName = request.headers.get("x-github-event")?.toLowerCase();
    if (eventName !== "push") {
      return NextResponse.json(
        {
          ignored: true,
          reason: `Unsupported GitHub event: ${eventName ?? "unknown"}`,
        },
        { status: 200 },
      );
    }

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
    if (!shouldProcessRepository(event)) {
      return NextResponse.json(
        {
          ignored: true,
          reason: `Repository ${event.repository.full_name} is not in GITHUB_WEBHOOK_ALLOWED_REPOS`,
        },
        { status: 200 },
      );
    }

    if (!Array.isArray(event.commits) || event.commits.length === 0) {
      return NextResponse.json(
        { processed: 0, ignored: true, reason: "No commits in payload" },
        { status: 200 },
      );
    }

    let processed = 0;
    const user = await resolveUserForEvent(event);

    if (!user) {
      console.warn(
        `No user mapping for sender ${event.sender.login} (${event.sender.id}) from ${event.repository.full_name}`,
      );
      return NextResponse.json(
        {
          processed: 0,
          ignored: true,
          reason: "No matching user for webhook event",
        },
        { status: 200 },
      );
    }

    for (const commit of event.commits) {
      const candidates = extractProblemCandidates(commit);
      if (candidates.length === 0) continue;

      try {
        let metadata: WebhookProblemMetadata | null = null;
        for (const candidate of candidates) {
          if (candidate.platform === "LeetCode") {
            try {
              const lcMetadata = await fetchLeetCodeMetadata(candidate.slug);
              metadata = { ...lcMetadata, platform: "LeetCode" };
              break;
            } catch {
              // Try the next candidate extracted from commit/path.
            }
            continue;
          }

          metadata = buildGfgMetadata(candidate.slug);
          break;
        }

        if (!metadata) continue;

        // Check if the problem already exists to avoid duplicate sheet rows
        const existingProblem = await prisma.problem.findUnique({
          where: {
            slug_userId: {
              slug: metadata.slug,
              userId: user.id,
            },
          },
        });

        const isNewProblem = !existingProblem;

        const savedProblem = await prisma.problem.upsert({
          where: {
            slug_userId: {
              slug: metadata.slug,
              userId: user.id,
            },
          },
          update: {
            title: metadata.title,
            platform: metadata.platform,
            difficulty: metadata.difficulty,
            topic: metadata.topic,
            githubUrl: commit.url,
            solvedAt: new Date(),
          },
          create: {
            title: metadata.title,
            slug: metadata.slug,
            platform: metadata.platform,
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

        // Only append to Google Sheet for newly created problems
        if (isNewProblem) {
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
