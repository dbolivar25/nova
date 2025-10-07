/**
 * Insights Service
 *
 * Generates and manages weekly insights from journal entries
 */

import { createServerSupabaseClient, createServiceRoleClient } from '@/shared/lib/supabase/server';
import { b } from '@/integrations/baml_client';
import { NovaContextService } from './nova-context-service';
import type { WeeklyInsights } from '@/integrations/baml_client/types';
import type { Json } from '@/shared/lib/supabase/types';
import { startOfWeek, endOfWeek, format } from 'date-fns';

export class InsightsService {
  /**
   * Generate weekly insights for a user
   */
  static async generateWeeklyInsights(
    userId: string,
    userEmail: string,
    weekStart?: Date
  ): Promise<WeeklyInsights> {
    const supabase = await createServerSupabaseClient();

    // Default to current week if not specified
    const targetWeekStart = weekStart || startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
    const targetWeekEnd = endOfWeek(targetWeekStart, { weekStartsOn: 1 }); // Sunday

    const weekStartDate = format(targetWeekStart, 'yyyy-MM-dd');
    const weekEndDate = format(targetWeekEnd, 'yyyy-MM-dd');

    // Get user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    // Get entries for the week
    const { data: entries } = await supabase
      .from('journal_entries')
      .select(`
        *,
        prompt_responses (
          id,
          prompt_id,
          response_text,
          prompt:journal_prompts (
            id,
            prompt_text,
            category
          )
        )
      `)
      .eq('user_id', user.id)
      .gte('entry_date', weekStartDate)
      .lte('entry_date', weekEndDate)
      .order('entry_date', { ascending: true });

    if (!entries || entries.length === 0) {
      throw new Error('Not enough entries to generate insights');
    }

    // Build context for BAML
    const userContext = await NovaContextService.getUserJournalContext(userId, userEmail);
    const temporalContext = NovaContextService.getTemporalContext();

    // Convert entries to JournalEntryContext format
    const journalContext = entries.map((entry) => {
      const entryDate = new Date(entry.entry_date);
      const daysAgo = Math.floor((Date.now() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        type: 'JournalEntryContext' as const,
        entryDate: entry.entry_date,
        freeformText: entry.freeform_text || null,
        mood: entry.mood || null,
        wordCount: entry.word_count || 0,
        promptResponses: (entry.prompt_responses || []).map((pr) => ({
          promptText: pr.prompt?.prompt_text || '',
          responseText: pr.response_text || '',
          category: pr.prompt?.category || '',
        })),
        daysAgo,
      };
    });

    // Generate insights using BAML
    const insights = await b.GenerateWeeklyInsights(
      journalContext,
      userContext,
      temporalContext,
      weekStartDate,
      weekEndDate
    );

    return insights;
  }

  /**
   * Store insights in database
   */
  static async storeInsights(
    userId: string,
    insights: WeeklyInsights
  ): Promise<void> {
    const supabase = await createServiceRoleClient();

    // Get user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    // Store each insight type separately or as a combined JSON
    // For now, we'll store the complete insights object

    // Store emotional trends (cast to Json for Supabase)
    const { error: emotionalError } = await supabase
      .from('weekly_insights')
      .upsert({
        user_id: user.id,
        week_start_date: insights.weekStartDate,
        week_end_date: insights.weekEndDate,
        insight_type: 'emotional_trends' as const,
        insight_content: ({
          overallMood: insights.emotionalTrends.overallMood,
          summary: insights.emotionalTrends.summary,
          dominantEmotions: insights.emotionalTrends.dominantEmotions,
          keyMoments: insights.emotionalTrends.keyMoments,
        } satisfies Json),
      }, {
        onConflict: 'user_id,week_start_date,insight_type',
      });

    if (emotionalError) {
      console.error('Error storing emotional trends:', emotionalError);
      throw new Error(`Failed to store emotional trends: ${emotionalError.message}`);
    }

    // Store key themes
    const { error: themesError } = await supabase
      .from('weekly_insights')
      .upsert({
        user_id: user.id,
        week_start_date: insights.weekStartDate,
        week_end_date: insights.weekEndDate,
        insight_type: 'key_themes' as const,
        insight_content: ({
          themes: insights.keyThemes,
        } satisfies Json),
      }, {
        onConflict: 'user_id,week_start_date,insight_type',
      });

    if (themesError) {
      console.error('Error storing themes:', themesError);
      throw new Error(`Failed to store key themes: ${themesError.message}`);
    }

    // Store growth moments
    const { error: growthError } = await supabase
      .from('weekly_insights')
      .upsert({
        user_id: user.id,
        week_start_date: insights.weekStartDate,
        week_end_date: insights.weekEndDate,
        insight_type: 'growth_moments' as const,
        insight_content: ({
          moments: insights.growthMoments,
        } satisfies Json),
      }, {
        onConflict: 'user_id,week_start_date,insight_type',
      });

    if (growthError) {
      console.error('Error storing growth moments:', growthError);
      throw new Error(`Failed to store growth moments: ${growthError.message}`);
    }

    // Store patterns (week ahead suggestions)
    const { error: patternsError } = await supabase
      .from('weekly_insights')
      .upsert({
        user_id: user.id,
        week_start_date: insights.weekStartDate,
        week_end_date: insights.weekEndDate,
        insight_type: 'patterns' as const,
        insight_content: ({
          suggestions: insights.weekAheadSuggestions,
          novaObservation: insights.novaObservation,
        } satisfies Json),
      }, {
        onConflict: 'user_id,week_start_date,insight_type',
      });

    if (patternsError) {
      console.error('Error storing patterns:', patternsError);
      throw new Error(`Failed to store patterns: ${patternsError.message}`);
    }

    console.log(`[Insights] Successfully stored all insights for user ${userId}, week ${insights.weekStartDate}`);
  }

  /**
   * Get latest insights for user
   */
  static async getLatestInsights(userId: string): Promise<WeeklyInsights | null> {
    const supabase = await createServerSupabaseClient();

    // Get user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return null;
    }

    // Get all insight types for the latest week
    const { data: insights } = await supabase
      .from('weekly_insights')
      .select('*')
      .eq('user_id', user.id)
      .order('week_start_date', { ascending: false })
      .limit(4); // Get all 4 types for the latest week

    if (!insights || insights.length === 0) {
      return null;
    }

    // Group by week
    const latestWeek = insights[0].week_start_date;
    const weekInsights = insights.filter(i => i.week_start_date === latestWeek);

    // Reconstruct WeeklyInsights object (cast from Json)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emotionalTrends = weekInsights.find(i => i.insight_type === 'emotional_trends')?.insight_content as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const keyThemesData = weekInsights.find(i => i.insight_type === 'key_themes')?.insight_content as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const growthMomentsData = weekInsights.find(i => i.insight_type === 'growth_moments')?.insight_content as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patterns = weekInsights.find(i => i.insight_type === 'patterns')?.insight_content as any;

    const keyThemes = keyThemesData?.themes || [];
    const growthMoments = growthMomentsData?.moments || [];

    if (!emotionalTrends || !patterns) {
      return null;
    }

    // Count entries for this week
    const { count } = await supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('entry_date', insights[0].week_start_date)
      .lte('entry_date', insights[0].week_end_date);

    return {
      weekStartDate: insights[0].week_start_date,
      weekEndDate: insights[0].week_end_date,
      entryCount: count || 0,
      emotionalTrends,
      keyThemes,
      growthMoments,
      weekAheadSuggestions: patterns.suggestions || [],
      novaObservation: patterns.novaObservation || '',
    };
  }

  /**
   * Check if insights exist for a specific week
   */
  static async hasInsightsForWeek(
    userId: string,
    weekStart: Date
  ): Promise<boolean> {
    const supabase = await createServerSupabaseClient();

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return false;
    }

    const weekStartDate = format(weekStart, 'yyyy-MM-dd');

    const { data } = await supabase
      .from('weekly_insights')
      .select('id')
      .eq('user_id', user.id)
      .eq('week_start_date', weekStartDate)
      .limit(1);

    return (data?.length || 0) > 0;
  }
}
