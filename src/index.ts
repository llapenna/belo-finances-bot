import * as logger from "@/utils/logger";
import { client, requestAuth, authenticate } from "@/services/google/auth";
import { api as gmailApi } from "@/services/google/gmail";
import { api as sheetsApi } from "@/services/google/sheets";
import { GOOGLE_SHEET_ID } from "@/utils/config";
import express from "express";
import { parseConversionMessage } from "@/utils/messageParser";

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

  const exchanges = messages.map((message) => parseConversionMessage(message));

  for (const exchange of exchanges) {
    if (!exchange) continue;
    logger.info("Appending exchange:", exchange);
    await sheetsApi(client, GOOGLE_SHEET_ID).appendExchange(exchange);
  }

  res.json(exchanges);
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
