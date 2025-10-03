// Core SDK Templates - Reusable rendering patterns

// ============================================
// Rendering Templates
// ============================================

template_string RenderNovaMessageHistory(messages: NovaMessage[]) #"
<conversation_history>
{% for message in messages %}
  {% if message.content.type == "NovaUserContent" %}
  <user_message id="{{ message.id }}" timestamp="{{ message.timestamp }}">
    {{ message.content.message }}
  </user_message>
  {% elif message.content.type == "NovaAgentContent" %}
  <nova_response id="{{ message.id }}" timestamp="{{ message.timestamp }}">
    {{ message.content.response }}
    {% if message.content.sources|length > 0 %}
    <sources>
      {% for source in message.content.sources %}
      - {{ source.entryDate }}: "{{ source.excerpt }}"
      {% endfor %}
    </sources>
    {% endif %}
  </nova_response>
  {% endif %}
{% endfor %}
</conversation_history>
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
      {% for pr in entry.promptResponses %}
        <prompt category="{{ pr.category }}">
          <question>{{ pr.promptText }}</question>
          <response>{{ pr.responseText }}</response>
        </prompt>
      {% endfor %}
      </prompts>
      {% endif %}
    </entry>
  {% endfor %}
  </recent_entries>
</journal_context>
"#

template_string RenderUserJournalContext(userContext: UserJournalContext) #"
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

  {% if userContext.personalityAnalysis %}
  <personality>
    <communication_style>{{ userContext.personalityAnalysis.communicationStyle }}</communication_style>
    <reflection_depth>{{ userContext.personalityAnalysis.reflectionDepth }}</reflection_depth>
    <emotional_awareness>{{ userContext.personalityAnalysis.emotionalAwareness }}</emotional_awareness>
    <growth_orientation>{{ userContext.personalityAnalysis.growthOrientation }}</growth_orientation>
  </personality>
  {% endif %}

  {% if userContext.aiResponseStyle %}
  <preferences>
    <response_style>{{ userContext.aiResponseStyle }}</response_style>
  </preferences>
  {% endif %}
</user_context>
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
