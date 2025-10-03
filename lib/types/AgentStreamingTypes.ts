/**
 * Type definitions for Server-Sent Events (SSE) streaming
 */

export enum SSE_EVENTS {
  STREAM_START = 'stream:start',
  CONTENT_BLOCK_START = 'content:start',
  CONTENT_BLOCK_DELTA = 'content:delta',
  SOURCE_ADDED = 'source:added',
  CONTENT_BLOCK_COMPLETE = 'content:complete',
  STREAM_END = 'stream:end',
  ERROR = 'error',
  PING = 'ping',
}

export type SSEEventType =
  | 'stream:start'
  | 'content:start'
  | 'content:delta'
  | 'source:added'
  | 'content:complete'
  | 'stream:end'
  | 'error'
  | 'ping';

export interface SSEStreamStartData {
  streamId: string;
  chatId: string;
  timestamp: string;
}

export interface SSEContentBlockStartData {
  blockId: string;
  blockType: string;
  chatId: string;
}

export interface SSEContentBlockDeltaData {
  blockId: string;
  delta: string;
  chatId: string;
}

export interface SSESourceAddedData {
  blockId: string;
  source: {
    type: string;
    entryDate: string;
    excerpt: string;
    mood?: string;
  };
  chatId: string;
}

export interface SSEContentBlockCompleteData {
  blockId: string;
  message: {
    content: {
      type: string;
      response: string;
      sources: Array<{
        type: string;
        entryDate: string;
        excerpt: string;
        mood?: string;
      }>;
    };
  };
  chatId: string;
}

export interface SSEStreamEndData {
  chatId: string;
  metrics?: {
    duration: number;
    eventCount: number;
  };
}

export interface SSEErrorData {
  message: string;
  code: string;
  chatId?: string;
  streamId?: string;
}

export interface SSEPingData {
  message: string;
  chatId?: string;
  metadata?: Record<string, unknown>;
}

export type SSEEventData =
  | SSEStreamStartData
  | SSEContentBlockStartData
  | SSEContentBlockDeltaData
  | SSESourceAddedData
  | SSEContentBlockCompleteData
  | SSEStreamEndData
  | SSEErrorData
  | SSEPingData;
