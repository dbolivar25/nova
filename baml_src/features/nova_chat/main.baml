// Nova Chat - Main BAML function for conversational AI

function GenerateNovaResponse(
  messages: Message[],
  userContext: UserContext,
  temporalContext: TemporalContext
) -> AgentContent {
  client GPT5Mini
  prompt #"
{{ NovaFoundationalPrinciples() }}

{{ NovaChatOperationalPatterns() }}

{{ NovaResponseGuidance() }}

{{ RenderUserContext(userContext) }}

{{ RenderMessageHistory(messages) }}

{{ RenderTemporalContext(temporalContext) }}

{{ ctx.output_format }}

IMPORTANT: Valid JSON with all required fields (type, agentResponse, sources).
Use [1](@source-1), [2](@source-2) for inline citations matching sources array order.
Journal entries are provided in SystemContent messages in conversation history.
  "#
}
