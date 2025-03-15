import { ExchangeDetails } from "@/types/exchange";
import { gmail_v1 } from "googleapis";
export function parseConversionMessage(
  email: gmail_v1.Schema$Message,
): ExchangeDetails | null {
  const message = email.snippet;
  const date = email.internalDate;

  if (!message || !date) return null;

  // Match pattern: number[,number] CURRENCY por $number
  const regex = /(\d+(?:[.,]\d+)?)\s+(\w+)\s+por\s+\$([0-9.,]+)/;
  const match = message.match(regex);

  if (!match || !match[1] || !match[2] || !match[3]) {
    return null;
  }

  // Convert string numbers to actual numbers, handling . as thousands separator and , as decimal
  const parseAmount = (amount: string): number => {
    // First remove all thousands separators (.)
    const withoutThousands = amount.replace(/\./g, "");
    // Then convert decimal separator (,) to . for parseFloat
    const normalized = withoutThousands.replace(",", ".");
    return parseFloat(normalized);
  };

  return {
    fromAmount: parseAmount(match[1]), // "40" or "9,04" -> 40 or 9.04
    fromCurrency: match[2], // "USDT"
    toAmount: parseAmount(match[3]), // "46.519,99" -> 46519.99
    date: new Date(Number(date)).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
  };
}
