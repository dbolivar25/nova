/**
 * Core types for Nova AI agent system
 */

import type { AgentContent, Message, UserContext } from '@/lib/baml_client/types';

// Re-export for use in hooks
export type { SSEService } from '@/lib/middleware/sse-connection';

// ============================================
// Branded Types for Type Safety
// ============================================

export type StreamId = string & { readonly __brand: 'StreamId' };
export type ChatId = string & { readonly __brand: 'ChatId' };
export type UserId = string & { readonly __brand: 'UserId' };
export type ActionId = string & { readonly __brand: 'ActionId' };

export const createStreamId = (id: string): StreamId => id as StreamId;
export const createChatId = (id: string): ChatId => id as ChatId;
export const createUserId = (id: string): UserId => id as UserId;
export const createActionId = (id: string): ActionId => id as ActionId;

// ============================================
// Agent Configuration
// ============================================

export interface NovaAgentConfig {
  MAX_ITERATIONS: number;
  MAX_VALIDATION_RETRIES: number;
  MAX_RATE_LIMIT_RETRIES: number;
  STREAM_TIMEOUT_MS: number;
  MAX_MESSAGE_LENGTH: number;
  JOURNAL_CONTEXT_LIMIT: number; // How many recent entries to include
}

export const DEFAULT_NOVA_CONFIG: NovaAgentConfig = {
  MAX_ITERATIONS: 1, // Nova is single-shot, not agentic loop
  MAX_VALIDATION_RETRIES: 2,
  MAX_RATE_LIMIT_RETRIES: 3,
  STREAM_TIMEOUT_MS: 120000, // 2 minutes
  MAX_MESSAGE_LENGTH: 2000,
  JOURNAL_CONTEXT_LIMIT: 15, // Last 15 entries
};

// ============================================
// Agent Context
// ============================================

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BamlStream } from '@boundaryml/baml';
import type { partial_types } from '@/lib/baml_client/partial_types';

export interface NovaBamlContext {
  collector?: any; // BamlCollector type
  uniqueId: string;
}

export interface NovaContext {
  messages: Message[];
  userContext: UserContext;
  temporalContext: any; // TemporalContext from BAML
  config: NovaAgentConfig;
  bamlContext: NovaBamlContext;
}

// ============================================
// Agent Dependencies (functional core)
// ============================================

export interface NovaDependencies {
   
  streamNovaResponse: (
    messages: Message[],
    userContext: UserContext,
    temporalContext: any
  ) => BamlStream<partial_types.AgentContent, AgentContent>;
  generateId: () => string;
   
  getTemporalContext: (date: Date) => any;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ============================================
// Agent Events (what the executor yields)
// ============================================

export type NovaEvent =
  | { type: 'chat:started'; data: { collectorId: string } }
  | { type: 'content:delta'; data: { actionId: ActionId; partial: Partial<AgentContent> } }
  | { type: 'source:added'; data: { actionId: ActionId; source: unknown } }
  | { type: 'chat:completed'; data: { actionId: ActionId; content: AgentContent } }
  | { type: 'retry:attempted'; data: { retry: number; error: Error } }
  | { type: 'rate_limit:retry'; data: { attempt: number; waitMs: number; error: Error } }
  | { type: 'chat:error'; data: { error: Error } }
  | { type: 'chat:timeout'; data: Record<string, never> };

// ============================================
// Hook System Types
// ============================================

export interface HookState {
  blockContents: Map<ActionId, string>; // Track content for delta calculation
  sources: Array<unknown>; // Accumulated sources
  eventCount: number;
}

export interface HookMetrics {
  startTime: number;
  trackEvent: (event: string, metadata?: Record<string, unknown>) => void;
  getDuration: () => number;
}

// Generic hook context for specific event types
export interface HookContext<T = unknown> {
  streamId: StreamId;
  chatId: ChatId;
  userId: UserId;
  event: T;
  state: HookState;
  metrics: HookMetrics;
  updateState: (partial: Partial<HookState>) => void;
}

// Generic hook for specific event types
export interface Hook<T = unknown> {
  handler: (ctx: HookContext<T>) => Promise<void>;
  metadata: {
    priority: number; // Lower runs first
    parallel: boolean; // Can run in parallel with others
  };
}

// Map event types to their data types
export type EventDataMap = {
  'chat:started': { collectorId: string };
  'content:delta': { actionId: ActionId; partial: Partial<AgentContent> };
  'source:added': { actionId: ActionId; source: unknown };
  'chat:completed': { actionId: ActionId; content: AgentContent };
  'retry:attempted': { retry: number; error: Error };
  'rate_limit:retry': { attempt: number; waitMs: number; error: Error };
  'chat:error': { error: Error };
  'chat:timeout': Record<string, never>;
};

export type HookMap = {
  [K in keyof EventDataMap]?: Hook<EventDataMap[K]>;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface HookModule extends HookMap {}

// ============================================
// Stream Handler Types
// ============================================

export interface StreamHandlerOptions {
  streamId: StreamId;
  chatId: ChatId;
  userId: UserId;
  timeout?: number;
}

export interface StreamHandlerState {
  blockContents: Map<ActionId, string>;
  sources: Array<unknown>;
  eventCount: number;
  completed: boolean;
  error: Error | null;
}

export interface StreamStateSummary {
  eventCount: number;
  duration: number;
  completed: boolean;
  error: string | null;
}

// ============================================
// SSE Config
// ============================================

export const NOVA_SSE_CONFIG = {
  timeout: 120000, // 2 minutes
  keepaliveInterval: 15000, // 15 seconds
};

// ============================================
// Error Types & Codes
// ============================================

export const NOVA_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  STREAM_ERROR: 'STREAM_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

export type NovaErrorCode = typeof NOVA_ERROR_CODES[keyof typeof NOVA_ERROR_CODES];

// ============================================
// SSE Event Constants
// ============================================

export const SSE_EVENTS = {
  STREAM_START: 'stream:start',
  CONTENT_BLOCK_START: 'content:start',
  CONTENT_BLOCK_DELTA: 'content:delta',
  SOURCE_ADDED: 'source:added',
  CONTENT_BLOCK_COMPLETE: 'content:complete',
  STREAM_END: 'stream:end',
  ERROR: 'error',
  PING: 'ping',
} as const;
