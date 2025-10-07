/**
 * Generate Weekly Insights Endpoint
 *
 * POST /api/insights/generate
 * Manually trigger weekly insights generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { InsightsService } from '@/features/nova/services/insights-service';
import { startOfWeek } from 'date-fns';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await auth();
    const userEmail = user.sessionClaims?.email as string || '';

    // Optional: specify week (default to current week)
    const body = await req.json().catch(() => ({}));
    const weekStart = body.weekStart
      ? new Date(body.weekStart)
      : startOfWeek(new Date(), { weekStartsOn: 1 });

    // Check if already generated
    const exists = await InsightsService.hasInsightsForWeek(userId, weekStart);
    if (exists && !body.force) {
      return NextResponse.json(
        {
          error: 'Insights already exist for this week. Use force=true to regenerate.',
        },
        { status: 409 }
      );
    }

    // Generate insights
    const insights = await InsightsService.generateWeeklyInsights(
      userId,
      userEmail,
      weekStart
    );

    // Store insights
    await InsightsService.storeInsights(userId, insights);

    return NextResponse.json({
      success: true,
      insights,
    });
  } catch (error) {
    console.error('[Insights Generate] Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to generate insights',
      },
      { status: 500 }
    );
  }
}
