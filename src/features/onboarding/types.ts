export type GoalDirection = "increase" | "reduce";

export interface DailyGoal {
  id: string;
  text: string;
  direction: GoalDirection;
}

export interface SurveyResponses {
  name: string;
  proudOf: string;
  notProudOf: string;
  incorporate: string;
  horizonGoals: string;
  dailyGoals: DailyGoal[];
}

export interface SurveyState {
  responses: SurveyResponses;
  currentStep: number;
  lastUpdated: string;
  completedAt?: string;
}
