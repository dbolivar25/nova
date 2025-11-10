/** Simplified core types for Nova after migration to ai SDK v6.
 *  Legacy SSE/Hook types removed.
 */

export interface NovaSource {
  type: string;
  entryDate?: string;
  excerpt?: string;
  mood?: string;
}

export interface HookModule {
  // Placeholder to satisfy legacy imports while Nova is migrated.
}
