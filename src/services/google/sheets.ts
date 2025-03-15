import { ExchangeDetails } from "@/types/exchange";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

export const api = (client: OAuth2Client, sheetId: string) => {
  const sheets = google.sheets({ version: "v4", auth: client });
  return {
    appendExchange: async (exchange: ExchangeDetails) => {
      const sheet = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: "A1:A",
      });

      const lastRowNumber = sheet.data.values?.length ?? null;
      if (!lastRowNumber) throw new Error("No last row number found");

      const nextRowNumber = lastRowNumber + 1;

      const data = [
        exchange.date,
        exchange.fromAmount,
        exchange.fromCurrency,
        exchange.toAmount,
        `=SI(D${nextRowNumber}="";"";D${nextRowNumber}/B${nextRowNumber})`,
        `=SI(D${nextRowNumber}="";"";D${nextRowNumber}/B${nextRowNumber})`,
        `=SI(D${nextRowNumber}="";"";$K$1-SUMAPRODUCTO($D$3:D${nextRowNumber};MES($A$3:A${nextRowNumber})=MES(A${nextRowNumber}))`,
      ];

      const res = await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: "A1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [data],
        },
      });

      return res.data;
    },
    getSheet: async () => {
      const res = await sheets.spreadsheets.get({
        spreadsheetId: sheetId,
      });
      return res.data;
    },
    getLastRowNumber: async (): Promise<number | null> => {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: "A1:A",
      });
      return res.data.values?.length ?? null;
    },
  };
};
