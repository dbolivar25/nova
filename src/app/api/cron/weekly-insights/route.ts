/**
 * Weekly Insights Cron Job
 *
 * POST /api/cron/weekly-insights
 * Automated generation of weekly insights (runs weekly via Vercel Cron)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/shared/lib/supabase/server';
import { InsightsService } from '@/features/nova/services/insights-service';
import { startOfWeek, subDays } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServiceRoleClient();

    // Get all active users (journaled in past 2 weeks)
    const twoWeeksAgo = subDays(new Date(), 14);
    const { data: activeUsers } = await supabase
      .from('journal_entries')
      .select('user_id, users!inner(clerk_id, email)')
      .gte('entry_date', twoWeeksAgo.toISOString().split('T')[0])
      .order('user_id');

    if (!activeUsers || activeUsers.length === 0) {
      console.log('[Cron] No active users found');
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No active users',
      });
    }

    // Deduplicate users
    const uniqueUsers = Array.from(
      new Map(activeUsers.map((u) => [u.user_id, u])).values()
    );

    const lastWeekStart = startOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 });

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ userId: string; error: string }> = [];

    // Process each user
    for (const userData of uniqueUsers) {
      try {
        const user = userData.users as { clerk_id: string; email: string };
        const userId = user.clerk_id;
        const userEmail = user.email;

        // Check if already generated
        const exists = await InsightsService.hasInsightsForWeek(
          userId,
          lastWeekStart,
          { supabase }
        );

        if (exists) {
          console.log(`[Cron] Insights already exist for user ${userId}`);
          continue;
        }

        // Generate insights
        const insights = await InsightsService.generateWeeklyInsights(
          userId,
          userEmail,
          lastWeekStart,
          { supabase }
        );

        // Store insights
        await InsightsService.storeInsights(userId, insights);

        successCount++;
        console.log(`[Cron] Generated insights for user ${userId}`);
      } catch (error) {
        errorCount++;
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          userId: userData.user_id,
          error: errorMessage,
        });
        console.error(
          `[Cron] Failed to generate insights for user ${userData.user_id}:`,
          error
        );
      }
    }

    return NextResponse.json({
      success: true,
      processed: uniqueUsers.length,
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[Cron] Weekly insights error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
