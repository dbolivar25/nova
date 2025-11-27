"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { ArrowRight, CheckCircle2, ListChecks, Plus, Sparkles, Trash2, Undo2, UserRound } from "lucide-react";
import { Badge } from "@/components/shared/ui/badge";
import { Button } from "@/components/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { Progress } from "@/components/shared/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shared/ui/select";
import { Textarea } from "@/components/shared/ui/textarea";
import { cn } from "@/shared/lib/utils";
import { clearSurveyState, loadSurveyState, saveSurveyState } from "@/features/onboarding/storage";
import type { DailyGoal, GoalDirection, SurveyResponses } from "@/features/onboarding/types";

const defaultResponses: SurveyResponses = {
  name: "",
  proudOf: "",
  notProudOf: "",
  incorporate: "",
  horizonGoals: "",
  dailyGoals: [],
};

const steps = [
  {
    title: "Name & intention",
    description: "Ground the experience with how you'd like Nova to address you.",
  },
  {
    title: "Character survey",
    description: "Capture the traits, actions, and goals shaping your day-to-day.",
  },
  {
    title: "Summary",
    description: "Review everything you've shared and pick up where you left off.",
  },
];

export function SurveyFlow() {
  const { user } = useUser();

  const [responses, setResponses] = useState<SurveyResponses>(defaultResponses);
  const [currentStep, setCurrentStep] = useState(0);
  const [goalDraft, setGoalDraft] = useState("");
  const [goalDirection, setGoalDirection] = useState<GoalDirection>("increase");
  const [suggestions, setSuggestions] = useState<DailyGoal[]>([]);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const saved = loadSurveyState();
    if (saved) {
      setResponses(saved.responses);
      setCurrentStep(saved.currentStep ?? 0);
      setLastSaved(saved.lastUpdated);
    }
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated || responses.name) {
      return;
    }

    if (user?.fullName) {
      setResponses((prev) => ({ ...prev, name: prev.name || user.fullName }));
    } else if (user?.firstName) {
      setResponses((prev) => ({ ...prev, name: prev.name || user.firstName }));
    }
  }, [user, hasHydrated, responses.name]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const snapshot = {
      responses,
      currentStep,
      lastUpdated: new Date().toISOString(),
    };

    saveSurveyState(snapshot);
    setLastSaved(snapshot.lastUpdated);
  }, [responses, currentStep, hasHydrated]);

  const progressValue = useMemo(() => {
    if (steps.length <= 1) {
      return 0;
    }
    return (currentStep / (steps.length - 1)) * 100;
  }, [currentStep]);

  const handleResponseChange = (field: keyof SurveyResponses, value: string) => {
    setResponses((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddGoal = (goalText?: string, direction?: GoalDirection) => {
    const text = (goalText ?? goalDraft).trim();
    if (!text) {
      return;
    }

    const goal: DailyGoal = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      text,
      direction: direction ?? goalDirection,
    };

    setResponses((prev) => ({
      ...prev,
      dailyGoals: [...prev.dailyGoals, goal],
    }));

    if (!goalText) {
      setGoalDraft("");
    }
  };

  const handleRemoveGoal = (id: string) => {
    setResponses((prev) => ({
      ...prev,
      dailyGoals: prev.dailyGoals.filter((goal) => goal.id !== id),
    }));
  };

  const handleGenerateSuggestions = () => {
    const generated = generateGoalSuggestions(responses);
    setSuggestions(generated);
  };

  const handleReset = () => {
    setResponses(defaultResponses);
    setGoalDraft("");
    setSuggestions([]);
    setCurrentStep(0);
    setLastSaved(null);
    clearSurveyState();
  };

  const formattedSavedAt = useMemo(() => {
    if (!lastSaved) {
      return null;
    }
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(lastSaved));
  }, [lastSaved]);

  const nameStepValid = responses.name.trim().length > 0;

  return (
    <div className="space-y-6">
      <Card className="border-primary/10 bg-primary/5">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-primary">
              <ListChecks className="h-4 w-4" />
              <span>Personalized survey</span>
            </div>
            <CardTitle className="font-serif text-2xl">Set your baseline with Nova</CardTitle>
            <CardDescription>
              Capture what matters most today. Your answers stay local to this device while we refine the experience.
            </CardDescription>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Saved privately</p>
            {formattedSavedAt ? (
              <span>Updated {formattedSavedAt}</span>
            ) : (
              <span>No responses yet</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progressValue} className="h-2" />
          <div className="grid gap-3 sm:grid-cols-3">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isComplete = index < currentStep;
              return (
                <div
                  key={step.title}
                  className={cn(
                    "rounded-xl border p-4",
                    isActive
                      ? "border-primary/40 bg-primary/10"
                      : isComplete
                        ? "border-border/60 bg-muted/40"
                        : "border-border/50"
                  )}
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border text-xs">
                        {index + 1}
                      </span>
                    )}
                    <span className={cn(isActive ? "text-primary" : "text-foreground")}>{step.title}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-primary" />
              Who are we supporting?
            </CardTitle>
            <CardDescription>Share your name and the intention behind this check-in.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preferred-name">Preferred name</Label>
              <Input
                id="preferred-name"
                value={responses.name}
                onChange={(event) => handleResponseChange("name", event.target.value)}
                placeholder="How should Nova address you?"
              />
              <p className="text-sm text-muted-foreground">
                This helps us keep the prompts grounded and personal.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Saved locally</Badge>
              <Badge variant="outline">No database changes</Badge>
            </div>

            <div className="flex items-center gap-3">
              <Button
                size="lg"
                onClick={() => setCurrentStep(1)}
                disabled={!nameStepValid}
                className="gap-2"
              >
                Continue to survey
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" onClick={handleReset} className="gap-2">
                <Undo2 className="h-4 w-4" />
                Reset responses
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Character & actions</CardTitle>
              <CardDescription>Reflect on what feels aligned and where you want to shift.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  key: "proudOf",
                  label: "What actions or character traits are you currently proud of?",
                  placeholder: "Examples: staying calm during conflict, following through on plans, showing up for friends...",
                },
                {
                  key: "notProudOf",
                  label: "What actions or character traits are you currently not proud of?",
                  placeholder: "Examples: procrastinating, short temper when tired, ignoring boundaries...",
                },
                {
                  key: "incorporate",
                  label: "What actions or character traits do you want to incorporate into your life?",
                  placeholder: "Examples: patient listening, daily reading, asking for help, leading with empathy...",
                },
              ].map((question) => (
                <div key={question.key} className="space-y-2">
                  <Label>{question.label}</Label>
                  <Textarea
                    value={responses[question.key as keyof SurveyResponses] as string}
                    onChange={(event) => handleResponseChange(question.key as keyof SurveyResponses, event.target.value)}
                    placeholder={question.placeholder}
                    className="min-h-[110px]"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Goals across time</CardTitle>
              <CardDescription>
                Map the next week, month, year, and lifetime so we can recommend the right daily focus.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>What goals do you have for the next week, month, year, and lifetime?</Label>
                <Textarea
                  value={responses.horizonGoals}
                  onChange={(event) => handleResponseChange("horizonGoals", event.target.value)}
                  placeholder="List short-term and long-term goals. Example: This week: finish draft. This month: rebuild morning routine. This year: deepen relationships. Lifetime: stay curious."
                  className="min-h-[120px]"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Daily goals & habits</CardTitle>
                <CardDescription>
                  List what to lean into and what to minimize. We can suggest ideas based on your answers.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleGenerateSuggestions}>
                <Sparkles className="h-4 w-4" />
                Get AI-inspired recommendations
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="daily-goal">Add a daily goal or habit</Label>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                  <Input
                    id="daily-goal"
                    value={goalDraft}
                    onChange={(event) => setGoalDraft(event.target.value)}
                    placeholder="Example: 10-minute reflection before bed"
                  />
                  <Select value={goalDirection} onValueChange={(value) => setGoalDirection(value as GoalDirection)}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Focus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="increase">Lean into</SelectItem>
                      <SelectItem value="reduce">Reduce or minimize</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="gap-2" onClick={() => handleAddGoal()}>
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  The list can include things to stop or reduce—not just new habits to adopt.
                </p>
              </div>

              {suggestions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>Suggested daily goals</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {suggestions.map((goal) => (
                      <div
                        key={goal.id}
                        className="flex items-start justify-between rounded-lg border border-border/60 bg-muted/30 p-3"
                      >
                        <div className="space-y-1 pr-3">
                          <p className="font-medium text-foreground">{goal.text}</p>
                          <p className="text-xs text-muted-foreground">
                            {goal.direction === "reduce" ? "Dial back or replace" : "Strengthen or repeat"}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAddGoal(goal.text, goal.direction)}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {responses.dailyGoals.length > 0 && (
                <div className="space-y-2">
                  <Label>Current daily goals</Label>
                  <div className="space-y-2">
                    {responses.dailyGoals.map((goal) => (
                      <div
                        key={goal.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 bg-card/60 p-3"
                      >
                        <div className="space-y-1 pr-4">
                          <p className="font-medium leading-tight">{goal.text}</p>
                          <p className="text-xs text-muted-foreground">
                            {goal.direction === "reduce" ? "Plan to reduce or replace" : "Plan to practice daily"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={goal.direction === "reduce" ? "outline" : "secondary"}>
                            {goal.direction === "reduce" ? "Minimize" : "Lean into"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveGoal(goal.id)}
                            className="text-muted-foreground hover:text-destructive"
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
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" onClick={() => setCurrentStep(0)} className="gap-2">
              <Undo2 className="h-4 w-4" />
              Back to name
            </Button>
            <Button size="lg" className="gap-2" onClick={() => setCurrentStep(2)}>
              Review summary
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Everything stays saved locally so you can revisit or adjust anytime.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <SummaryBlock title="Your name">{responses.name || "Not provided"}</SummaryBlock>
                <SummaryBlock title="Proud of">{responses.proudOf || "No notes yet"}</SummaryBlock>
                <SummaryBlock title="Not proud of">{responses.notProudOf || "No notes yet"}</SummaryBlock>
                <SummaryBlock title="Traits to incorporate">{responses.incorporate || "No notes yet"}</SummaryBlock>
              </div>

              <SummaryBlock title="Goals by horizon">{responses.horizonGoals || "Not captured yet."}</SummaryBlock>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Daily goals list</h3>
                </div>
                {responses.dailyGoals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No daily goals captured yet.</p>
                ) : (
                  <div className="grid gap-2 md:grid-cols-2">
                    {responses.dailyGoals.map((goal) => (
                      <div
                        key={goal.id}
                        className="rounded-lg border border-border/60 bg-card/60 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium leading-tight">{goal.text}</p>
                            <p className="text-xs text-muted-foreground">
                              {goal.direction === "reduce" ? "Reduce or replace" : "Lean into"}
                            </p>
                          </div>
                          <Badge variant={goal.direction === "reduce" ? "outline" : "secondary"}>
                            {goal.direction === "reduce" ? "Minimize" : "Practice"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary">Saved in browser</Badge>
                  {formattedSavedAt && <span>Last saved {formattedSavedAt}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => setCurrentStep(1)} className="gap-2">
                    <Undo2 className="h-4 w-4" />
                    Edit survey
                  </Button>
                  <Button asChild className="gap-2">
                    <Link href="/dashboard">
                      Return to dashboard
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function SummaryBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{children}</p>
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
    addIdea(`Practice ${responses.incorporate.split(" ").slice(0, 4).join(" ")} for 10 minutes daily`, "increase");
  }

  if (responses.proudOf) {
    addIdea("Keep a nightly note of moments you felt proud to reinforce them", "increase");
  }

  if (responses.notProudOf) {
    addIdea("Set a 3-minute pause before reacting in tough moments", "reduce");
    addIdea("Swap one unhelpful habit for a grounding breath routine", "reduce");
  }

  if (responses.horizonGoals) {
    addIdea("Block 20 focused minutes toward your weekly goal", "increase");
    addIdea("Capture one learning from today for your long-term vision", "increase");
  }

  if (ideas.length === 0) {
    addIdea("Take a 5-minute reflection walk each day", "increase");
    addIdea("Limit doomscrolling windows to 10 minutes", "reduce");
  }

  const unique = new Map<string, DailyGoal>();
  ideas.forEach((idea) => {
    if (!unique.has(idea.text)) {
      unique.set(idea.text, idea);
    }
  });

  return Array.from(unique.values()).slice(0, 6);
}
