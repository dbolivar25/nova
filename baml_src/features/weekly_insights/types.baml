// Weekly Insights Types - Feature-specific output structures

class EmotionalMoment {
  date string @description("Entry date")
  emotion string @description("Primary emotion")
  context string @description("What happened or what was thought about")
  excerpt string @description("Quote from entry")
}

class EmotionalTrend {
  overallMood string @description("Overall emotional trajectory (e.g., 'Positive', 'Mixed', 'Challenging')")
  summary string @description("3-4 sentence narrative of emotional journey")
  dominantEmotions string[] @description("Most frequent emotions")
  keyMoments EmotionalMoment[] @description("Specific emotional highlights")
}

class ThemeEvidence {
  date string @description("Entry date")
  excerpt string @description("Relevant quote")
}

class KeyTheme {
  name string @description("Theme name (2-4 words)")
  description string @description("What this theme is about")
  frequency int @description("How many entries mentioned this")
  evidence ThemeEvidence[] @description("Specific examples")
  significance string @description("Why this theme matters")
}

class GrowthMoment {
  date string @description("When this happened")
  title string @description("Brief title for the moment")
  quote string @description("Exact passage from entry")
  significance string @description("Why this represents growth")
}

class WeekAheadSuggestion {
  focusArea string @description("What to explore or attend to")
  rationale string @description("Why this connects to their week")
  guidance string @description("How to explore this (gentle suggestion)")
}

class WeeklyInsights {
  weekStartDate string @description("Start of week (Monday)")
  weekEndDate string @description("End of week (Sunday)")
  entryCount int @description("Number of entries analyzed")

  emotionalTrends EmotionalTrend @description("Emotional journey analysis")
  keyThemes KeyTheme[] @description("2-4 major themes")
  growthMoments GrowthMoment[] @description("1-3 breakthroughs or insights")
  weekAheadSuggestions WeekAheadSuggestion[] @description("1-2 focus areas")

  novaObservation string @description("3-4 sentence overall observation from Nova")
}
