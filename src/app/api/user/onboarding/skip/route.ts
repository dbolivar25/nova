import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceRoleClient } from "@/shared/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/user/onboarding/skip
 * Skip onboarding for now - user can complete later
 */
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServiceRoleClient();

    // Update user record to track they skipped (optional, for analytics)
    await supabase
      .from("users")
      .update({ onboarding_completed: false })
      .eq("clerk_id", userId);

    // Set cookie to allow access to app (with "skipped" value for tracking)
    const response = NextResponse.json({ success: true });
    response.cookies.set("nova-onboarding-completed", "skipped", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days (shorter than completed, will prompt again)
    });

    return response;
  } catch (error) {
    console.error("Error skipping onboarding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
