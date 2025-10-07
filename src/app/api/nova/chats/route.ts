/**
 * Nova Chats List Endpoint
 *
 * GET /api/nova/chats
 * List all chat threads for the user
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { NovaChatService } from '@/features/nova/services/nova-chat-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chats = await NovaChatService.listChats(userId);

    return NextResponse.json({ chats });
  } catch (error) {
    console.error('[Nova Chats] Error fetching chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}
