import type { SurveyState } from "./types";

export const SURVEY_STORAGE_KEY = "nova-onboarding-survey-v1";

export function loadSurveyState(): SurveyState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(SURVEY_STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as SurveyState;
  } catch (error) {
    console.error("Failed to parse survey state", error);
    return null;
  }
}

export function saveSurveyState(state: SurveyState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save survey state", error);
  }
}

export function clearSurveyState() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(SURVEY_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear survey state", error);
  }
}
