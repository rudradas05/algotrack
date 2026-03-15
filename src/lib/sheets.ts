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

export async function appendToGoogleSheet(
  problem: ProblemForSheet,
): Promise<void> {
  const sheetId = process.env.GOOGLE_SHEETS_ID;
  if (!sheetId) {
    throw new Error("GOOGLE_SHEETS_ID not configured");
  }

  const authClient = getAuthClient();
  const sheets = google.sheets({ version: "v4", auth: authClient });

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

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "Sheet1!A:H",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [row],
    },
  });
}
