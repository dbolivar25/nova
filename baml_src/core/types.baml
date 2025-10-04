// Core SDK Types - Universal components for Nova AI features

// ============================================
// Source References
// ============================================

class JournalEntryRef {
  type "JournalEntryRef"
  entryDate string @description("Date (YYYY-MM-DD)")
  excerpt string @description("Brief excerpt (50-100 chars)")
}

class WeeklyInsightRef {
  type "WeeklyInsightRef"
  weekStartDate string @description("Week start date (YYYY-MM-DD)")
  insightType string @description("Type of insight")
  summary string @description("Brief summary")
}

type SourceRef = JournalEntryRef | WeeklyInsightRef

// ============================================
// Context Types
// ============================================

class PromptResponseContext {
  promptText string
  responseText string
  category string
}

class JournalEntryContext {
  type "JournalEntryContext"
  entryDate string @description("Date (YYYY-MM-DD)")
  freeformText string? @description("Free-form writing")
  mood string? @description("Mood tag")
  wordCount int
  promptResponses PromptResponseContext[]
  daysAgo int @description("Days ago from today")
}

class UserJournalContext {
  type "UserJournalContext"
  userId string
  email string
  name string

  totalEntries int
  currentStreak int
  longestStreak int
  averageWordCount int

  dailyReminderEnabled bool
  promptCount int @description("Daily prompt count (1-5)")
}

class UserContext {
  type "UserContext"
  userInfo UserJournalContext @description("User's journaling stats and preferences")
}

class TemporalContext {
  type "TemporalContext"
  currentTime string @description("ISO 8601 format")
  timezone string
  dayOfWeek string
  weekNumber int
  quarter string @description("e.g., 'Q4 2025'")
  timeOfDay string @description("morning, afternoon, evening, night")
}

// ============================================
// Message Types
// ============================================

class UserMessage {
  type "UserMessage"
  message string @description("The user's message to Nova")
}

class UserContent {
  type "UserContent"
  userMessage UserMessage
}

class AgentResponse {
  type "AgentResponse" @stream.done @stream.not_null
  response string @description("Nova's response with inline citations in format [1](@source-1), [2](@source-2), etc.")
}

class AgentContent {
  type "AgentContent" @stream.done @stream.not_null
  agentResponse AgentResponse
  sources SourceRef[] @description("Journal entries referenced. Order matches citation numbers.")
}

// ============================================
// System Context
// ============================================

class JournalContext {
  type "JournalContext"
  entries JournalEntryContext[] @description("Relevant journal entries for this conversation turn")
}

class CompressedHistory {
  type "CompressedHistory"
  summary string @description("Compressed conversation history for context")
}

type ContextResult = JournalContext | CompressedHistory

class SystemContent {
  type "SystemContent"
  contextResult ContextResult @description("Context provided by the system")
}

// ============================================
// Message Content Union
// ============================================

type MessageContent = UserContent | AgentContent | SystemContent

class Message {
  id string @description("Message ID")
  content MessageContent
}
