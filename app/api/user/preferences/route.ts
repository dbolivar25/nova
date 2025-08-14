import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

// Schema for user preferences
const preferencesSchema = z.object({
  daily_reminder_enabled: z.boolean().optional(),
  reminder_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
    .optional(),
  prompt_count: z.number().min(1).max(5).optional(),
});

// GET /api/user/preferences - Get user preferences
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    // Get user from our database
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user preferences
    const { data: preferences, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No preferences found, create default ones
        const { data: newPreferences, error: createError } = await supabase
          .from("user_preferences")
          .insert({
            user_id: user.id,
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating default preferences:", createError);
          return NextResponse.json(
            { error: "Failed to create preferences" },
            { status: 500 }
          );
        }

        return NextResponse.json({ preferences: newPreferences });
      }

      console.error("Error fetching preferences:", error);
      return NextResponse.json(
        { error: "Failed to fetch preferences" },
        { status: 500 }
      );
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Error in preferences API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/user/preferences - Update user preferences
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = preferencesSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validationResult.error },
        { status: 400 }
      );
    }

    const updates = validationResult.data;

    const supabase = await createServerSupabaseClient();

    // Get user from our database
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update preferences
    const { data: preferences, error } = await supabase
      .from("user_preferences")
      .update(updates)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No preferences exist, create them with the updates
        const { data: newPreferences, error: createError } = await supabase
          .from("user_preferences")
          .insert({
            user_id: user.id,
            ...updates,
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating preferences:", createError);
          return NextResponse.json(
            { error: "Failed to create preferences" },
            { status: 500 }
          );
        }

        return NextResponse.json({ preferences: newPreferences });
      }

      console.error("Error updating preferences:", error);
      return NextResponse.json(
        { error: "Failed to update preferences" },
        { status: 500 }
      );
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Error in preferences update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}