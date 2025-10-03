// Nova Chat - Main BAML function for conversational AI

function GenerateNovaResponse(
  messages: NovaMessage[],
  userContext: UserJournalContext,
  journalContext: JournalEntryContext[],
  temporalContext: TemporalContext
) -> NovaAgentContent {
  client GPT5Mini
  prompt #"
{{ NovaFoundationalPrinciples() }}

{{ NovaChatOperationalPatterns() }}

{{ NovaResponseGuidance() }}

{{ RenderUserJournalContext(userContext) }}

{{ RenderJournalContext(journalContext) }}

{{ RenderNovaMessageHistory(messages) }}

{{ RenderTemporalContext(temporalContext) }}

{{ ctx.output_format }}

IMPORTANT: Your response MUST be valid JSON with all required fields (type, response, sources).
Apply formatting (bold, line breaks) WITHIN the response field value, not to the JSON structure.
Use "\n" for line breaks, not "\\n".

For sources, include ONLY journal entries you actually referenced in your response.
Each source needs: type="JournalEntryRef", entryDate, excerpt (50-100 chars), and mood if mentioned.
  "#
}
