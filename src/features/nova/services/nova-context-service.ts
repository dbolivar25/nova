/**
 * Nova Context Service
 *
 * Builds rich context for BAML functions from database state
 */

import { createServerSupabaseClient } from '@/shared/lib/supabase/server';
import type {
  JournalEntryContext,
  PromptResponseContext,
  TemporalContext,
  UserJournalContext,
  UserContext,
} from '@/integrations/baml_client/types';
import { differenceInDays, format, getWeek, getQuarter } from 'date-fns';

export class NovaContextService {
  /**
   * Build complete user journal context
   */
  static async getUserJournalContext(
    userId: string,
    userEmail: string
  ): Promise<UserJournalContext> {
    const supabase = await createServerSupabaseClient();

    // Get user from database
    const { data: user } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    // Get user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('daily_reminder_enabled, prompt_count')
      .eq('user_id', user.id)
      .single();

    // Get basic stats from entries
    const { data: entries } = await supabase
      .from('journal_entries')
      .select('id, word_count, entry_date')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false });

    const totalEntries = entries?.length || 0;
    const totalWords = entries?.reduce((sum, e) => sum + (e.word_count || 0), 0) || 0;
    const averageWordCount = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;

    // Calculate streaks (simple version - can be optimized)
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    if (entries && entries.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < entries.length; i++) {
        const entryDate = new Date(entries[i].entry_date);
        entryDate.setHours(0, 0, 0, 0);

        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - i);

        if (entryDate.getTime() === expectedDate.getTime()) {
          currentStreak++;
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          break;
        }
      }
    }

    return {
      type: 'UserJournalContext',
      userId: userId,
      email: userEmail,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User',

      totalEntries,
      currentStreak,
      longestStreak,
      averageWordCount,

      dailyReminderEnabled: preferences?.daily_reminder_enabled || false,
      promptCount: preferences?.prompt_count || 3,
    };
  }

  /**
   * Get relevant journal entries for context
   */
  static async getRelevantEntries(
    userId: string,
    limit: number = 15
  ): Promise<JournalEntryContext[]> {
    const supabase = await createServerSupabaseClient();

    // Get user ID from Clerk ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    // Get recent entries with prompt responses
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
      .order('entry_date', { ascending: false })
      .limit(limit);

    if (!entries) {
      return [];
    }

    const today = new Date();

    return entries.map((entry) => {
      const entryDate = new Date(entry.entry_date);
      const daysAgo = differenceInDays(today, entryDate);

      // Map prompt responses
      const promptResponses: PromptResponseContext[] = (entry.prompt_responses || []).map(
        (pr) => ({
          promptText: pr.prompt?.prompt_text || '',
          responseText: pr.response_text || '',
          category: pr.prompt?.category || '',
        })
      );

      return {
        type: 'JournalEntryContext',
        entryDate: entry.entry_date,
        freeformText: entry.freeform_text || null,
        mood: entry.mood || null,
        wordCount: entry.word_count || 0,
        promptResponses,
        daysAgo,
      };
    });
  }

  /**
   * Get temporal context - current time awareness
   */
  static getTemporalContext(now: Date = new Date(), timezone: string = 'UTC'): TemporalContext {
    const hour = now.getHours();
    let timeOfDay: string;

    if (hour < 6) timeOfDay = 'night';
    else if (hour < 12) timeOfDay = 'morning';
    else if (hour < 17) timeOfDay = 'afternoon';
    else if (hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';

    return {
      type: 'TemporalContext',
      currentTime: now.toISOString(),
      timezone,
      dayOfWeek: format(now, 'EEEE'),
      weekNumber: getWeek(now),
      quarter: `Q${getQuarter(now)} ${format(now, 'yyyy')}`,
      timeOfDay,
    };
  }

  /**
   * Build UserContext wrapper for BAML
   */
  static async buildUserContext(
    userId: string,
    userEmail: string
  ): Promise<UserContext> {
    const userInfo = await this.getUserJournalContext(userId, userEmail);

    return {
      type: 'UserContext',
      userInfo,
    };
  }

  /**
   * Build journal context (alias for getRelevantEntries)
   */
  static async buildJournalContext(
    userId: string,
    message: string,
    limit: number = 15
  ): Promise<JournalEntryContext[]> {
    // For now, just return recent entries
    // In future, could use semantic search based on message
    return this.getRelevantEntries(userId, limit);
  }

  /**
   * Build complete context for BAML chat function
   */
  static async buildChatContext(userId: string, userEmail: string) {
    const [userContext, journalContext] = await Promise.all([
      this.getUserJournalContext(userId, userEmail),
      this.getRelevantEntries(userId, 15),
    ]);

    const temporalContext = this.getTemporalContext();

    return {
      userContext,
      journalContext,
      temporalContext,
    };
  }
}
