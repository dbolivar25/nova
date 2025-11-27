import type { Metadata } from "next";
import { SurveyFlow } from "@/components/features/onboarding/survey-flow";
import { PageHeader } from "@/components/shared/layout/page-header";

export const metadata: Metadata = {
  title: "Personal Survey",
  description: "Capture the habits and goals that guide your Nova experience.",
};

export default function OnboardingSurveyPage() {
  return (
    <div className="max-w-5xl space-y-6">
        <PageHeader
          title="Personal survey"
          subtitle="A short, two-step check-in to understand what to celebrate, what to trim, and what you’re aiming for."
        />
      <SurveyFlow />
    </div>
  );
}
