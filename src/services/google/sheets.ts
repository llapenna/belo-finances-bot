import { ExchangeDetails } from "@/types/exchange";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

export const api = (client: OAuth2Client, sheetId: string) => {
  const sheets = google.sheets({ version: "v4", auth: client });
  return {
    appendExchange: async (exchanges: ExchangeDetails[]) => {
      if (exchanges.length === 0) return;

      const sheet = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: "A1:A",
      });

      const lastRowNumber = sheet.data.values?.length ?? null;
      if (!lastRowNumber) throw new Error("No last row number found");

      let nextRowNumber = lastRowNumber + 1;

      const data = exchanges.map((exchange) => {
        const row = [
          exchange.date,
          exchange.fromAmount,
          exchange.fromCurrency,
          exchange.toAmount,
          `=SI(D${nextRowNumber}="";"";D${nextRowNumber}/B${nextRowNumber})`,
          `=SI(D${nextRowNumber}="";"";D${nextRowNumber}/B${nextRowNumber})`,
          `=SI(D${nextRowNumber}="";"";$K$1-SUMAPRODUCTO($D$3:D${nextRowNumber};MES($A$3:A${nextRowNumber})=MES(A${nextRowNumber}))`,
        ];
        nextRowNumber++;
        return row;
      });

      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: "A1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: data,
        },
      });

      const [day, month, year] = exchanges[0]!.date.split("/");
      const color =
        new Date(`${year}/${month}/${day}`).getMonth() % 2 === 0
          ? { red: 0.7137255, green: 0.84313726, blue: 0.65882355 }
          : { red: 0.8509803922, green: 0.9176470588, blue: 0.8274509804 };

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  startRowIndex: lastRowNumber,
                  endRowIndex: lastRowNumber + exchanges.length,
                  startColumnIndex: 0,
                  endColumnIndex: 7,
                },
                cell: {
                  userEnteredFormat: { backgroundColor: color },
                },
                fields: "userEnteredFormat.backgroundColor",
              },
            },
          ],
        },
      });
    },
    getSheet: async () => {
      const res = await sheets.spreadsheets.get({
        spreadsheetId: sheetId,
      });
      return res.data;
    },
    getLastRowNumber: async (): Promise<number | null> => {
      const valuesRes = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: "A1:A",
      });
      if (!valuesRes.data.values) return null;

      const lastRowIndex = valuesRes.data.values.length;

      return lastRowIndex;
    },
  };
};
