// Core SDK Templates - Reusable rendering patterns

// ============================================
// Message Rendering Helpers
// ============================================

template_string RenderUserContent(content: UserContent, messageId: string) #"
<user_message id="{{ messageId }}">
  {{ content.userMessage.message }}
</user_message>
"#

template_string RenderAgentContent(content: AgentContent, messageId: string) #"
<nova_response id="{{ messageId }}">
  {{ content.agentResponse.response }}
</nova_response>
"#

template_string RenderSystemContent(content: SystemContent) #"
{% if content.contextResult.type == "JournalContext" %}
{{ RenderJournalContext(content.contextResult.entries) }}
{% elif content.contextResult.type == "CompressedHistory" %}
<compressed_history>
  {{ content.contextResult.summary }}
</compressed_history>
{% endif %}
"#

template_string RenderMessageHistory(messages: Message[]) #"
<conversation_history>
{% for message in messages %}
  {% if message.content.type == "UserContent" %}
{{ RenderUserContent(message.content, message.id) }}
  {% elif message.content.type == "AgentContent" %}
{{ RenderAgentContent(message.content, message.id) }}
  {% elif message.content.type == "SystemContent" %}
{{ RenderSystemContent(message.content) }}
  {% endif %}
{% endfor %}
</conversation_history>
"#

// ============================================
// Context Rendering Helpers
// ============================================

template_string RenderUserContext(userContext: UserJournalContext) #"
<user_context>
  <identity>
    <name>{{ userContext.name }}</name>
    <email>{{ userContext.email }}</email>
  </identity>

  <journaling_patterns>
    <total_entries>{{ userContext.totalEntries }}</total_entries>
    <current_streak>{{ userContext.currentStreak }} days</current_streak>
    <longest_streak>{{ userContext.longestStreak }} days</longest_streak>
    <average_word_count>{{ userContext.averageWordCount }} words</average_word_count>
  </journaling_patterns>

  <preferences>
    <daily_reminder_enabled>{{ userContext.dailyReminderEnabled }}</daily_reminder_enabled>
    <prompt_count>{{ userContext.promptCount }}</prompt_count>
  </preferences>
</user_context>
"#

template_string RenderJournalContext(entries: JournalEntryContext[]) #"
<journal_context>
  <recent_entries count="{{ entries|length }}">
{% for entry in entries %}
    <entry date="{{ entry.entryDate }}" days_ago="{{ entry.daysAgo }}" mood="{{ entry.mood }}">
{% if entry.freeformText %}
      <freeform>
{{ entry.freeformText }}
      </freeform>
{% endif %}

{% if entry.promptResponses|length > 0 %}
      <prompts>
{% for prompt in entry.promptResponses %}
        <prompt category="{{ prompt.category }}">
          <question>{{ prompt.promptText }}</question>
          <response>{{ prompt.responseText }}</response>
        </prompt>
{% endfor %}
      </prompts>
{% endif %}
    </entry>
{% endfor %}
  </recent_entries>
</journal_context>
"#

template_string RenderTemporalContext(temporalContext: TemporalContext) #"
<temporal_context>
  <current_time>{{ temporalContext.currentTime }}</current_time>
  <day_of_week>{{ temporalContext.dayOfWeek }}</day_of_week>
  <time_of_day>{{ temporalContext.timeOfDay }}</time_of_day>
  <week_number>{{ temporalContext.weekNumber }}</week_number>
  <quarter>{{ temporalContext.quarter }}</quarter>
  <timezone>{{ temporalContext.timezone }}</timezone>
</temporal_context>
"#
