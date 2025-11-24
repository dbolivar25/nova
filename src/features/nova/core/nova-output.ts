/**
 * Nova Output Specification
 *
 * Defines the AI SDK Output spec that uses BAML for parsing model responses.
 * The model outputs text (guided by instructions), and BAML validates/parses
 * the JSON structure into typed AgentContent.
 */

import { NoOutputGeneratedError } from "ai";
import type { Output } from "ai";
import { b } from "@/integrations/baml_client";
import type { AgentContent } from "@/integrations/baml_client/types";
import type { partial_types } from "@/integrations/baml_client";

const toNoOutputError = (error: unknown): NoOutputGeneratedError => {
  const cause =
    error instanceof Error
      ? error
      : new Error(typeof error === "string" ? error : String(error));

  return new NoOutputGeneratedError({
    message: "Nova agent failed to produce a valid structured response",
    cause,
  });
};

export const novaOutputSpec: Output.Output<AgentContent, partial_types.AgentContent> = {
  responseFormat: Promise.resolve({ type: "text" }),

  async parseCompleteOutput({ text }) {
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

  async parsePartialOutput({ text }) {
    const candidate = text.trim();
    if (!candidate) {
      return undefined;
    }

    try {
      const partial = b.parseStream.GenerateNovaResponse(candidate);
      return { partial };
    } catch {
      return undefined;
    }
  },
};
