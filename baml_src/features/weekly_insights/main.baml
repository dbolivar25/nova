// Weekly Insights - Main BAML function for analyzing journal patterns

function GenerateWeeklyInsights(
  entries: JournalEntryContext[],
  userContext: UserJournalContext,
  temporalContext: TemporalContext,
  weekStartDate: string,
  weekEndDate: string
) -> WeeklyInsights {
  client GPT5Mini
  prompt #"
{{ NovaFoundationalPrinciples() }}

{{ WeeklyInsightsFramework() }}

<analysis_task>
You are analyzing a week of journal entries to generate comprehensive weekly insights.

{{ RenderUserContext(userContext) }}

{{ RenderJournalContext(entries) }}

{{ RenderTemporalContext(temporalContext) }}

<week_details>
  Week: {{ weekStartDate }} to {{ weekEndDate }}
  Total entries: {{ entries|length }}
</week_details>

Now, conduct your analysis:

## Step 1: Emotional Analysis
{{ WeeklyInsightsEmotionalAnalysis() }}

## Step 2: Theme Identification
{{ WeeklyInsightsThemeIdentification() }}

## Step 3: Growth Moments
{{ WeeklyInsightsGrowthMoments() }}

## Step 4: Week Ahead Suggestions
{{ WeeklyInsightsSuggestions() }}

## Step 5: Nova's Observation
Write a 3-4 sentence overall observation about this week.
Be warm, specific, and grounded in what you actually read.
</analysis_task>

{{ ctx.output_format }}

CRITICAL:
- Base ALL insights on actual entry content
- Include specific dates and quotes
- Distinguish observation from interpretation
- Be compassionate and growth-oriented
  "#
}
