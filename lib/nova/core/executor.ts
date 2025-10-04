/**
 * Nova Chat Executor
 *
 * Pure functional core for Nova chat execution.
 * This generator yields events about the chat execution without performing any I/O.
 * All side effects are handled by the imperative shell through hooks.
 */

import type { AgentContent, WeeklyInsightRef } from '@/lib/baml_client/types';
import { classifyError, sleep, toError } from './executor-helpers';
import type { NovaContext, NovaDependencies, NovaEvent } from './types';
import { createActionId } from './types';

/**
 * Execute Nova chat - pure functional core
 */
export async function* executeNovaChat(
  context: NovaContext,
  deps: NovaDependencies
): AsyncGenerator<NovaEvent> {
  const { messages, userContext, temporalContext, config, bamlContext } = context;
  const { streamNovaResponse, generateId } = deps;

  // Emit start event
  yield {
    type: 'chat:started',
    data: { collectorId: bamlContext.uniqueId },
  };

  const actionId = createActionId(generateId());
  let finalContent: AgentContent | null = null;
  let validationRetryCount = 0;
  let rateLimitRetryCount = 0;

  // Bounded retry loop - guaranteed to terminate
  const maxTotalAttempts =
    config.MAX_VALIDATION_RETRIES + config.MAX_RATE_LIMIT_RETRIES;

  for (let attempt = 0; attempt < maxTotalAttempts; attempt++) {
    try {
      const stream = streamNovaResponse(
        messages,
        userContext,
        temporalContext
      );

      // Track emitted sources to avoid duplicates
      const emittedSources = new Set<string>();

      // Stream partial results
      for await (const partial of stream) {
        // Emit delta events for streaming response
        yield {
          type: 'content:delta' as const,
          data: { actionId, partial },
        } as NovaEvent;

        // Emit only new sources (BAML accumulates sources over time)
        if (partial.sources && partial.sources.length > 0) {
          for (const source of partial.sources) {
            // Create unique key based on source type
            let sourceKey: string;
            if (source.type === 'JournalEntryRef') {
              sourceKey = `${source.type}:${source.entryDate}:${source.excerpt}`;
            } else {
              const insightRef = source as WeeklyInsightRef;
              sourceKey = `${source.type}:${insightRef.weekStartDate}:${insightRef.insightType}`;
            }

            if (!emittedSources.has(sourceKey)) {
              emittedSources.add(sourceKey);
              yield {
                type: 'source:added' as const,
                data: { actionId, source },
              } as NovaEvent;
            }
          }
        }
      }

      // Get final response - the stream is an async iterable that also has getFinalResponse
      finalContent = await stream.getFinalResponse();

      // Success - exit retry loop
      break;
    } catch (error) {
      const classified = classifyError(error);

      // Handle rate limits
      if (classified.type === 'rate_limit') {
        rateLimitRetryCount++;

        // Check if we've exceeded rate limit retries
        if (rateLimitRetryCount >= config.MAX_RATE_LIMIT_RETRIES) {
          yield {
            type: 'chat:error',
            data: {
              error: new Error(
                `Rate limit exceeded after ${config.MAX_RATE_LIMIT_RETRIES} retries: ${classified.message}`
              ),
            },
          };
          return;
        }

        yield {
          type: 'rate_limit:retry',
          data: {
            attempt: rateLimitRetryCount,
            waitMs: classified.retryAfterMs,
            error: toError(error),
          },
        };

        await sleep(classified.retryAfterMs);
        continue;
      }

      // Handle validation errors
      if (classified.type === 'validation') {
        validationRetryCount++;

        // Check if we've exceeded validation retries
        if (validationRetryCount >= config.MAX_VALIDATION_RETRIES) {
          yield {
            type: 'chat:error',
            data: {
              error: new Error(
                `Failed to get valid response after ${config.MAX_VALIDATION_RETRIES} validation attempts: ${classified.message}`
              ),
            },
          };
          return;
        }

        yield {
          type: 'retry:attempted',
          data: {
            retry: validationRetryCount,
            error: toError(error),
          },
        };

        continue;
      }

      // Unknown error - fail immediately
      yield {
        type: 'chat:error',
        data: {
          error: toError(error),
        },
      };
      return;
    }
  }

  // Check if we got a final response
  if (!finalContent) {
    yield {
      type: 'chat:error',
      data: {
        error: new Error('Failed to generate response after all retry attempts'),
      },
    };
    return;
  }

  // Emit completion event
  yield {
    type: 'chat:completed',
    data: { actionId, content: finalContent },
  };
}
