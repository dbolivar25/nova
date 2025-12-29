"use client";

import type { SurveyQuestion, ResponseValue } from "../types/survey";
import { TextQuestion } from "./questions/text-question";
import { TextareaQuestion } from "./questions/textarea-question";
import { TagsQuestion } from "./questions/tags-question";
import { SelectQuestion } from "./questions/select-question";
import { MultiselectQuestion } from "./questions/multiselect-question";
import { ScaleQuestion } from "./questions/scale-question";
import { CheckboxQuestion } from "./questions/checkbox-question";
import { DateQuestion } from "./questions/date-question";
import { RankingQuestion } from "./questions/ranking-question";
import { GoalsTimeframeQuestion } from "./questions/goals-timeframe-question";
import { DailyGoalsQuestion } from "./questions/daily-goals-question";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const QUESTION_COMPONENTS: Record<string, React.ComponentType<any>> = {
  text: TextQuestion,
  textarea: TextareaQuestion,
  tags: TagsQuestion,
  select: SelectQuestion,
  multiselect: MultiselectQuestion,
  scale: ScaleQuestion,
  checkbox: CheckboxQuestion,
  date: DateQuestion,
  ranking: RankingQuestion,
  goals_timeframe: GoalsTimeframeQuestion,
  daily_goals: DailyGoalsQuestion,
};

interface QuestionRendererProps {
  question: SurveyQuestion;
  value: ResponseValue | undefined;
  onChange: (value: ResponseValue) => void;
  error?: string;
  submissionId?: string;
}

export function QuestionRenderer({
  question,
  value,
  onChange,
  error,
  submissionId,
}: QuestionRendererProps) {
  const Component = QUESTION_COMPONENTS[question.question_type];

  if (!Component) {
    console.warn(`Unknown question type: ${question.question_type}`);
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Unknown question type: {question.question_type}
      </div>
    );
  }

  return (
    <Component
      question={question}
      value={value}
      onChange={onChange}
      error={error}
      submissionId={submissionId}
    />
  );
}
