/**
 * Nova Chat Hook
 *
 * React hook for streaming chat with Nova via Server-Sent Events
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { novaChatHistoryQueryKey, novaChatListQueryKey } from '@/features/nova/hooks/nova-chat-query-keys';

interface NovaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{
    type: string;
    entryDate: string;
    excerpt: string;
  }>;
}

interface UseNovaChatOptions {
  chatId?: string;
  onError?: (error: Error) => void;
  onComplete?: () => void;
  onChatCreated?: (chatId: string) => void;
}

interface SSEEventData {
  streamId?: string;
  chatId?: string;
  delta?: string;
  source?: {
    type: string;
    entryDate: string;
    excerpt: string;
    mood?: string;
  };
  message?: {
    content?: {
      agentResponse?: {
        response?: string;
      };
      sources?: Array<{
        type: string;
        entryDate: string;
        excerpt: string;
        mood?: string;
      }>;
    };
  } | string;
  code?: string;
}

export const NOVA_HISTORY_STALE_TIME = 5 * 60 * 1000;
export const NOVA_HISTORY_CACHE_TIME = 30 * 60 * 1000;

type SerializedMessage =
  | {
      id: string;
      content: { type: 'UserContent'; userMessage: { message: string } };
    }
  | {
      id: string;
      content: {
        type: 'AgentContent';
        agentResponse: { response: string };
        sources?: NovaMessage['sources'];
      };
    };

export function useNovaChat(options: UseNovaChatOptions = {}) {
  const [messages, setMessages] = useState<NovaMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(options.chatId);

  const queryClient = useQueryClient();
  const currentMessageIdRef = useRef<string>('');
  const currentResponseRef = useRef<string>('');
  const skipNextHistoryLoadRef = useRef(false);
  const pendingCreatedChatIdRef = useRef<string | null>(null);

  const { onError, onComplete, onChatCreated } = options;

  const handleSSEEvent = useCallback(
    (eventType: string, data: SSEEventData) => {
      switch (eventType) {
        case 'stream:start': {
          currentMessageIdRef.current = data.streamId || Date.now().toString();

          if (data.chatId) {
            const newChatId = data.chatId;
            setCurrentChatId((prev) => {
              if (prev === newChatId) {
                return prev;
              }

              if (!prev) {
                skipNextHistoryLoadRef.current = true;
              }

              pendingCreatedChatIdRef.current = newChatId;
              return newChatId;
            });
          }
          break;
        }

        case 'content:delta':
          if (data.delta) {
            const processedDelta = data.delta.replace(/\\$/g, '\n');
            currentResponseRef.current += processedDelta;
            setCurrentResponse(currentResponseRef.current);
          }
          break;

        case 'source:added':
          break;

        case 'content:complete':
          const finalSources =
            typeof data.message === 'object' && data.message?.content?.sources
              ? data.message.content.sources
              : [];

          const finalContent =
            typeof data.message === 'object' && data.message?.content?.agentResponse?.response
              ? data.message.content.agentResponse.response
              : currentResponseRef.current;

          const assistantMessage: NovaMessage = {
            id: currentMessageIdRef.current,
            role: 'assistant',
            content: finalContent,
            timestamp: new Date(),
            sources: finalSources.length > 0 ? finalSources : undefined,
          };

          setMessages((prev) => [...prev, assistantMessage]);
          setCurrentResponse('');
          currentResponseRef.current = '';
          break;

        case 'stream:end':
          setIsStreaming(false);
          void queryClient.invalidateQueries({ queryKey: novaChatListQueryKey });
          onComplete?.();
          break;

        case 'error':
          {
            const errorMessage = typeof data.message === 'string' ? data.message : 'An error occurred';
            toast.error(errorMessage);
            setIsStreaming(false);
            onError?.(new Error(errorMessage));
          }
          break;

        default:
          break;
      }
    },
    [onComplete, onError, queryClient]
  );

  const sendMessage = useCallback(
    async (message: string, includeHistory = true) => {
      if (!message.trim() || isStreaming) return;

      // Add user message optimistically
      const userMessage: NovaMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);
      setCurrentResponse('');
      currentResponseRef.current = '';

      try {
        // Open SSE connection via POST
        const response = await fetch('/api/nova/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message.trim(),
            chatId: currentChatId,
            includeHistory,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to start chat stream');
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        // Parse SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let currentEvent = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim() || line.startsWith(':')) continue;

            if (line.startsWith('event:')) {
              currentEvent = line.slice(6).trim();
              continue;
            }

            if (line.startsWith('data:')) {
              try {
                const data = JSON.parse(line.slice(5).trim());
                handleSSEEvent(currentEvent, data);
                currentEvent = ''; // Reset after handling
              } catch (e) {
                console.error('Failed to parse SSE data:', e);
              }
            }
          }
        }
      } catch (error) {
        console.error('Nova chat error:', error);
        const errorMsg = error instanceof Error ? error.message : 'Failed to send message';
        toast.error(errorMsg);
        onError?.(error instanceof Error ? error : new Error(errorMsg));
        setIsStreaming(false);
      }
    },
    [currentChatId, handleSSEEvent, isStreaming, onError]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentResponse('');
    currentResponseRef.current = '';

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

      const cachedHistory = queryClient.getQueryData<NovaMessage[]>(novaChatHistoryQueryKey(chatId));
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
        console.error('Failed to load chat history:', error);
        toast.error('Failed to load chat history');
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
      setCurrentResponse('');
      currentResponseRef.current = '';
      setIsLoadingHistory(false);
    }
  }, [currentChatId, hydrateHistory]);

  useEffect(() => {
    if (pendingCreatedChatIdRef.current && currentChatId === pendingCreatedChatIdRef.current) {
      pendingCreatedChatIdRef.current = null;
      onChatCreated?.(currentChatId);
    }
  }, [currentChatId, onChatCreated]);

  useEffect(() => {
    if (!currentChatId) return;

    queryClient.setQueryData<NovaMessage[]>(novaChatHistoryQueryKey(currentChatId), messages);
  }, [currentChatId, messages, queryClient]);

  // Update chatId when option changes
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
    if (msg.content.type === 'UserContent') {
      acc.push({
        id: msg.id,
        role: 'user',
        content: msg.content.userMessage.message,
        timestamp: new Date(),
      });
    } else if (msg.content.type === 'AgentContent') {
      acc.push({
        id: msg.id,
        role: 'assistant',
        content: msg.content.agentResponse.response,
        timestamp: new Date(),
        sources: msg.content.sources,
      });
    }

    return acc;
  }, []);
}

export async function fetchChatHistory(chatId: string): Promise<NovaMessage[]> {
  const response = await fetch(`/api/nova/chats/${chatId}`);

  if (!response.ok) {
    throw new Error('Failed to load chat history');
  }

  const data = await response.json();
  const serializedMessages = (data.messages ?? []) as SerializedMessage[];
  return transformMessages(serializedMessages);
}
