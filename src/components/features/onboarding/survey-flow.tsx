"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ArrowRight, CheckCircle2, ListChecks, Sparkles, Trash2, Undo2 } from "lucide-react";
import { Badge } from "@/components/shared/ui/badge";
import { Button } from "@/components/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/shared/ui/dialog";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { Progress } from "@/components/shared/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shared/ui/select";
import { Textarea } from "@/components/shared/ui/textarea";
import { clearSurveyState, loadSurveyState, saveSurveyState } from "@/features/onboarding/storage";
import type { DailyGoal, GoalDirection, SurveyResponses, SurveyState } from "@/features/onboarding/types";

const defaultResponses: SurveyResponses = {
  name: "",
  proudOf: "",
  notProudOf: "",
  incorporate: "",
  horizonGoals: "",
  dailyGoals: [],
};

const defaultState: SurveyState = {
  responses: defaultResponses,
  currentStep: 0,
  lastUpdated: new Date().toISOString(),
};

function normalizeState(state: SurveyState | null | undefined): SurveyState {
  if (!state) {
    return defaultState;
  }

  return {
    ...defaultState,
    ...state,
    responses: {
      ...defaultResponses,
      ...state.responses,
    },
    lastUpdated: state.lastUpdated ?? defaultState.lastUpdated,
    completedAt: state.completedAt,
  };
}

const steps = [
  {
    title: "Welcome",
    description: "Share your name so we can greet you properly.",
  },
  {
    title: "Celebrate",
    description: "Capture what you’re proud of.",
  },
  {
    title: "Adjust",
    description: "Note what you want to change.",
  },
  {
    title: "Incorporate",
    description: "Traits or actions to add.",
  },
  {
    title: "Horizon",
    description: "Goals across time.",
  },
  {
    title: "Habits",
    description: "Daily goals to lean into or reduce.",
  },
  {
    title: "Finish",
    description: "Review and confirm.",
  },
];

interface SurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialState?: SurveyState | null;
  onComplete?: (state: SurveyState) => void;
}

export function SurveyDialog({ open, onOpenChange, initialState, onComplete }: SurveyDialogProps) {
  const { user } = useUser();

  const [state, setState] = useState<SurveyState>(() => normalizeState(initialState ?? loadSurveyState()));
  const [hydrated, setHydrated] = useState(false);
  const [goalDraft, setGoalDraft] = useState("");
  const [goalDirection, setGoalDirection] = useState<GoalDirection>("increase");
  const [suggestions, setSuggestions] = useState<DailyGoal[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const saved = normalizeState(initialState ?? loadSurveyState());
    setState(saved);
    setHydrated(true);
  }, [initialState, open]);

  useEffect(() => {
    if (!hydrated || state.responses.name) {
      return;
    }

    const candidateName = user?.fullName ?? user?.firstName;
    if (candidateName) {
      setState((prev) => updateLastUpdated({
        ...prev,
        responses: { ...prev.responses, name: candidateName },
      }));
    }
  }, [user, hydrated, state.responses.name]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    saveSurveyState(state);
  }, [state, hydrated]);

  const handleResponseChange = (field: keyof SurveyResponses, value: string) => {
    setState((prev) => updateLastUpdated({
      ...prev,
      responses: {
        ...prev.responses,
        [field]: value,
      },
    }));
  };

  const handleAddGoal = (goalText?: string, direction?: GoalDirection) => {
    const text = (goalText ?? goalDraft).trim();
    if (!text) return;

    const goal: DailyGoal = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      text,
      direction: direction ?? goalDirection,
    };

    setState((prev) => updateLastUpdated({
      ...prev,
      responses: {
        ...prev.responses,
        dailyGoals: [...prev.responses.dailyGoals, goal],
      },
    }));

    if (!goalText) {
      setGoalDraft("");
    }
  };

  const handleRemoveGoal = (id: string) => {
    setState((prev) => updateLastUpdated({
      ...prev,
      responses: {
        ...prev.responses,
        dailyGoals: prev.responses.dailyGoals.filter((goal) => goal.id !== id),
      },
    }));
  };

  const handleGenerateSuggestions = () => {
    setSuggestions(generateGoalSuggestions(state.responses));
  };

  const handleReset = () => {
    setState({ ...defaultState, lastUpdated: new Date().toISOString() });
    setGoalDraft("");
    setGoalDirection("increase");
    setSuggestions([]);
    clearSurveyState();
  };

  const handleComplete = () => {
    setState((prev) => {
      const completedState = updateLastUpdated({
        ...prev,
        completedAt: prev.completedAt ?? new Date().toISOString(),
        currentStep: steps.length - 1,
      });
      onComplete?.(completedState);
      return completedState;
    });
    onOpenChange(false);
  };

  const formattedSavedAt = useMemo(() => {
    if (!state.lastUpdated) return null;
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(state.lastUpdated)
    );
  }, [state.lastUpdated]);

  const progress = useMemo(() => {
    if (steps.length <= 1) return 0;
    return (state.currentStep / (steps.length - 1)) * 100;
  }, [state.currentStep]);

  const nameValid = state.responses.name.trim().length > 0;
  const proudValid = state.responses.proudOf.trim().length > 0;
  const notProudValid = state.responses.notProudOf.trim().length > 0;
  const incorporateValid = state.responses.incorporate.trim().length > 0;
  const horizonValid = state.responses.horizonGoals.trim().length > 0;

  const stepIsValid = useMemo(() => {
    switch (state.currentStep) {
      case 0:
        return nameValid;
      case 1:
        return proudValid;
      case 2:
        return notProudValid;
      case 3:
        return incorporateValid;
      case 4:
        return horizonValid;
      default:
        return true;
    }
  }, [state.currentStep, nameValid, proudValid, notProudValid, incorporateValid, horizonValid]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ListChecks className="h-5 w-5 text-primary" />
            Personalize Nova
          </DialogTitle>
          <DialogDescription>
            A quick, one-time survey to tune prompts to your priorities. Everything stays in your browser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Step {state.currentStep + 1} of {steps.length}</p>
                <div className="text-sm font-semibold leading-tight">{steps[state.currentStep]?.title}</div>
                <p className="text-sm text-muted-foreground">{steps[state.currentStep]?.description}</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                {formattedSavedAt ? `Saved ${formattedSavedAt}` : "Local only"}
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="max-h-[60vh] overflow-y-auto pr-1">
            {state.currentStep === 0 && (
              <div className="space-y-4 py-1">
                <div className="space-y-2">
                  <Label htmlFor="preferred-name">Preferred name</Label>
                  <Input
                    id="preferred-name"
                    value={state.responses.name}
                    onChange={(event) => handleResponseChange("name", event.target.value)}
                    placeholder="What should we call you?"
                  />
                  <p className="text-sm text-muted-foreground">We’ll use this greeting across the app.</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">One-time setup</Badge>
                  <Badge variant="secondary">Takes under 2 minutes</Badge>
                </div>
              </div>
            )}

            {state.currentStep === 1 && (
              <div className="space-y-4 py-1">
                <QuestionBlock
                  label="What actions or character traits are you currently proud of?"
                  placeholder="Examples: keeping calm in tough conversations, following through on plans, making time for friends..."
                  value={state.responses.proudOf}
                  onChange={(value) => handleResponseChange("proudOf", value)}
                />
              </div>
            )}

            {state.currentStep === 2 && (
              <div className="space-y-4 py-1">
                <QuestionBlock
                  label="What actions or character traits are you currently not proud of?"
                  placeholder="Examples: procrastinating, doomscrolling at night, snapping when stressed..."
                  value={state.responses.notProudOf}
                  onChange={(value) => handleResponseChange("notProudOf", value)}
                />
              </div>
            )}

            {state.currentStep === 3 && (
              <div className="space-y-4 py-1">
                <QuestionBlock
                  label="What actions or character traits do you want to incorporate into your life?"
                  placeholder="Examples: patient listening, daily reading, moving your body, asking for help..."
                  value={state.responses.incorporate}
                  onChange={(value) => handleResponseChange("incorporate", value)}
                />
              </div>
            )}

            {state.currentStep === 4 && (
              <div className="space-y-4 py-1">
                <QuestionBlock
                  label="Goals across the week, month, year, and lifetime"
                  placeholder="Week: finish a draft. Month: rebuild morning routine. Year: deepen relationships. Lifetime: stay curious."
                  value={state.responses.horizonGoals}
                  onChange={(value) => handleResponseChange("horizonGoals", value)}
                />
              </div>
            )}

            {state.currentStep === 5 && (
              <div className="space-y-6 py-1">
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Label className="text-sm font-semibold">Daily goals & habits</Label>
                      <p className="text-xs text-muted-foreground">Include what to reduce—not just add.</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2" onClick={handleGenerateSuggestions}>
                      <Sparkles className="h-4 w-4" />
                      Suggest ideas
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                    <Input
                      value={goalDraft}
                      onChange={(event) => setGoalDraft(event.target.value)}
                      placeholder="Ex: 10-minute reflection before bed"
                    />
                    <Select value={goalDirection} onValueChange={(value) => setGoalDirection(value as GoalDirection)}>
                      <SelectTrigger className="w-full sm:w-[170px]">
                        <SelectValue placeholder="Focus" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="increase">Lean into</SelectItem>
                        <SelectItem value="reduce">Reduce or replace</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button className="gap-2" onClick={() => handleAddGoal()}>
                      Add
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {suggestions.length > 0 && (
                    <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Quick picks
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        {suggestions.map((goal) => (
                          <button
                            type="button"
                            key={goal.id}
                            className="flex items-center justify-between rounded-md border border-border/50 bg-card/60 p-3 text-left transition hover:border-primary/40"
                            onClick={() => handleAddGoal(goal.text, goal.direction)}
                          >
                            <div>
                              <p className="text-sm font-medium">{goal.text}</p>
                              <p className="text-xs text-muted-foreground">
                                {goal.direction === "reduce" ? "Minimize" : "Practice daily"}
                              </p>
                            </div>
                            <Badge variant={goal.direction === "reduce" ? "outline" : "secondary"}>
                              {goal.direction === "reduce" ? "Reduce" : "Increase"}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {state.responses.dailyGoals.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Your list</Label>
                      <div className="space-y-2">
                        {state.responses.dailyGoals.map((goal) => (
                          <div
                            key={goal.id}
                            className="flex items-center justify-between rounded-lg border border-border/60 bg-card/50 p-3"
                          >
                            <div className="space-y-1 pr-3">
                              <p className="text-sm font-medium leading-tight">{goal.text}</p>
                              <p className="text-xs text-muted-foreground">
                                {goal.direction === "reduce" ? "Reduce or replace" : "Lean into daily"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={goal.direction === "reduce" ? "outline" : "secondary"}>
                                {goal.direction === "reduce" ? "Reduce" : "Grow"}
                              </Badge>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemoveGoal(goal.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Remove goal</span>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {state.currentStep === 6 && (
              <div className="space-y-4 py-1 text-sm">
                <SummaryRow label="Preferred name" value={state.responses.name || "Not set"} />
                <SummaryRow label="Proud of" value={state.responses.proudOf || "No notes yet"} />
                <SummaryRow label="Not proud of" value={state.responses.notProudOf || "No notes yet"} />
                <SummaryRow label="Traits to incorporate" value={state.responses.incorporate || "No notes yet"} />
                <SummaryRow label="Goals across time" value={state.responses.horizonGoals || "No horizon goals listed"} />
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Daily goals</p>
                  {state.responses.dailyGoals.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border/60 bg-muted/30 p-3 text-muted-foreground">
                      Nothing listed yet.
                    </p>
                  ) : (
                    <div className="grid gap-2 md:grid-cols-2">
                      {state.responses.dailyGoals.map((goal) => (
                        <div
                          key={goal.id}
                          className="rounded-lg border border-border/60 bg-card/50 p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold leading-tight">{goal.text}</p>
                              <p className="text-xs text-muted-foreground">
                                {goal.direction === "reduce" ? "Reduce or replace" : "Practice"}
                              </p>
                            </div>
                            <Badge variant={goal.direction === "reduce" ? "outline" : "secondary"}>
                              {goal.direction === "reduce" ? "Reduce" : "Increase"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">Local storage</Badge>
              <Badge variant="outline">No DB writes</Badge>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                onClick={handleReset}
              >
                <Undo2 className="h-3.5 w-3.5" /> Reset responses
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    currentStep: Math.max(prev.currentStep - 1, 0),
                  }))
                }
                disabled={state.currentStep === 0}
              >
                Back
              </Button>
              {state.currentStep < steps.length - 1 ? (
                <Button
                  className="gap-2"
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      currentStep: Math.min(prev.currentStep + 1, steps.length - 1),
                    }))
                  }
                  disabled={!stepIsValid}
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button className="gap-2" onClick={handleComplete}>
                  Finish setup
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 rounded-md border border-border/60 bg-muted/30 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function QuestionBlock({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">{label}</Label>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-[120px]"
      />
    </div>
  );
}

function generateGoalSuggestions(responses: SurveyResponses): DailyGoal[] {
  const ideas: DailyGoal[] = [];
  const addIdea = (text: string, direction: GoalDirection) => {
    ideas.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      text,
      direction,
    });
  };

  if (responses.incorporate) {
    addIdea(`Practice ${responses.incorporate.split(" ").slice(0, 5).join(" ")} for 10 minutes`, "increase");
  }

  if (responses.proudOf) {
    addIdea("Capture one proud moment nightly to reinforce it", "increase");
  }

  if (responses.notProudOf) {
    addIdea("Add a 3-minute pause before reacting in tough moments", "reduce");
    addIdea("Replace doomscrolling with a short stretch", "reduce");
  }

  if (responses.horizonGoals) {
    addIdea("Spend 20 focused minutes on your weekly goal", "increase");
  }

  if (ideas.length === 0) {
    addIdea("Take a 5-minute reflection walk", "increase");
    addIdea("Keep screens away for the first 30 minutes after waking", "reduce");
  }

  const unique = new Map<string, DailyGoal>();
  ideas.forEach((idea) => {
    if (!unique.has(idea.text)) {
      unique.set(idea.text, idea);
    }
  });

  return Array.from(unique.values()).slice(0, 6);
}

function updateLastUpdated(next: SurveyState): SurveyState {
  return {
    ...next,
    lastUpdated: new Date().toISOString(),
  };
}
