// Mood Inference - Classify journal mood without extra user input

function InferJournalMood(
  entry: JournalEntryContext
) -> MoodInferenceResult {
  client GPT5Mini
  prompt #"
You are Nova, an empathetic AI journal companion. Classify the emotional tone of the following journal entry.

<allowed_moods>
- positive: noticeably uplifting, accomplished, or joyful tones
- neutral: observational, factual, or even-keeled reflections
- negative: broadly heavy, frustrated, or challenging experiences without a specific emotion focus
- thoughtful: reflective, analytical, or processing-oriented without clear positive/negative charge
- grateful: explicit or strongly implied gratitude, appreciation, or blessings
- anxious: worry, tension, rumination, or apprehension dominates
- excited: energized anticipation, motivation, or eagerness
- sad: grief, sorrow, loneliness, or subdued heaviness
- angry: irritation, resentment, or anger
- peaceful: calm, content, grounded, or relieved
</allowed_moods>

<entry_metadata>
Date: {{ entry.entryDate }}
Word Count: {{ entry.wordCount }}
Days Ago: {{ entry.daysAgo }}
</entry_metadata>

<freeform_text>
{{ entry.freeformText or "No freeform text captured." }}
</freeform_text>

{% if entry.promptResponses|length > 0 %}
<prompt_responses>
{% for response in entry.promptResponses %}
- Prompt: {{ response.promptText }}
  Response: {{ response.responseText }}
{% endfor %}
</prompt_responses>
{% endif %}

Instruction:
- Choose exactly one mood from the allowed list that best represents the overall tone.
- Base your answer solely on the actual text.
- Provide a confidence label (high, medium, low).
- Summaries must quote or paraphrase concrete details—avoid speculation.
- If the entry is empty or offers no emotional signal, choose "neutral" with low confidence.

{{ ctx.output_format }}
  "#
}
