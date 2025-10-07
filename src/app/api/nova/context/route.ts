/**
 * Nova Context Endpoint
 *
 * GET /api/nova/context
 * Returns the context Nova can see (for transparency/debugging)
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { NovaContextService } from '@/features/nova/services/nova-context-service';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await auth();
    const userEmail = user.sessionClaims?.email as string || '';

    const context = await NovaContextService.buildChatContext(userId, userEmail);

    return NextResponse.json({
      userContext: context.userContext,
      journalContext: context.journalContext,
      temporalContext: context.temporalContext,
    });
  } catch (error) {
    console.error('[Nova Context] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch context' },
      { status: 500 }
    );
  }
}
