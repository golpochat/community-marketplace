'use client';

import type { ChatInboxItem } from '@community-marketplace/types';

import { ChatVerificationBadge } from '@/components/chat/chat-verification-badge';

interface ConversationListProps {
  items: ChatInboxItem[];
  activeThreadId?: string;
  onSelect: (threadId: string) => void;
}

function previewText(item: ChatInboxItem): string | undefined {
  return item.lastMessage?.content ?? item.thread.lastMessagePreview;
}

export function ConversationList({
  items,
  activeThreadId,
  onSelect,
}: ConversationListProps) {
  if (!items.length) {
    return (
      <p className="p-4 text-sm text-muted-foreground">No conversations yet.</p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((item) => {
        const preview = previewText(item);
        return (
          <li key={item.thread.id}>
            <button
              type="button"
              onClick={() => onSelect(item.thread.id)}
              className={`w-full px-4 py-3 text-left hover:bg-muted/50 ${
                activeThreadId === item.thread.id ? 'bg-brand-50' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-medium text-foreground">
                      {item.participant.displayName ?? 'User'}
                    </p>
                    <ChatVerificationBadge
                      verified={item.participant.verificationBadge}
                      role={item.participant.role}
                    />
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{item.listing.title}</p>
                  {preview && (
                    <p className="mt-1 truncate text-xs text-muted-foreground">{preview}</p>
                  )}
                  {item.thread.isBlocked && (
                    <p className="mt-0.5 text-xs text-destructive">Blocked</p>
                  )}
                </div>
                {item.unreadCount > 0 && (
                  <span className="shrink-0 rounded-full bg-brand-600 px-2 py-0.5 text-xs text-white">
                    {item.unreadCount}
                  </span>
                )}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
