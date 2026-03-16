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
  return process.env.GOOGLE_SHEETS_RANGE || "Sheet1!A:G";
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

  return `${firstTitle}!A:G`;
}

function problemToRow(problem: ProblemForSheet): string[] {
  return [
    problem.title,
    `https://leetcode.com/problems/${problem.slug}`,
    problem.topic,
    "", // Idea (blank — user fills manually)
    "", // What I did wrong (blank — user fills manually)
    "Solved (No help)",
    "No",
  ];
}

async function getSheetGridId(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
): Promise<{ gridId: number; title: string }> {
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties",
  });
  const props = meta.data.sheets?.[0]?.properties;
  return { gridId: props?.sheetId ?? 0, title: props?.title ?? "Sheet1" };
}

async function applyTemplateFormatting(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  startRow: number,
  endRow: number,
  numColumns: number,
): Promise<void> {
  const { gridId, title } = await getSheetGridId(sheets, spreadsheetId);

  // Read row 2's full formatting + data validation
  const detail = await sheets.spreadsheets.get({
    spreadsheetId,
    ranges: [`${title}!A2:G2`],
    fields:
      "sheets.data.rowData.values(userEnteredFormat,dataValidation)",
  });

  const templateCells =
    detail.data.sheets?.[0]?.data?.[0]?.rowData?.[0]?.values;
  if (!templateCells || templateCells.length === 0) return;

  // Build one repeatCell request per column so each column's formatting
  // is applied across all new rows at once.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requests: any[] = [];

  for (let col = 0; col < Math.min(templateCells.length, numColumns); col++) {
    const cell = templateCells[col];
    if (!cell) continue;

    const fieldParts: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cellData: any = {};

    if (cell.userEnteredFormat) {
      cellData.userEnteredFormat = cell.userEnteredFormat;
      fieldParts.push("userEnteredFormat");
    }
    if (cell.dataValidation) {
      cellData.dataValidation = cell.dataValidation;
      fieldParts.push("dataValidation");
    }

    if (fieldParts.length === 0) continue;

    requests.push({
      repeatCell: {
        range: {
          sheetId: gridId,
          startRowIndex: startRow,
          endRowIndex: endRow,
          startColumnIndex: col,
          endColumnIndex: col + 1,
        },
        cell: cellData,
        fields: fieldParts.join(","),
      },
    });
  }

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });
  }
}

async function appendRows(
  sheets: ReturnType<typeof google.sheets>,
  sheetId: string,
  rows: string[][],
): Promise<void> {
  const preferredRange = getSheetRange();

  // Get current row count so we know where new rows start
  let existingRowCount = 0;
  try {
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: preferredRange,
    });
    existingRowCount = existing.data.values?.length ?? 0;
  } catch {
    // If we can't read, skip formatting later
  }

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: preferredRange,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: rows },
    });
  } catch (error) {
    const fallbackRange = await getFallbackRange(sheets, sheetId);
    if (fallbackRange === preferredRange) throw error;

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: fallbackRange,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: rows },
    });
  }

  // Apply formatting from row 2 (template row) to new rows
  if (existingRowCount >= 2) {
    try {
      await applyTemplateFormatting(
        sheets,
        sheetId,
        existingRowCount, // first new row
        existingRowCount + rows.length, // end (exclusive)
        7, // columns A–G
      );
    } catch {
      // Formatting is best-effort — don't fail the append
    }
  }
}

async function readExistingSlugs(
  sheets: ReturnType<typeof google.sheets>,
  sheetId: string,
): Promise<Set<string>> {
  const preferredRange = getSheetRange();
  const slugs = new Set<string>();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: preferredRange,
    });

    const rows = response.data.values;
    if (!rows) return slugs;

    // Column B has the LeetCode URL — extract the slug from it
    for (const row of rows) {
      const url = row[1];
      if (typeof url !== "string") continue;
      const match = url.match(/leetcode\.com\/problems\/([a-z0-9-]+)/);
      if (match?.[1]) slugs.add(match[1]);
    }
  } catch {
    // If we can't read the sheet, return empty set so all problems get synced
  }

  return slugs;
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

  await appendRows(sheets, sheetId, [problemToRow(problem)]);
}

export async function syncAllToGoogleSheet(
  problems: ProblemForSheet[],
): Promise<{ synced: number; alreadyInSheet: number }> {
  const sheetId = process.env.GOOGLE_SHEETS_ID;
  if (!sheetId) {
    throw new Error("GOOGLE_SHEETS_ID not configured");
  }

  const authClient = getAuthClient();
  const sheets = google.sheets({ version: "v4", auth: authClient });

  const existingSlugs = await readExistingSlugs(sheets, sheetId);

  const newProblems = problems.filter((p) => !existingSlugs.has(p.slug));

  if (newProblems.length === 0) {
    return { synced: 0, alreadyInSheet: existingSlugs.size };
  }

  const rows = newProblems.map(problemToRow);
  await appendRows(sheets, sheetId, rows);

  return { synced: newProblems.length, alreadyInSheet: existingSlugs.size };
}
