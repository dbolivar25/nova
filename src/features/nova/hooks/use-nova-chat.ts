import { useState, useCallback, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  novaChatHistoryQueryKey,
  novaChatListQueryKey,
} from "@/features/nova/hooks/nova-chat-query-keys";
import { parseNovaStream, type NovaSource } from "@/features/nova/core/nova-stream";

interface NovaMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: NovaSource[];
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
  | { id: string; content: { type: "UserContent"; userMessage: { message: string } } }
  | { id: string; content: { type: "AgentContent"; agentResponse: { response: string }; sources?: NovaSource[] } };

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
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}`, role: "user", content: trimmed, timestamp: new Date() },
      ]);
      setIsStreaming(true);
      setCurrentResponse("");

      try {
        const response = await fetch("/api/nova/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, chatId: currentChatId, includeHistory }),
        });

        if (!response.ok || !response.body) {
          throw new Error("Failed to start chat stream");
        }

        // Handle new chat creation
        const responseChatId = response.headers.get("x-nova-chat-id");
        if (responseChatId && responseChatId !== currentChatId) {
          setCurrentChatId(responseChatId);
          pendingCreatedChatIdRef.current = responseChatId;
          skipNextHistoryLoadRef.current = true;
        }

        // Parse the stream
        const result = await parseNovaStream(
          response.body.getReader(),
          setCurrentResponse
        );

        if (result.content) {
          setMessages((prev) => [
            ...prev,
            {
              id: `${Date.now()}-assistant`,
              role: "assistant",
              content: result.content,
              timestamp: new Date(),
              sources: result.sources,
            },
          ]);
        }

        setCurrentResponse("");
        void queryClient.invalidateQueries({ queryKey: novaChatListQueryKey });
        onComplete?.();
      } catch (error) {
        console.error("Nova chat error:", error);
        const errorMsg = error instanceof Error ? error.message : "Failed to send message";
        toast.error(errorMsg);
        onError?.(error instanceof Error ? error : new Error(errorMsg));
      } finally {
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
