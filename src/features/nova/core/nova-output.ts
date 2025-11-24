import { NoOutputGeneratedError, Output } from "ai";
import { b } from "@/integrations/baml_client";
import type { AgentContent } from "@/integrations/baml_client/types";
import type { partial_types } from "@/integrations/baml_client";

const toNoOutputError = (error: unknown): NoOutputGeneratedError => {
  const cause =
    error instanceof Error ? error : new Error(typeof error === "string" ? error : String(error));

  return new NoOutputGeneratedError({
    message: "Nova agent failed to produce a valid structured response",
    cause,
  });
};

export const novaOutputSpec = {
  // Encourage the model to emit JSON matching the BAML shape.
  responseFormat: Promise.resolve({ type: "json" }),

  async parseCompleteOutput({ text }: { text: string }) {
    const candidate = text.trim();
    if (!candidate) {
      throw toNoOutputError(new Error("Empty model response"));
    }

    try {
      return b.parse.GenerateNovaResponse(candidate);
    } catch (error) {
      throw toNoOutputError(error);
    }
  },

  async parsePartialOutput({ text }: { text: string }) {
    const candidate = text.trim();
    if (!candidate) {
      return undefined;
    }

    try {
      const partial = b.parseStream.GenerateNovaResponse(candidate);
      return { partial };
    } catch {
      // Ignore partial parse errors to allow the stream to continue.
      return undefined;
    }
  },
} satisfies Omit<ReturnType<(typeof Output)["text"]>, "parseCompleteOutput" | "parsePartialOutput"> & {
  parseCompleteOutput: (options: { text: string }) => Promise<AgentContent>;
  parsePartialOutput: (options: { text: string }) => Promise<{ partial: partial_types.AgentContent } | undefined>;
};
