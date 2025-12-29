import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/shared/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/surveys
 * List all active surveys
 */
export async function GET() {
  try {
    const supabase = await createServiceRoleClient();

    const { data: surveys, error } = await supabase
      .from("surveys")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching surveys:", error);
      return NextResponse.json(
        { error: "Failed to fetch surveys" },
        { status: 500 }
      );
    }

    return NextResponse.json({ surveys: surveys || [] });
  } catch (error) {
    console.error("Error in surveys API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
