import { useState, useCallback, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  novaChatHistoryQueryKey,
  novaChatListQueryKey,
} from "@/features/nova/hooks/nova-chat-query-keys";

interface NovaMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: Array<{
    type: string;
    entryDate?: string;
    excerpt?: string;
    mood?: string;
  }>;
}

interface UseNovaChatOptions {
  chatId?: string;
  onError?: (error: Error) => void;
  onComplete?: () => void;
  onChatCreated?: (chatId: string) => void;
}

export const NOVA_HISTORY_STALE_TIME = 5 * 60 * 1000;
export const NOVA_HISTORY_CACHE_TIME = 30 * 60 * 1000;

type SerializedMessage =
  | {
      id: string;
      content: { type: "UserContent"; userMessage: { message: string } };
    }
  | {
      id: string;
      content: {
        type: "AgentContent";
        agentResponse: { response: string };
        sources?: NovaMessage["sources"];
      };
    };

export function useNovaChat(options: UseNovaChatOptions = {}) {
  const [messages, setMessages] = useState<NovaMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(
    options.chatId,
  );

  const queryClient = useQueryClient();
  const skipNextHistoryLoadRef = useRef(false);
  const pendingCreatedChatIdRef = useRef<string | null>(null);

  const { onError, onComplete, onChatCreated } = options;

  const sendMessage = useCallback(
    async (message: string, includeHistory = true) => {
      if (!message.trim() || isStreaming) return;

      const trimmed = message.trim();
      const userMessage: NovaMessage = {
        id: `${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);
      setCurrentResponse("");

      try {
        const response = await fetch("/api/nova/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: trimmed,
            chatId: currentChatId,
            includeHistory,
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error("Failed to start chat stream");
        }

        // Capture chat id from response header when a new chat is created
        const responseChatId = response.headers.get("x-nova-chat-id");
        if (responseChatId && responseChatId !== currentChatId) {
          setCurrentChatId(responseChatId);
          pendingCreatedChatIdRef.current = responseChatId;
          skipNextHistoryLoadRef.current = true;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = "";
        let streamedContent = "";
        let finalContent = "";
        let sources: NovaMessage["sources"] | undefined;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse complete NDJSON lines
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const event = JSON.parse(line) as
                | { type: "delta"; text: string }
                | { type: "done"; content: string; sources: NovaMessage["sources"] }
                | { type: "error"; message: string };

              if (event.type === "delta") {
                streamedContent += event.text;
                setCurrentResponse(streamedContent);
              } else if (event.type === "done") {
                finalContent = event.content;
                sources = event.sources;
              } else if (event.type === "error") {
                throw new Error(event.message);
              }
            } catch (e) {
              // Skip malformed lines but log for debugging
              if (e instanceof SyntaxError) {
                console.warn("Skipping malformed NDJSON line:", line);
              } else {
                throw e;
              }
            }
          }
        }

        // Use final content from done event, or fall back to streamed content
        const messageContent = finalContent || streamedContent.trim();

        if (messageContent) {
          const assistantMessage: NovaMessage = {
            id: `${Date.now()}-assistant`,
            role: "assistant",
            content: messageContent,
            timestamp: new Date(),
            sources,
          };

          setMessages((prev) => [...prev, assistantMessage]);
        }

        setCurrentResponse("");
        setIsStreaming(false);
        void queryClient.invalidateQueries({ queryKey: novaChatListQueryKey });
        onComplete?.();
      } catch (error) {
        console.error("Nova chat error:", error);
        const errorMsg =
          error instanceof Error ? error.message : "Failed to send message";
        toast.error(errorMsg);
        onError?.(error instanceof Error ? error : new Error(errorMsg));
        setIsStreaming(false);
      }
    },
    [currentChatId, isStreaming, onComplete, onError, queryClient],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentResponse("");

    if (currentChatId) {
      queryClient.setQueryData(novaChatHistoryQueryKey(currentChatId), []);
    }
  }, [currentChatId, queryClient]);

  const hydrateHistory = useCallback(
    async (chatId: string) => {
      if (skipNextHistoryLoadRef.current) {
        skipNextHistoryLoadRef.current = false;
        setIsLoadingHistory(false);
        return;
      }

      const cachedHistory = queryClient.getQueryData<NovaMessage[]>(
        novaChatHistoryQueryKey(chatId),
      );
      if (cachedHistory) {
        setMessages(cachedHistory);
        setIsLoadingHistory(false);
        return;
      }

      setIsLoadingHistory(true);
      try {
        const history = await queryClient.fetchQuery({
          queryKey: novaChatHistoryQueryKey(chatId),
          queryFn: () => fetchChatHistory(chatId),
          staleTime: NOVA_HISTORY_STALE_TIME,
          gcTime: NOVA_HISTORY_CACHE_TIME,
        });

        setMessages(history);
      } catch (error) {
        console.error("Failed to load chat history:", error);
        toast.error("Failed to load chat history");
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [queryClient],
  );

  // Load history when chatId changes
  useEffect(() => {
    if (currentChatId) {
      void hydrateHistory(currentChatId);
    } else {
      setMessages([]);
      setCurrentResponse("");
      setIsLoadingHistory(false);
    }
  }, [currentChatId, hydrateHistory]);

  // Notify when a new chat id is created
  useEffect(() => {
    if (
      pendingCreatedChatIdRef.current &&
      currentChatId === pendingCreatedChatIdRef.current
    ) {
      const createdId = pendingCreatedChatIdRef.current;
      pendingCreatedChatIdRef.current = null;
      onChatCreated?.(createdId);
    }
  }, [currentChatId, onChatCreated]);

  // Keep cache in sync
  useEffect(() => {
    if (!currentChatId) return;
    queryClient.setQueryData<NovaMessage[]>(
      novaChatHistoryQueryKey(currentChatId),
      messages,
    );
  }, [currentChatId, messages, queryClient]);

  // Sync external chatId prop
  useEffect(() => {
    setCurrentChatId(options.chatId);
  }, [options.chatId]);

  return {
    messages,
    sendMessage,
    isStreaming,
    currentResponse,
    clearMessages,
    isLoadingHistory,
    currentChatId,
    setCurrentChatId,
  };
}

function transformMessages(serialized: SerializedMessage[]): NovaMessage[] {
  return serialized.reduce<NovaMessage[]>((acc, msg) => {
    if (msg.content.type === "UserContent") {
      acc.push({
        id: msg.id,
        role: "user",
        content: msg.content.userMessage.message,
        timestamp: new Date(),
      });
    } else if (msg.content.type === "AgentContent") {
      acc.push({
        id: msg.id,
        role: "assistant",
        content: msg.content.agentResponse.response,
        timestamp: new Date(),
        sources: msg.content.sources,
      });
    }

    return acc;
  }, []);
}

export async function fetchChatHistory(
  chatId: string,
): Promise<NovaMessage[]> {
  const response = await fetch(`/api/nova/chats/${chatId}`);

  if (!response.ok) {
    throw new Error("Failed to load chat history");
  }

  const data = await response.json();
  const serializedMessages = (data.messages ?? []) as SerializedMessage[];
  return transformMessages(serializedMessages);
}
