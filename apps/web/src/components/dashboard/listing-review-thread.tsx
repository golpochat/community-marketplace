'use client';

import { useState } from 'react';

import type { ListingReviewMessage } from '@community-marketplace/types';
import { Button } from '@community-marketplace/ui';

function senderLabel(message: ListingReviewMessage): string {
  if (message.senderName) return message.senderName;
  if (message.senderRole === 'ADMIN' || message.senderRole === 'SUPER_ADMIN') return 'Admin';
  return 'Seller';
}

interface ListingReviewThreadProps {
  messages: ListingReviewMessage[];
  currentUserId?: string;
  onSend: (content: string) => Promise<void>;
  sendLabel?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function ListingReviewThread({
  messages,
  currentUserId,
  onSend,
  sendLabel = 'Send message',
  placeholder = 'Write a message…',
  disabled = false,
}: ListingReviewThreadProps) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    const trimmed = content.trim();
    if (!trimmed || sending || disabled) return;
    setSending(true);
    setError(null);
    try {
      await onSend(trimmed);
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="max-h-56 space-y-3 overflow-y-auto rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-sidebar-active)/0.35)] p-3">
        {messages.length === 0 ? (
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">No review messages yet.</p>
        ) : (
          messages.map((message) => {
            const isMine = currentUserId ? message.senderId === currentUserId : false;
            return (
              <div
                key={message.id}
                className={`rounded-lg px-3 py-2 text-sm ${
                  isMine ? 'ml-8 bg-blue-100 text-blue-950' : 'mr-8 bg-[hsl(var(--dashboard-topbar-bg))] text-[hsl(var(--dashboard-main-fg))]'
                }`}
              >
                <p className="text-xs font-medium text-[hsl(var(--dashboard-sidebar-muted))]">
                  {senderLabel(message)} · {new Date(message.createdAt).toLocaleString()}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{message.content}</p>
              </div>
            );
          })
        )}
      </div>

      <div className="space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={3}
          disabled={disabled || sending}
          className="w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm disabled:opacity-50"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="button" size="sm" disabled={disabled || sending || !content.trim()} onClick={() => void handleSend()}>
          {sending ? 'Sending…' : sendLabel}
        </Button>
      </div>
    </div>
  );
}
