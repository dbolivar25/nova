// Mood Inference Types - Structures for nightly mood classification

class MoodInferenceResult {
  mood string @description("One of: positive, neutral, negative, thoughtful, grateful, anxious, excited, sad, angry, peaceful")
  confidence string @description("Classifier confidence: high, medium, or low")
  summary string @description("1-2 sentence explanation grounded in the entry content")
  supportingQuotes string[]? @description("Short excerpts (<=120 chars) that informed the classification")
}

