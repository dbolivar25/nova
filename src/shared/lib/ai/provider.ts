import { groq } from "@ai-sdk/groq";

// Shared AI model configuration for Nova.
// Uses Groq's gpt-oss-120b as primary model.

export const novaModel = groq("gpt-oss-120b");
