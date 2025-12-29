// ============================================
// Survey System Types
// ============================================

// Database enum types
export type QuestionType =
  | "text"
  | "textarea"
  | "tags"
  | "select"
  | "multiselect"
  | "scale"
  | "checkbox"
  | "date"
  | "ranking"
  | "goals_timeframe"
  | "daily_goals";

export type GoalType = "add" | "remove" | "minimize";

export type GoalCategory =
  | "health"
  | "productivity"
  | "relationships"
  | "mindset"
  | "learning"
  | "finance"
  | "creativity"
  | "other";

export type SubmissionStatus = "in_progress" | "completed" | "abandoned" | "archived";

// ============================================
// Database Entity Types
// ============================================

export interface Survey {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  version: number;
  is_active: boolean;
  is_required: boolean;
  trigger_type: "onboarding" | "scheduled" | "manual";
  trigger_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SurveyQuestion {
  id: string;
  survey_id: string;
  slug: string;
  question_text: string;
  question_type: QuestionType;
  display_order: number;
  step_number: number;
  is_required: boolean;
  placeholder: string | null;
  help_text: string | null;
  metadata: QuestionMetadata;
  created_at: string;
}

export interface SurveySubmission {
  id: string;
  user_id: string;
  survey_id: string;
  status: SubmissionStatus;
  current_step: number;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SurveyResponse {
  id: string;
  submission_id: string;
  question_id: string;
  response_value: ResponseValue;
  created_at: string;
  updated_at: string;
}

export interface DailyGoal {
  id: string;
  user_id: string;
  text: string;
  goal_type: GoalType;
  category: GoalCategory | null;
  is_ai_recommended: boolean;
  is_active: boolean;
  display_order: number;
  source_submission_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalRecommendation {
  id: string;
  user_id: string;
  submission_id: string | null;
  recommendations: RecommendedGoal[];
  context_snapshot: Record<string, unknown> | null;
  model_id: string | null;
  accepted_count: number;
  dismissed_count: number;
  created_at: string;
}

// ============================================
// Metadata Types (stored in JSONB)
// ============================================

export interface BaseQuestionMetadata {
  minItems?: number;
  maxItems?: number;
  minLength?: number;
  maxLength?: number;
}

export interface TagsMetadata extends BaseQuestionMetadata {
  suggestions?: string[];
}

export interface SelectMetadata extends BaseQuestionMetadata {
  options: { value: string; label: string }[];
}

export interface MultiselectMetadata extends BaseQuestionMetadata {
  options: { value: string; label: string }[];
}

export interface ScaleMetadata extends BaseQuestionMetadata {
  min?: number;
  max?: number;
  step?: number;
  labels?: { min: string; max: string };
}

export interface RankingMetadata extends BaseQuestionMetadata {
  items: { id: string; label: string }[];
}

export interface GoalsTimeframeMetadata {
  timeframes: {
    key: string;
    label: string;
    placeholder: string;
  }[];
}

export interface DailyGoalsMetadata {
  enableAiRecommendations: boolean;
  goalTypes: {
    key: GoalType;
    label: string;
    description: string;
    icon?: string;
  }[];
  categories: GoalCategory[];
}

export type QuestionMetadata =
  | TagsMetadata
  | SelectMetadata
  | MultiselectMetadata
  | ScaleMetadata
  | RankingMetadata
  | GoalsTimeframeMetadata
  | DailyGoalsMetadata
  | BaseQuestionMetadata;

// ============================================
// Response Value Types
// ============================================

export type ResponseValue =
  | string // text, textarea, date
  | string[] // tags, multiselect, ranking order
  | boolean // checkbox
  | number // scale
  | { value: string } // select
  | GoalsTimeframeValue // goals_timeframe
  | DailyGoalsValue; // daily_goals

export interface GoalsTimeframeValue {
  week: string;
  month: string;
  year: string;
  lifetime: string;
}

export interface DailyGoalValue {
  id: string;
  text: string;
  type: GoalType;
  category?: GoalCategory;
}

export interface DailyGoalsValue {
  goals: DailyGoalValue[];
}

// ============================================
// AI Recommendation Types
// ============================================

export interface RecommendedGoal {
  text: string;
  type: GoalType;
  category: GoalCategory;
  reason: string;
}

export interface RecommendationContext {
  proudTraits: string[];
  improvementTraits: string[];
  desiredTraits: string[];
  goals: GoalsTimeframeValue;
  existingDailyGoals: { text: string; type: GoalType }[];
}

// ============================================
// Composite Types (for API responses)
// ============================================

export interface SurveyWithQuestions extends Survey {
  questions: SurveyQuestion[];
}

export interface SubmissionWithResponses extends SurveySubmission {
  responses: Record<string, ResponseValue>; // questionId -> value
}

// ============================================
// Component Props Types
// ============================================

export interface QuestionProps<T extends ResponseValue = ResponseValue> {
  question: SurveyQuestion;
  value: T | undefined;
  onChange: (value: T) => void;
  error?: string;
}

// ============================================
// Re-take Survey Types
// ============================================

export interface RetakeSurveyOptions {
  mode: "fresh" | "add";
  sectionsToUpdate?: string[]; // question slugs
}
