/**
 * Nova Chat Hook
 *
 * React hook for streaming chat with Nova via Server-Sent Events
 */

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface NovaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{
    type: string;
    entryDate: string;
    excerpt: string;
    mood?: string;
  }>;
}

interface UseNovaChatOptions {
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export function useNovaChat(options: UseNovaChatOptions = {}) {
  const [messages, setMessages] = useState<NovaMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [currentSources, setCurrentSources] = useState<NovaMessage['sources']>([]);

  const eventSourceRef = useRef<EventSource | null>(null);
  const currentMessageIdRef = useRef<string>('');

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
      setCurrentSources([]);

      try {
        // Open SSE connection via POST
        const response = await fetch('/api/nova/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message.trim(),
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

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim() || line.startsWith(':')) continue;

            if (line.startsWith('event:')) {
              const eventType = line.slice(6).trim();
              continue;
            }

            if (line.startsWith('data:')) {
              try {
                const data = JSON.parse(line.slice(5).trim());
                handleSSEEvent(data);
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
        options.onError?.(error instanceof Error ? error : new Error(errorMsg));
        setIsStreaming(false);
      }
    },
    [isStreaming, options]
  );

  const handleSSEEvent = (data: any) => {
    const eventType = data.type || 'unknown';

    switch (eventType) {
      case 'stream:start':
        currentMessageIdRef.current = data.streamId || Date.now().toString();
        break;

      case 'content:delta':
        if (data.delta) {
          setCurrentResponse((prev) => prev + data.delta);
        }
        break;

      case 'source:added':
        if (data.source) {
          setCurrentSources((prev) => [...(prev || []), data.source]);
        }
        break;

      case 'content:complete':
        // Finalize the assistant message
        const assistantMessage: NovaMessage = {
          id: currentMessageIdRef.current,
          role: 'assistant',
          content: currentResponse,
          timestamp: new Date(),
          sources: (currentSources && currentSources.length > 0) ? currentSources : undefined,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setCurrentResponse('');
        setCurrentSources([]);
        break;

      case 'stream:end':
        setIsStreaming(false);
        options.onComplete?.();
        break;

      case 'error':
        toast.error(data.message || 'An error occurred');
        setIsStreaming(false);
        options.onError?.(new Error(data.message || 'Stream error'));
        break;

      default:
        // Ignore unknown events
        break;
    }
  };

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentResponse('');
    setCurrentSources([]);
  }, []);

  return {
    messages,
    sendMessage,
    isStreaming,
    currentResponse,
    clearMessages,
  };
}
