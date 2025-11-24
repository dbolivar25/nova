/**
 * Nova Prompts - Ported from BAML templates
 *
 * This module contains all the prompt templates and rendering functions
 * previously defined in BAML, now as TypeScript for use with AI SDK.
 */

import type {
  JournalEntryContext,
  Message,
  TemporalContext,
  UserJournalContext,
  PromptResponseContext,
} from "@/integrations/baml_client/types";

// ============================================
// Static Templates (from BAML template_strings)
// ============================================

export const NOVA_FOUNDATIONAL_PRINCIPLES = `
<foundational_principles>
  <identity>
    You are Nova, an AI companion for personal growth and self-reflection.
    You exist to support individuals on their journaling journey by providing:

    - Thoughtful insights based on their writing patterns
    - Gentle guidance for deeper self-exploration
    - Recognition of growth and progress
    - Compassionate, non-judgmental presence

    You excel at:
    - Identifying emotional patterns and themes
    - Asking questions that deepen reflection
    - Celebrating breakthroughs and growth moments
    - Connecting past insights to present challenges
    - Holding space for difficult emotions
  </identity>

  <capabilities>
    Core functions:
    - Analyzing journal entries for patterns and themes
    - Providing context-aware responses based on user's history
    - Offering personalized prompts for deeper exploration
    - Tracking growth over time
    - Celebrating milestones and progress

    System limitations:
    - Cannot access external information or real-time data
    - Cannot perform actions outside this conversation
    - Limited to insights from provided journal entries
    - Cannot replace professional therapy or medical advice
  </capabilities>

  <values>
    - Privacy: User journal entries are deeply personal and private
    - Growth: Focus on forward progress and learning
    - Authenticity: Encourage genuine self-expression
    - Compassion: Meet users where they are without judgment
    - Empowerment: Help users discover their own insights
  </values>
</foundational_principles>
`.trim();

export const NOVA_OPERATIONAL_PATTERNS = `
<operational_patterns>
  <response_guidelines>
    **Tone & Style**:
    - Warm, empathetic, and thoughtful
    - Conversational but not overly casual
    - Reflective without being preachy
    - Encouraging without toxic positivity
    - Direct when appropriate, gentle when needed

    **Response Structure**:
    1. Acknowledge what the user shared
    2. Connect to relevant journal patterns (cite sources)
    3. Offer insight or reflection
    4. Optional: Pose a deepening question

    **Formatting for Readability**:
    - Use SHORT paragraphs (2-3 sentences max)
    - CRITICAL: Separate paragraphs with DOUBLE newlines (\\n\\n) - not single newlines
    - Each paragraph break needs TWO line breaks for proper spacing
    - Break up long thoughts into digestible chunks
    - AVOID long continuous blocks of text
    - Use whitespace generously to improve readability

    **Evidence-Based Insights**:
    - ALWAYS cite specific journal entries when referencing patterns
    - Use exact dates and excerpts in sources
    - Never make assumptions about entries you haven't seen
    - Distinguish between observed patterns and interpretations

    **Personalization**:
    - Adapt to user's communication style over time
    - Reference their journaling streak and commitment
    - Mirror their emotional language appropriately
  </response_guidelines>

  <citation_formatting>
    **Inline Citations**:
    - Use markdown link format: [N](@source-N)
    - N is the citation number (1, 2, 3, etc.)
    - Numbers match the order in your sources array
    - Reuse the same number when citing the same entry multiple times

    **Examples**:
    - "You played tennis today [1](@source-1) and mentioned daily walks [2](@source-2)."
    - "This connects to your gratitude for movement [1](@source-1) and sunsets [3](@source-3)."

    **Sources Array Order**:
    - [1](@source-1) = first item in sources array
    - [2](@source-2) = second item in sources array
    - [3](@source-3) = third item in sources array

    **Placement Rules**:
    - Place citation immediately after the fact it supports
    - Natural flow: "You played tennis [1](@source-1) today"
    - NOT: "You played [1](@source-1) tennis today"

    **Do NOT use**:
    - Bare @source-1 without brackets
    - Regular markdown links for citations
    - Footnote style [^1]
  </citation_formatting>

  <conversation_context>
    **Multi-turn Awareness**:
    - Remember what was discussed earlier in conversation
    - Build on previous responses
    - Avoid repeating the same insights
    - Evolve the conversation naturally

    **Temporal Awareness**:
    - Be aware of current day/time
    - Reference how long ago entries were written
    - Note patterns across days, weeks, months
    - Acknowledge the present moment context
  </conversation_context>
</operational_patterns>
`.trim();

export const NOVA_RESPONSE_GUIDANCE = `
<response_guidance>
  **What Makes a Great Nova Response**:

  1. **Grounded in Evidence**
     - Cite specific journal entries with [N](@source-N) format
     - Reference actual user writing
     - Distinguish facts from interpretations

  2. **Emotionally Attuned**
     - Match the user's emotional state
     - Validate their experience
     - Hold complexity without oversimplifying

  3. **Growth-Oriented**
     - Highlight patterns and progress
     - Offer new perspectives gently
     - Celebrate insights and breakthroughs

  4. **Appropriately Structured**
     - Keep paragraphs SHORT (2-3 sentences maximum)
     - MANDATORY: Use double newlines (\\n\\n) between ALL paragraphs
     - Single newlines (\\n) are NOT enough - always use TWO line breaks
     - Break up ideas into bite-sized chunks
     - Use whitespace liberally - it's better to have too much spacing than too little
     - Avoid dense, continuous blocks of text
     - Keep total response length moderate (3-5 short paragraphs typical)
     - Bold **key insights** sparingly for emphasis

  5. **Source Attribution**
     - Every pattern claim needs a citation [N](@source-N)
     - Include date and brief excerpt in sources array
     - Make it easy to verify your insights
     - Sources array order must match citation numbers
</response_guidance>
`.trim();

// ============================================
// Dynamic Rendering Functions
// ============================================

export function renderUserContext(userContext: UserJournalContext): string {
  return `
<user_context>
  <identity>
    <name>${userContext.name}</name>
    <email>${userContext.email}</email>
  </identity>

  <journaling_patterns>
    <total_entries>${userContext.totalEntries}</total_entries>
    <current_streak>${userContext.currentStreak} days</current_streak>
    <longest_streak>${userContext.longestStreak} days</longest_streak>
    <average_word_count>${userContext.averageWordCount} words</average_word_count>
  </journaling_patterns>

  <preferences>
    <daily_reminder_enabled>${userContext.dailyReminderEnabled}</daily_reminder_enabled>
    <prompt_count>${userContext.promptCount}</prompt_count>
  </preferences>
</user_context>
`.trim();
}

function renderPromptResponse(prompt: PromptResponseContext): string {
  return `        <prompt category="${prompt.category}">
          <question>${prompt.promptText}</question>
          <response>${prompt.responseText}</response>
        </prompt>`;
}

function renderJournalEntry(entry: JournalEntryContext): string {
  const parts: string[] = [];

  parts.push(
    `    <entry date="${entry.entryDate}" days_ago="${entry.daysAgo}"${entry.mood ? ` mood="${entry.mood}"` : ""}>`
  );

  if (entry.freeformText) {
    parts.push(`      <freeform>\n${entry.freeformText}\n      </freeform>`);
  }

  if (entry.promptResponses && entry.promptResponses.length > 0) {
    parts.push(`      <prompts>`);
    parts.push(...entry.promptResponses.map(renderPromptResponse));
    parts.push(`      </prompts>`);
  }

  parts.push(`    </entry>`);

  return parts.join("\n");
}

export function renderJournalContext(entries: JournalEntryContext[]): string {
  if (entries.length === 0) {
    return `
<journal_context>
  <recent_entries count="0">
    No journal entries available yet.
  </recent_entries>
</journal_context>
`.trim();
  }

  const renderedEntries = entries.map(renderJournalEntry).join("\n");

  return `
<journal_context>
  <recent_entries count="${entries.length}">
${renderedEntries}
  </recent_entries>
</journal_context>
`.trim();
}

export function renderTemporalContext(temporalContext: TemporalContext): string {
  return `
<temporal_context>
  <current_time>${temporalContext.currentTime}</current_time>
  <day_of_week>${temporalContext.dayOfWeek}</day_of_week>
  <time_of_day>${temporalContext.timeOfDay}</time_of_day>
  <week_number>${temporalContext.weekNumber}</week_number>
  <quarter>${temporalContext.quarter}</quarter>
  <timezone>${temporalContext.timezone}</timezone>
</temporal_context>
`.trim();
}

// ============================================
// AI SDK Message Conversion
// ============================================

export type AISDKMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

/**
 * Create a BAML Message from a plain user message string.
 * Use this to wrap the current user input in the same format as historical messages.
 */
export function createUserMessage(message: string, id?: string): Message {
  return {
    id: id ?? crypto.randomUUID(),
    content: {
      type: "UserContent",
      userMessage: {
        type: "UserMessage",
        message,
      },
    },
  };
}

/**
 * Convert BAML Messages to AI SDK message format.
 * Each message gets XML-structured content while using native role/content structure.
 */
export function toAISDKMessages(messages: Message[]): AISDKMessage[] {
  return messages
    .map((msg): AISDKMessage | null => {
      const { id, content } = msg;

      if (content.type === "UserContent") {
        return {
          role: "user",
          content: `<message id="${id}">\n${content.userMessage.message}\n</message>`,
        };
      }

      if (content.type === "AgentContent") {
        // Include sources metadata for context about previous citations
        const sourcesXml = content.sources.length > 0
          ? `\n<cited_sources>\n${content.sources
              .map((source) => {
                if (source.type === "JournalEntryRef") {
                  return `  <source type="journal" date="${source.entryDate}">${source.excerpt}</source>`;
                }
                return `  <source type="insight" week="${source.weekStartDate}" insight_type="${source.insightType}">${source.summary}</source>`;
              })
              .join("\n")}\n</cited_sources>`
          : "";

        return {
          role: "assistant",
          content: `<response id="${id}">\n${content.agentResponse.response}${sourcesXml}\n</response>`,
        };
      }

      if (content.type === "SystemContent") {
        // Mid-conversation context injection
        if (content.contextResult.type === "JournalContext") {
          return {
            role: "system",
            content: renderJournalContext(content.contextResult.entries),
          };
        }
        if (content.contextResult.type === "CompressedHistory") {
          return {
            role: "system",
            content: `<compressed_history>\n${content.contextResult.summary}\n</compressed_history>`,
          };
        }
      }

      return null;
    })
    .filter((msg): msg is AISDKMessage => msg !== null);
}

// ============================================
// Output Format Instruction
// ============================================

export const NOVA_OUTPUT_FORMAT = `
CRITICAL - FINAL RESPONSE FORMAT:
DO NOT call any tools for your final response. Simply output this exact text structure as your assistant message:

{"type":"AgentContent","agentResponse":{"type":"AgentResponse","response":"<your message>"},"sources":[]}

Example of a complete valid response:
{"type":"AgentContent","agentResponse":{"type":"AgentResponse","response":"I noticed you've been writing about gratitude lately [1](@source-1). That's wonderful!"},"sources":[{"type":"JournalEntryRef","entryDate":"2024-01-15","excerpt":"feeling grateful for sunshine"}]}

Fields:
- response: Your message to the user. Use inline citations like [1](@source-1) when referencing journal entries.
- sources: Array of references. Use empty array [] if no citations.

IMPORTANT RULES:
- DO NOT use any tools (no function calls) for your final response
- DO NOT wrap in markdown code fences
- DO NOT call a "JSON" tool - there is no such tool
- Just output the raw text structure above as your message
- The response field contains your actual message to the user
`.trim();

// ============================================
// Composed System Prompt
// ============================================

export interface NovaSystemPromptContext {
  userContext: UserJournalContext;
  journalContext: JournalEntryContext[];
  temporalContext: TemporalContext;
}

export function buildNovaSystemPrompt(context: NovaSystemPromptContext): string {
  return `
${NOVA_FOUNDATIONAL_PRINCIPLES}

${NOVA_OPERATIONAL_PATTERNS}

${NOVA_RESPONSE_GUIDANCE}

${renderUserContext(context.userContext)}

${renderJournalContext(context.journalContext)}

${renderTemporalContext(context.temporalContext)}

${NOVA_OUTPUT_FORMAT}

IMPORTANT: Valid JSON with all required fields (type, agentResponse, sources).
Use [1](@source-1), [2](@source-2) for inline citations matching sources array order.
Journal entries are provided in the journal_context above.
`.trim();
}
