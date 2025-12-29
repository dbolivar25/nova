/**
 * Nova Context Service
 *
 * Builds rich context for BAML functions from database state
 */

import { createServerSupabaseClient } from '@/shared/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/lib/supabase/types';
import type {
  JournalEntryContext,
  PromptResponseContext,
  TemporalContext,
  UserJournalContext,
  UserContext,
} from '@/integrations/baml_client/types';
import { differenceInDays, format, getWeek, getQuarter } from 'date-fns';

// ============================================
// Onboarding/Survey Context Types
// ============================================

export interface OnboardingSurveyContext {
  /** User's self-assessment: traits they're proud of */
  proudTraits: string[];
  /** User's self-assessment: traits they want to improve */
  improvementTraits: string[];
  /** User's self-assessment: traits they aspire to develop */
  desiredTraits: string[];
  /** User's goals at different timeframes */
  goals: {
    week?: string;
    month?: string;
    year?: string;
    lifetime?: string;
  };
  /** User's daily goals/habits */
  dailyGoals: {
    habitsToAdd: string[];
    habitsToRemove: string[];
    habitsToMinimize: string[];
  };
  /** Life satisfaction scale (1-10) */
  lifeSatisfaction?: number;
  /** Whether user has completed onboarding */
  hasCompletedOnboarding: boolean;
}

export class NovaContextService {
  /**
   * Build complete user journal context
   */
  static async getUserJournalContext(
    userId: string,
    userEmail: string,
    supabase?: SupabaseClient<Database>
  ): Promise<UserJournalContext> {
    const client =
      supabase ?? (await createServerSupabaseClient());

    // Get user from database
    const { data: user } = await client
      .from('users')
      .select('id, first_name, last_name')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    // Get user preferences
    const { data: preferences } = await client
      .from('user_preferences')
      .select('daily_reminder_enabled, prompt_count')
      .eq('user_id', user.id)
      .single();

    // Get basic stats from entries
    const { data: entries } = await client
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
    limit: number = 15,
    supabase?: SupabaseClient<Database>
  ): Promise<JournalEntryContext[]> {
    const client =
      supabase ?? (await createServerSupabaseClient());

    // Get user ID from Clerk ID
    const { data: user } = await client
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    // Get recent entries with prompt responses
    const { data: entries } = await client
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
    userEmail: string,
    supabase?: SupabaseClient<Database>
  ): Promise<UserContext> {
    const userInfo = await this.getUserJournalContext(userId, userEmail, supabase);

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
    limit: number = 15,
    supabase?: SupabaseClient<Database>
  ): Promise<JournalEntryContext[]> {
    // For now, just return recent entries
    // In future, could use semantic search based on message
    return this.getRelevantEntries(userId, limit, supabase);
  }

  /**
   * Build complete context for BAML chat function
   */
  static async buildChatContext(
    userId: string,
    userEmail: string,
    supabase?: SupabaseClient<Database>
  ) {
    const [userContext, journalContext] = await Promise.all([
      this.getUserJournalContext(userId, userEmail, supabase),
      this.getRelevantEntries(userId, 15, supabase),
    ]);

    const temporalContext = this.getTemporalContext();

    return {
      userContext,
      journalContext,
      temporalContext,
    };
  }

  /**
   * Get onboarding survey context - user's self-assessment data
   */
  static async getOnboardingSurveyContext(
    userId: string,
    supabase?: SupabaseClient<Database>
  ): Promise<OnboardingSurveyContext | null> {
    const client = supabase ?? (await createServerSupabaseClient());

    // Get user from database
    const { data: user } = await client
      .from('users')
      .select('id, onboarding_completed')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return null;
    }

    // Get the onboarding survey
    const { data: survey } = await client
      .from('surveys')
      .select('id')
      .eq('slug', 'onboarding')
      .single();

    if (!survey) {
      return {
        proudTraits: [],
        improvementTraits: [],
        desiredTraits: [],
        goals: {},
        dailyGoals: {
          habitsToAdd: [],
          habitsToRemove: [],
          habitsToMinimize: [],
        },
        hasCompletedOnboarding: user.onboarding_completed || false,
      };
    }

    // Get the user's most recent completed submission
    const { data: submission } = await client
      .from('user_survey_submissions')
      .select('id')
      .eq('user_id', user.id)
      .eq('survey_id', survey.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (!submission) {
      return {
        proudTraits: [],
        improvementTraits: [],
        desiredTraits: [],
        goals: {},
        dailyGoals: {
          habitsToAdd: [],
          habitsToRemove: [],
          habitsToMinimize: [],
        },
        hasCompletedOnboarding: user.onboarding_completed || false,
      };
    }

    // Get all responses with question slugs
    const { data: responses } = await client
      .from('user_survey_responses')
      .select(`
        response_value,
        survey_questions!inner(slug, question_type)
      `)
      .eq('submission_id', submission.id);

    // Parse responses into context
    const context: OnboardingSurveyContext = {
      proudTraits: [],
      improvementTraits: [],
      desiredTraits: [],
      goals: {},
      dailyGoals: {
        habitsToAdd: [],
        habitsToRemove: [],
        habitsToMinimize: [],
      },
      hasCompletedOnboarding: user.onboarding_completed || false,
    };

    if (responses) {
      for (const response of responses) {
        const question = response.survey_questions as { slug: string; question_type: string };
        const value = response.response_value;

        switch (question.slug) {
          case 'proud-traits':
            if (Array.isArray(value)) {
              context.proudTraits = value as string[];
            }
            break;

          case 'improvement-traits':
            if (Array.isArray(value)) {
              context.improvementTraits = value as string[];
            }
            break;

          case 'desired-traits':
            if (Array.isArray(value)) {
              context.desiredTraits = value as string[];
            }
            break;

          case 'life-satisfaction':
            if (typeof value === 'number') {
              context.lifeSatisfaction = value;
            }
            break;

          case 'goals-timeframe':
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              const goalsValue = value as { week?: string; month?: string; year?: string; lifetime?: string };
              context.goals = {
                week: goalsValue.week,
                month: goalsValue.month,
                year: goalsValue.year,
                lifetime: goalsValue.lifetime,
              };
            }
            break;

          case 'daily-goals':
            if (typeof value === 'object' && value !== null && 'goals' in value) {
              const goalsValue = value as { goals: Array<{ text: string; type: string }> };
              for (const goal of goalsValue.goals) {
                if (goal.type === 'add') {
                  context.dailyGoals.habitsToAdd.push(goal.text);
                } else if (goal.type === 'remove') {
                  context.dailyGoals.habitsToRemove.push(goal.text);
                } else if (goal.type === 'minimize') {
                  context.dailyGoals.habitsToMinimize.push(goal.text);
                }
              }
            }
            break;
        }
      }
    }

    // Also fetch active daily goals from user_daily_goals (may have been modified after onboarding)
    const { data: activeGoals } = await client
      .from('user_daily_goals')
      .select('text, goal_type')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (activeGoals && activeGoals.length > 0) {
      // Override with current active goals (more up-to-date than survey responses)
      context.dailyGoals = {
        habitsToAdd: activeGoals.filter((g) => g.goal_type === 'add').map((g) => g.text),
        habitsToRemove: activeGoals.filter((g) => g.goal_type === 'remove').map((g) => g.text),
        habitsToMinimize: activeGoals.filter((g) => g.goal_type === 'minimize').map((g) => g.text),
      };
    }

    return context;
  }
}
