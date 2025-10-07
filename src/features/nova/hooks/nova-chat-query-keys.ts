export const novaChatListQueryKey = ["nova", "chats"] as const;

export const novaChatHistoryQueryKey = (chatId: string) =>
  ["nova", "chat", chatId] as const;
