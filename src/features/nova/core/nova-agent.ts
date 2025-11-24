/**
 * Nova Agent Configuration
 *
 * Configures the AI SDK ToolLoopAgent for the Nova journaling companion.
 */

import { ToolLoopAgent } from "ai";
import { novaModel } from "@/shared/lib/ai/provider";
import { novaOutputSpec } from "./nova-output";
import { buildNovaSystemPrompt, type NovaSystemPromptContext } from "./nova-prompts";
import { novaTools, type NovaToolContext } from "./nova-tools";

// ============================================
// Agent Factory
// ============================================

export interface CreateNovaAgentOptions {
  context: NovaSystemPromptContext;
  toolContext: NovaToolContext;
}

export function createNovaAgent({ context, toolContext }: CreateNovaAgentOptions) {
  const systemPrompt = buildNovaSystemPrompt(context);

  return new ToolLoopAgent({
    model: novaModel,
    instructions: systemPrompt,
    tools: novaTools,
    output: novaOutputSpec,
    experimental_context: {
      toolContext,
    },
  });
}
