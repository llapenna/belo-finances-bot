import { google } from "googleapis";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "@/utils/config";
import { info, error } from "@/utils/logger";
import { Credentials } from "google-auth-library";

import fs from "fs/promises";
import path from "path";

import QRCode from "qrcode";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
];

export const client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  "http://localhost:3000/authenticated",
);

const refreshTokens = async (tokens: Credentials) => {
  client.setCredentials(tokens);
  const { credentials } = await client.refreshAccessToken();

  // Store refreshed tokens
  const tokenPath = path.join(process.cwd(), "google-tokens.json");
  await fs.writeFile(tokenPath, JSON.stringify(credentials));
  info("Refreshed expired credentials");
  return credentials;
};

export const requestAuth = async () => {
  const tokenPath = path.join(process.cwd(), "google-tokens.json");

  try {
    const tokens: Credentials = JSON.parse(
      await fs.readFile(tokenPath, "utf-8"),
    );

    // Check if access token has expired
    const expiryDate = tokens.expiry_date;
    const hasExpired = expiryDate ? Date.now() >= expiryDate : true;

    if (hasExpired) {
      // Token has expired, try to refresh
      if (tokens.refresh_token) {
        const newTokens = await refreshTokens(tokens);
        client.setCredentials(newTokens);
        return;
      }
      throw new Error("Tokens expired and no refresh token available");
    }

    // Token still valid
    client.setCredentials(tokens);
    info("Loaded existing valid credentials - no need to authenticate");
    return;
  } catch (err) {
    // If file doesn't exist, tokens invalid/expired, or refresh failed - proceed with new auth flow
    const url = client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent",
      include_granted_scopes: true,
    });

    info(url);
    QRCode.toString(url, { type: "terminal", small: true })
      .then(console.log)
      .catch(error);
  }
};

export const authenticate = async (code: string) => {
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  // Store tokens in a local file
  const tokenPath = path.join(process.cwd(), "google-tokens.json");

  try {
    await fs.writeFile(tokenPath, JSON.stringify(tokens));
    info("Tokens stored to", tokenPath);
  } catch (err) {
    error("Failed to store tokens:", err);
  }
};
