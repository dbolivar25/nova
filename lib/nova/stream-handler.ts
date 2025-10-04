/**
 * Nova Stream Handler
 *
 * Coordinates the flow of events from the executor to hooks.
 * Manages timeouts, state, and ensures proper cleanup.
 */

import type { HookRegistry } from './hooks/registry';
import type {
  NovaEvent,
  StreamHandlerOptions,
  StreamHandlerState,
  StreamStateSummary,
} from './core/types';

export class NovaStreamHandler {
  private state: StreamHandlerState = {
    blockContents: new Map(),
    sources: [],
    eventCount: 0,
    completed: false,
    error: null,
  };

  private startTime = Date.now();
  private timeoutTimer?: NodeJS.Timeout;

  constructor(
    private readonly registry: HookRegistry,
    private readonly options: StreamHandlerOptions
  ) {}

  /**
   * Handle an event stream from the executor
   */
  async handleStream(eventStream: AsyncGenerator<NovaEvent>): Promise<void> {
    // Reset registry state for new stream
    this.registry.resetState();

    // Set up timeout
    this.setupTimeout();

    try {
      for await (const event of eventStream) {
        this.state.eventCount++;

        // Execute hooks for this event
        await this.registry.execute(event, {
          streamId: this.options.streamId,
          chatId: this.options.chatId,
          userId: this.options.userId,
        });

        // Check for completion or error
        if (event.type === 'chat:completed') {
          this.state.completed = true;
          break;
        }

        if (event.type === 'chat:error') {
          this.state.error = event.data.error;
          this.state.completed = true;
          break;
        }
      }
    } catch (error) {
      console.error('[StreamHandler] Error processing event stream:', error);
      this.state.error = error instanceof Error ? error : new Error('Unknown error');
      this.state.completed = true;

      // Emit error event to hooks
      await this.registry.execute(
        {
          type: 'chat:error',
          data: { error: this.state.error },
        },
        {
          streamId: this.options.streamId,
          chatId: this.options.chatId,
          userId: this.options.userId,
        }
      );
    } finally {
      this.cleanup();
    }
  }

  /**
   * Set up stream timeout
   */
  private setupTimeout(): void {
    if (!this.options.timeout) return;

    this.timeoutTimer = setTimeout(async () => {
      if (!this.state.completed) {
        console.warn(
          `[StreamHandler] Stream timeout for ${this.options.streamId} after ${this.options.timeout}ms`
        );

        // Emit timeout event
        await this.registry.execute(
          {
            type: 'chat:timeout',
            data: {},
          },
          {
            streamId: this.options.streamId,
            chatId: this.options.chatId,
            userId: this.options.userId,
          }
        );

        this.state.completed = true;
        this.state.error = new Error('Stream timeout exceeded');
      }
    }, this.options.timeout);
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = undefined;
    }
  }

  /**
   * Get current state
   */
  getState(): StreamHandlerState {
    return { ...this.state };
  }

  /**
   * Get state summary for logging
   */
  getStateSummary(): StreamStateSummary {
    return {
      eventCount: this.state.eventCount,
      duration: Date.now() - this.startTime,
      completed: this.state.completed,
      error: this.state.error?.message || null,
    };
  }
}
