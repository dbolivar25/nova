// Legacy Nova database hooks (SSE-based) are deprecated.
// No-op module retained only to avoid breaking imports. Safe to delete once unused.

import type { HookModule } from "@/features/nova/core/types";

export function createDatabaseHooks(): HookModule {
  return {};
}
