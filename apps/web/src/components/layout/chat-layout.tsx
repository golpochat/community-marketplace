'use client';

import { cn } from '@community-marketplace/ui';

import { ConversationList } from '@/components/chat/conversation-list';
import { ChatWindow } from '@/components/chat/chat-window';
import type { ChatInboxItem, ChatMessage } from '@community-marketplace/types';

interface ChatLayoutProps {
  inbox: ChatInboxItem[];
  activeThreadId?: string;
  messages: ChatMessage[];
  currentUserId: string;
  typingLabel?: string;
  threadHeader?: React.ReactNode;
  onSelectThread: (threadId: string | undefined) => void;
  onSend: (content: string) => void;
  onTyping?: () => void;
}

export function ChatLayout({
  inbox,
  activeThreadId,
  messages,
  currentUserId,
  typingLabel,
  threadHeader,
  onSelectThread,
  onSend,
  onTyping,
}: ChatLayoutProps) {
  const showInbox = !activeThreadId;
  const showThread = Boolean(activeThreadId);

  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      <div
        className={cn(
          'overflow-hidden rounded-xl border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg))] shadow-sm',
          showInbox ? 'block' : 'hidden md:block',
        )}
      >
        <ConversationList
          items={inbox}
          activeThreadId={activeThreadId}
          onSelect={(threadId) => onSelectThread(threadId)}
        />
      </div>

      {showThread ? (
        <div className="flex min-h-[min(32rem,70vh)] flex-col overflow-hidden rounded-xl border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg))] shadow-sm md:min-h-[32rem]">
          <button
            type="button"
            className="flex items-center gap-1 border-b border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm font-medium text-[hsl(var(--dashboard-accent))] md:hidden"
            onClick={() => onSelectThread(undefined)}
          >
            <span aria-hidden>←</span>
            Conversations
          </button>
          <ChatWindow
            threadId={activeThreadId!}
            currentUserId={currentUserId}
            messages={messages}
            onSend={onSend}
            onTyping={onTyping}
            typingLabel={typingLabel}
            header={threadHeader}
          />
        </div>
      ) : (
        <div className="hidden h-[min(32rem,70vh)] items-center justify-center rounded-xl border border-dashed border-[hsl(var(--dashboard-sidebar-border))] text-sm text-[hsl(var(--dashboard-sidebar-muted))] md:flex md:h-[32rem]">
          Select a conversation
        </div>
      )}
    </div>
  );
}
