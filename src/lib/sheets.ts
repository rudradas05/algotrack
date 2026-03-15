import { google } from "googleapis";

interface ProblemForSheet {
  title: string;
  slug: string;
  topic: string;
  difficulty: string;
}

function parsePrivateKey(raw: string): string {
  // Vercel stores env vars differently depending on how the key was pasted.
  // Handle all known formats:
  //   1. Literal \n text (most common in Vercel)  → real newlines
  //   2. Double-escaped \\n                        → real newlines
  //   3. Already has real newlines                 → leave as-is
  //   4. Wrapped in extra quotes by Vercel panel   → strip them
  let key = raw;

  // Strip surrounding quotes if Vercel added them
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1);
  }

  // Replace escaped newline variants with real newlines
  key = key.replace(/\\\\n/g, "\n").replace(/\\n/g, "\n");

  // Guard: if still no newlines at all, manually break at PEM boundaries
  if (!key.includes("\n")) {
    key = key
      .replace("-----BEGIN PRIVATE KEY-----", "-----BEGIN PRIVATE KEY-----\n")
      .replace("-----END PRIVATE KEY-----", "\n-----END PRIVATE KEY-----")
      .replace(
        "-----BEGIN RSA PRIVATE KEY-----",
        "-----BEGIN RSA PRIVATE KEY-----\n",
      )
      .replace(
        "-----END RSA PRIVATE KEY-----",
        "\n-----END RSA PRIVATE KEY-----",
      );
  }

  return key.trim();
}

function getAuthClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const raw = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !raw) {
    throw new Error("Google Sheets credentials not configured");
  }

  const key = parsePrivateKey(raw);

  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheetRange(): string {
  return process.env.GOOGLE_SHEETS_RANGE || "Sheet1!A:H";
}

async function getFallbackRange(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
): Promise<string> {
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties.title",
  });

  const firstTitle = meta.data.sheets?.[0]?.properties?.title;
  if (!firstTitle) {
    throw new Error("Unable to determine a worksheet tab name");
  }

  return `${firstTitle}!A:H`;
}

export async function appendToGoogleSheet(
  problem: ProblemForSheet,
): Promise<void> {
  const sheetId = process.env.GOOGLE_SHEETS_ID;
  if (!sheetId) {
    throw new Error("GOOGLE_SHEETS_ID not configured");
  }

  const authClient = getAuthClient();
  const sheets = google.sheets({ version: "v4", auth: authClient });
  const preferredRange = getSheetRange();

  const row = [
    problem.title,
    `https://leetcode.com/problems/${problem.slug}`,
    problem.topic,
    problem.difficulty,
    "", // Idea (blank — user fills manually)
    "", // What I did wrong (blank — user fills manually)
    "Solved (No help)",
    "No",
  ];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: preferredRange,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });
  } catch (error) {
    // Try falling back to the first tab's actual name
    const fallbackRange = await getFallbackRange(sheets, sheetId);
    if (fallbackRange === preferredRange) throw error;

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: fallbackRange,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });
  }
}
