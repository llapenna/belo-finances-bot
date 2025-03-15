import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

export const api = (client: OAuth2Client) => {
  const gmail = google.gmail({ version: "v1", auth: client });

  return {
    /**
     * List all unread emails from belo.app
     * @returns list of messages
     */
    list: async () => {
      const res = await gmail.users.messages.list({
        userId: "me",
        q: "from:transaction@belo.app AND label:Money/Exchange AND is:unread AND conversión",
      });

      if (!res.data.messages) return [];
      const messageIds = res.data.messages
        .map((message) => message.id)
        .filter(Boolean) as string[];

      const messages = await Promise.all(
        messageIds.map(async (id) => {
          return gmail.users.messages.get({
            userId: "me",
            id,
          });
        }),
      );

      return messages.map((message) => message.data);
    },
    markAsRead: async (messageIds: string[]) => {
      await gmail.users.messages.batchModify({
        userId: "me",
        requestBody: {
          ids: messageIds,
          removeLabelIds: ["UNREAD"],
        },
      });
    },
  };
};
