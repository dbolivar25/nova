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
  }>;
}

interface UseNovaChatOptions {
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

interface SSEEventData {
  streamId?: string;
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

export function useNovaChat(options: UseNovaChatOptions = {}) {
  const [messages, setMessages] = useState<NovaMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');

  const currentMessageIdRef = useRef<string>('');
  const currentResponseRef = useRef<string>('');

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
        options.onError?.(error instanceof Error ? error : new Error(errorMsg));
        setIsStreaming(false);
      }
    },
    [isStreaming, options]
  );

  const handleSSEEvent = (eventType: string, data: SSEEventData) => {
    switch (eventType) {
      case 'stream:start':
        currentMessageIdRef.current = data.streamId || Date.now().toString();
        break;

      case 'content:delta':
        if (data.delta) {
          // BAML sends backslash at end of delta to represent newlines
          // Replace trailing backslash with actual newline
          const processedDelta = data.delta.replace(/\\$/g, '\n');
          currentResponseRef.current += processedDelta;
          setCurrentResponse(currentResponseRef.current);
        }
        break;

      case 'source:added':
        // Ignore partial sources during streaming - we'll get final sources in content:complete
        break;

      case 'content:complete':
        // Get final sources from the complete message data
        const finalSources =
          typeof data.message === 'object' && data.message?.content?.sources
            ? data.message.content.sources
            : [];

        // Use the server's final response (has correct newlines) instead of accumulated deltas
        const finalContent =
          typeof data.message === 'object' && data.message?.content?.agentResponse?.response
            ? data.message.content.agentResponse.response
            : currentResponseRef.current;

        // Finalize the assistant message with complete sources
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
        options.onComplete?.();
        break;

      case 'error':
        const errorMessage = typeof data.message === 'string' ? data.message : 'An error occurred';
        toast.error(errorMessage);
        setIsStreaming(false);
        options.onError?.(new Error(errorMessage));
        break;

      default:
        // Ignore unknown events
        break;
    }
  };

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentResponse('');
    currentResponseRef.current = '';
  }, []);

  return {
    messages,
    sendMessage,
    isStreaming,
    currentResponse,
    clearMessages,
  };
}
