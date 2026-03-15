import crypto from "crypto";

export function verifyGitHubWebhook(
  payload: Buffer,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) return false;

  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(payload).digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

export interface GitHubPushEvent {
  ref: string;
  repository: {
    full_name: string;
  };
  sender: {
    login: string;
  };
  commits: Array<{
    id: string;
    message: string;
    url: string;
    added?: string[];
    removed?: string[];
    modified?: string[];
    author: {
      name: string;
      email: string;
      username: string;
    };
  }>;
}
