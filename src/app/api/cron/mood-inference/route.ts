/**
 * Daily Mood Inference Cron Job
 *
 * POST /api/cron/mood-inference
 * Automatically assigns mood tags to journal entries using BAML.
 */

import { NextRequest, NextResponse } from "next/server";
import { parseISO, subDays, format } from "date-fns";
import { MoodInferenceService } from "@/features/journal/services/mood-inference-service";

function resolveTargetDate(req: NextRequest): string {
  const searchDate = req.nextUrl.searchParams.get("date");
  if (searchDate) {
    try {
      return format(parseISO(searchDate), "yyyy-MM-dd");
    } catch {
      // ignore and fall back
    }
  }

  const fallback = subDays(new Date(), 1);
  return format(fallback, "yyyy-MM-dd");
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let targetDate = resolveTargetDate(req);

  try {
    const incoming = await req.json().catch(() => ({}));
    if (incoming?.date && typeof incoming.date === "string") {
      try {
        targetDate = format(parseISO(incoming.date), "yyyy-MM-dd");
      } catch {
        // ignore invalid body date
      }
    }
  } catch {
    // no body provided
  }

  try {
    const summary = await MoodInferenceService.runForDate(targetDate);
    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("[Cron] Mood inference error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
