// Legacy Nova streaming hooks (SSE-based) are deprecated.
// No-op module retained only to avoid breaking imports. Safe to delete once unused.

import type { HookModule } from "@/features/nova/core/types";

export function createStreamingHooks(): HookModule {
  return {};
}
