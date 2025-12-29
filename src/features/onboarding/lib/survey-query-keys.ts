export const surveyQueryKeys = {
  all: ["surveys"] as const,
  lists: () => [...surveyQueryKeys.all, "list"] as const,
  list: () => [...surveyQueryKeys.lists()] as const,
  details: () => [...surveyQueryKeys.all, "detail"] as const,
  detail: (slug: string) => [...surveyQueryKeys.details(), slug] as const,
  submissions: () => [...surveyQueryKeys.all, "submissions"] as const,
  submission: (slug: string) => [...surveyQueryKeys.submissions(), slug] as const,
  onboarding: () => [...surveyQueryKeys.all, "onboarding"] as const,
  recommendations: () => [...surveyQueryKeys.all, "recommendations"] as const,
};
