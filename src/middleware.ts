import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/journal(.*)",
  "/nova(.*)",
  "/insights(.*)",
  "/profile(.*)",
  "/goals(.*)",
]);

const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, isAuthenticated } = await auth();

  // Redirect authenticated users from / to dashboard
  if (req.nextUrl.pathname === "/") {
    if (isAuthenticated) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Protect routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // Check onboarding status for protected routes (except onboarding itself)
  if (isProtectedRoute(req) && !isOnboardingRoute(req) && userId) {
    const onboardingCookie = req.cookies.get("nova-onboarding-completed")?.value;
    const onboardingHandled = onboardingCookie === "true" || onboardingCookie === "skipped";
    
    if (!onboardingHandled) {
      const url = req.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  // Protect onboarding route (users can revisit to edit their survey)
  if (isOnboardingRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
