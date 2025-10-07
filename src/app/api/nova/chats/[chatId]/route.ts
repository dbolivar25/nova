/**
 * Nova Chat Detail Endpoint
 *
 * GET /api/nova/chats/[chatId] - Get chat history
 * DELETE /api/nova/chats/[chatId] - Delete chat (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { NovaChatService } from '@/features/nova/services/nova-chat-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = await params;

    const messages = await NovaChatService.getChatHistory(
      chatId,
      userId
    );

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('[Nova Chat Detail] Error fetching chat:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = await params;

    await NovaChatService.deleteChat(chatId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Nova Chat Detail] Error deleting chat:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat' },
      { status: 500 }
    );
  }
}
