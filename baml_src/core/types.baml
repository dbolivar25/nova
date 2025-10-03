// Core SDK Types - Universal components for Nova AI features

// ============================================
// Reference Types - Traceability without exposing IDs
// ============================================

class JournalEntryRef {
  type "JournalEntryRef"
  entryDate string @description("Date of journal entry (YYYY-MM-DD)")
  excerpt string @description("Brief excerpt from the entry (50-100 chars)")
  mood string? @description("Mood tag if present")
}

class WeeklyInsightRef {
  type "WeeklyInsightRef"
  weekStartDate string @description("Start date of the week")
  insightType string @description("Type of insight")
  summary string @description("Brief summary of the insight")
}

type SourceRef = JournalEntryRef | WeeklyInsightRef

// ============================================
// Context Types - Rich Data for AI
// ============================================

class PromptResponseContext {
  promptText string @description("The prompt question")
  responseText string @description("User's response")
  category string @description("Prompt category (self-awareness, growth, etc.)")
}

class JournalEntryContext {
  type "JournalEntryContext"
  entryDate string @description("Date of entry (YYYY-MM-DD)")
  freeformText string? @description("User's free-form writing")
  mood string? @description("Emotional state")
  wordCount int @description("Length of entry")
  promptResponses PromptResponseContext[] @description("Responses to daily prompts")
  daysAgo int @description("How many days ago this was written")
}

class PersonalityTraits {
  communicationStyle string @description("How user expresses themselves")
  reflectionDepth string @description("How deeply they self-reflect")
  emotionalAwareness string @description("Level of emotional intelligence")
  growthOrientation string @description("Attitude toward personal development")
}

class UserJournalContext {
  type "UserJournalContext"
  userId string @description("User identifier")
  email string @description("User email")
  name string @description("User's display name")

  // Journaling patterns
  totalEntries int @description("Total journal entries written")
  currentStreak int @description("Current consecutive day streak")
  longestStreak int @description("Longest streak achieved")
  averageWordCount int @description("Average words per entry")

  // Preferences from user_preferences
  dailyReminderEnabled bool @description("Whether user wants reminders")
  promptCount int @description("Number of daily prompts (1-5)")

  // AI personalization (optional, future)
  aiResponseStyle string? @description("Preferred response style (thoughtful, direct, empathetic)")
  personalityAnalysis PersonalityTraits? @description("User's personality traits")
}

// ============================================
// Temporal Context - Time Awareness
// ============================================

class TemporalContext {
  type "TemporalContext"
  currentTime string @description("Current time in ISO 8601 format")
  timezone string @description("User's timezone")
  dayOfWeek string @description("Day of the week")
  weekNumber int @description("Week number of the year")
  quarter string @description("Quarter like 'Q1 2025'")
  timeOfDay string @description("morning, afternoon, evening, night")
}

// ============================================
// Message System - Nova Chat
// ============================================

class NovaUserContent {
  type "NovaUserContent"
  message string @description("User's message to Nova")
}

class NovaAgentContent {
  type "NovaAgentContent" @stream.done @stream.not_null
  response string @description("Nova's thoughtful response")
  sources SourceRef[] @description("Journal entries referenced")
  confidence float? @description("Confidence in response (0-1)")
}

class NovaSystemContent {
  type "NovaSystemContent"
  journalContext JournalEntryContext[] @description("Relevant journal entries")
  userContext UserJournalContext @description("User's journaling patterns")
}

type NovaMessageContent = NovaUserContent | NovaAgentContent | NovaSystemContent

class NovaMessage {
  id string @description("Message ID")
  content NovaMessageContent @description("Message content")
  timestamp string @description("ISO 8601 timestamp")
}
