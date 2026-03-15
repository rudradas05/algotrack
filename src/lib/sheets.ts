import { google } from "googleapis";

interface ProblemForSheet {
  title: string;
  slug: string;
  topic: string;
  difficulty: string;
}

function getAuthClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !key) {
    throw new Error("Google Sheets credentials not configured");
  }

  return new google.auth.JWT({
    email,
    key: key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheetRange(): string {
  // Allow overriding tab/range in production without code changes.
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
    "", // Idea (blank)
    "", // What I did wrong (blank)
    "Solved (No help)",
    "No",
  ];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: preferredRange,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [row],
      },
    });
  } catch (error) {
    const fallbackRange = await getFallbackRange(sheets, sheetId);
    if (fallbackRange === preferredRange) {
      throw error;
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: fallbackRange,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [row],
      },
    });
  }
}
