/**
 * Get Latest Weekly Insights Endpoint
 *
 * GET /api/insights/latest
 * Fetch the most recent weekly insights
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { InsightsService } from '@/lib/nova/services/insights-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const insights = await InsightsService.getLatestInsights(userId);

    if (!insights) {
      return NextResponse.json(
        {
          error: 'No insights found. Journal for a week to generate insights.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('[Insights Latest] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}
