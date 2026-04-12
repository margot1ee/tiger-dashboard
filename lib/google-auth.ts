import { google } from "googleapis";
import fs from "fs";
import path from "path";

export function getGoogleAuth() {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  let key: Record<string, string>;

  if (keyPath) {
    const resolved = path.resolve(keyPath);
    const raw = fs.readFileSync(resolved, "utf-8");
    key = JSON.parse(raw);
  } else {
    const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!keyJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_SERVICE_ACCOUNT_KEY_PATH not set");
    key = JSON.parse(keyJson);
  }

  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: [
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/webmasters.readonly",
      "https://www.googleapis.com/auth/spreadsheets.readonly",
    ],
  });
}
