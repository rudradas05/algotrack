export type SupportedPlatform = "LeetCode" | "GFG";

function normalizeGfgPath(slug: string): string {
  const cleaned = slug
    .trim()
    .replace(/^https?:\/\/(?:www\.)?geeksforgeeks\.org\//i, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

  if (cleaned.startsWith("problems/") || cleaned.startsWith("dsa/")) {
    return cleaned;
  }

  return `problems/${cleaned}/1`;
}

export function getProblemUrl(platform: string, slug: string): string {
  if (platform === "GFG") {
    return `https://www.geeksforgeeks.org/${normalizeGfgPath(slug)}/`;
  }

  const normalizedSlug = slug.trim().replace(/^\/+|\/+$/g, "");
  return `https://leetcode.com/problems/${normalizedSlug}`;
}

export function getProblemKey(platform: string, slug: string): string {
  return `${platform.toLowerCase()}:${slug.toLowerCase()}`;
}

export function getProblemKeyFromUrl(url: string): string | null {
  const lcMatch = url
    .toLowerCase()
    .match(/leetcode\.com\/problems\/([a-z0-9-]+)/);
  if (lcMatch?.[1]) {
    return getProblemKey("LeetCode", lcMatch[1]);
  }

  const gfgMatch = url
    .toLowerCase()
    .match(/geeksforgeeks\.org\/(problems\/[a-z0-9-]+\/\d+|dsa\/[a-z0-9-]+)/);
  if (gfgMatch?.[1]) {
    return getProblemKey("GFG", gfgMatch[1].replace(/\/+$/, ""));
  }

  return null;
}
