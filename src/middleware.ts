import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/shared/lib/supabase/server";

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
      // Cookie missing - check database as source of truth (handles cookie-cleared scenarios)
      try {
        const supabase = await createServiceRoleClient();
        const { data: user } = await supabase
          .from("users")
          .select("onboarding_completed")
          .eq("clerk_id", userId)
          .single();

        if (user?.onboarding_completed) {
          const response = NextResponse.next();
          response.cookies.set("nova-onboarding-completed", "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 365,
          });
          return response;
        }
      } catch (error) {
        // Graceful degradation: redirect to onboarding rather than break the app
        console.error("Middleware: Failed to check onboarding status:", error);
      }

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
