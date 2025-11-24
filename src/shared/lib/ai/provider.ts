import { groq } from "@ai-sdk/groq";

// Shared AI model configuration for Nova.
// Uses Groq's openai/gpt-oss-120b as primary model.

export const novaModel = groq("openai/gpt-oss-120b");
