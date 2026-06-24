'use client';

import type { ChatInboxItem } from '@community-marketplace/types';

interface ConversationListProps {
  items: ChatInboxItem[];
  activeThreadId?: string;
  onSelect: (threadId: string) => void;
}

export function ConversationList({
  items,
  activeThreadId,
  onSelect,
}: ConversationListProps) {
  if (!items.length) {
    return (
      <p className="p-4 text-sm text-gray-500">No conversations yet.</p>
    );
  }

  return (
    <ul className="divide-y divide-gray-200">
      {items.map((item) => (
        <li key={item.thread.id}>
          <button
            type="button"
            onClick={() => onSelect(item.thread.id)}
            className={`w-full px-4 py-3 text-left hover:bg-gray-50 ${
              activeThreadId === item.thread.id ? 'bg-brand-50' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {item.participant.displayName ?? 'User'}
                  {item.participant.verificationBadge ? ' ✓' : ''}
                </p>
                <p className="text-xs text-gray-500">{item.listing.title}</p>
                {item.lastMessage && (
                  <p className="mt-1 truncate text-xs text-gray-600">
                    {item.lastMessage.content}
                  </p>
                )}
              </div>
              {item.unreadCount > 0 && (
                <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs text-white">
                  {item.unreadCount}
                </span>
              )}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
