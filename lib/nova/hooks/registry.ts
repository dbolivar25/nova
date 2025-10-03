/**
 * Hook Registry for Nova Agent
 *
 * Manages registration and execution of hooks that respond to agent events.
 * Follows the imperative shell pattern - pure functional core yields events,
 * hooks handle all side effects (I/O, database, streaming).
 */

import type {
  Hook,
  HookContext,
  HookMetrics,
  HookModule,
  HookState,
  NovaEvent,
} from '../core/types';

export class HookRegistry {
  private hooks = new Map<string, Hook<unknown>[]>();

  /**
   * Register a module of hooks
   */
  register(module: HookModule, namespace?: string): void {
    for (const [eventType, hook] of Object.entries(module)) {
      if (!hook) continue;

      const key = namespace ? `${namespace}:${eventType}` : eventType;
      const existing = this.hooks.get(eventType) || [];
      existing.push(hook as Hook<unknown>);
      this.hooks.set(eventType, existing);

      console.debug(`[HookRegistry] Registered hook for ${eventType} (${key})`);
    }
  }

  /**
   * Execute all hooks for a given event
   */
  async execute(
    event: NovaEvent,
    context: Omit<HookContext<unknown>, 'event' | 'updateState' | 'state' | 'metrics'>
  ): Promise<void> {
    const hooks = this.hooks.get(event.type) || [];
    if (hooks.length === 0) return;

    // Sort by priority (lower = earlier)
    const sortedHooks = [...hooks].sort((a, b) => a.metadata.priority - b.metadata.priority);

    // Shared state for this event execution
    let state: HookState = {
      blockContents: new Map(),
      sources: [],
      eventCount: 0,
    };

    const metrics: HookMetrics = {
      startTime: Date.now(),
      trackEvent: (name: string, metadata?: Record<string, unknown>) => {
        console.debug(`[Metrics] ${name}`, metadata);
      },
      getDuration: () => Date.now() - metrics.startTime,
    };

    const updateState = (partial: Partial<HookState>) => {
      state = { ...state, ...partial };
    };

    // Group by parallel vs sequential
    const sequentialHooks = sortedHooks.filter((h) => !h.metadata.parallel);
    const parallelHooks = sortedHooks.filter((h) => h.metadata.parallel);

    const hookContext: HookContext<typeof event.data> = {
      ...context,
      event: event.data,
      state,
      metrics,
      updateState,
    };

    // Run sequential hooks in order
    for (const hook of sequentialHooks) {
      try {
        await hook.handler({ ...hookContext, state, updateState });
      } catch (error) {
        console.error(`[HookRegistry] Error in sequential hook for ${event.type}:`, error);
      }
    }

    // Run parallel hooks concurrently
    if (parallelHooks.length > 0) {
      await Promise.all(
        parallelHooks.map(async (hook) => {
          try {
            await hook.handler({ ...hookContext, state, updateState });
          } catch (error) {
            console.error(`[HookRegistry] Error in parallel hook for ${event.type}:`, error);
          }
        })
      );
    }
  }

  /**
   * Get all registered event types
   */
  getRegisteredEvents(): string[] {
    return Array.from(this.hooks.keys());
  }

  /**
   * Clear all hooks
   */
  clear(): void {
    this.hooks.clear();
  }
}
