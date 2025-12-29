import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/shared/lib/supabase/server";

export async function GET() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    // Check if user exists in our database
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("clerk_id", userId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 means no rows found, which is expected for new users
      console.error("Error fetching user:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch user" },
        { status: 500 }
      );
    }

    // If user doesn't exist, create them
    if (!existingUser) {
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          clerk_id: userId,
          email: user.emailAddresses[0]?.emailAddress || "",
          first_name: user.firstName,
          last_name: user.lastName,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating user:", createError);
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }

      // Create default preferences for the new user
      const { error: prefsError } = await supabase
        .from("user_preferences")
        .insert({
          user_id: newUser.id,
        });

      if (prefsError) {
        console.error("Error creating user preferences:", prefsError);
      }

      // New users haven't completed onboarding
      return NextResponse.json({ user: newUser });
    }

    // Set onboarding cookie if completed
    const createResponse = (userData: typeof existingUser) => {
      const response = NextResponse.json({ user: userData });
      if (userData.onboarding_completed) {
        response.cookies.set("nova-onboarding-completed", "true", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 365, // 1 year
        });
      }
      return response;
    };

    // Check if we need to update user info from Clerk
    const needsUpdate =
      existingUser.email !== user.emailAddresses[0]?.emailAddress ||
      existingUser.first_name !== user.firstName ||
      existingUser.last_name !== user.lastName;

    if (needsUpdate) {
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({
          email: user.emailAddresses[0]?.emailAddress || existingUser.email,
          first_name: user.firstName,
          last_name: user.lastName,
        })
        .eq("clerk_id", userId)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating user:", updateError);
        return NextResponse.json(
          { error: "Failed to update user" },
          { status: 500 }
        );
      }

      return createResponse(updatedUser);
    }

    return createResponse(existingUser);
  } catch (error) {
    console.error("Error in user API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}