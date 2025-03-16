import * as logger from "@/utils/logger";
import { client, requestAuth, authenticate } from "@/services/google/auth";
import { api as gmailApi } from "@/services/google/gmail";
import { api as sheetsApi } from "@/services/google/sheets";
import { GOOGLE_SHEET_ID } from "@/utils/config";
import express from "express";
import { parseConversionMessage } from "@/utils/messageParser";
import { ExchangeDetails } from "@/types/exchange";

const app = express();

app.get("/authenticated", async (req, res) => {
  const { code } = req.query;

  if (!code || typeof code !== "string") {
    res.status(400).send("Missing authorization code");
    return;
  }

  try {
    await authenticate(code);

    res.send("Successfully authenticated! You can close this window.");
  } catch (err) {
    logger.error("Error getting tokens:", err);
    res.status(500).send("Failed to authenticate");
  }
});

app.get("/", async (_, res) => {
  const messages = await gmailApi(client).list();

  const exchanges = messages
    .map((message) => parseConversionMessage(message))
    .filter((exchange) => exchange !== null);

  try {
    await sheetsApi(client, GOOGLE_SHEET_ID).appendExchange(
      exchanges as ExchangeDetails[],
    );

    const messageIds = messages
      .map((msg) => msg.id)
      .filter(Boolean) as string[];

    await gmailApi(client).markAsRead(messageIds);
    res.json(exchanges);
  } catch (e) {
    logger.error("Error appending exchanges:", e);
  }
});

app.get("/sheets", async (_, res) => {
  const sheet = await sheetsApi(client, GOOGLE_SHEET_ID).getSheet();
  const lastRowNumber = await sheetsApi(
    client,
    GOOGLE_SHEET_ID,
  ).getLastRowNumber();
  res.json({ sheet, lastRowNumber });
});

app.listen(3000, () => {
  requestAuth();
  logger.info("Server is running on port 3000");
});
