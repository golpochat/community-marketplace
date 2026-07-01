'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { ChatMessage } from '@community-marketplace/types';
import type { ChatInboxItem, ChatListingPreview, ChatParticipantPreview } from '@community-marketplace/types';
import { cn } from '@community-marketplace/ui';

import { ChatVerificationBadge } from '@/components/chat/chat-verification-badge';
import { ListingPreviewInChat } from '@/components/chat/listing-preview-in-chat';
import { MessageBubble } from '@/components/chat/message-bubble';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import { Button } from '@community-marketplace/ui';

interface ChatWindowProps {
  threadId: string;
  currentUserId: string;
  messages: ChatMessage[];
  listing?: ChatListingPreview;
  participant?: ChatParticipantPreview;
  isBlocked?: boolean;
  onSend: (content: string, attachmentUrl?: string) => void;
  onTyping?: () => void;
  onReportMessage?: (messageId: string) => void;
  onBlockConversation?: () => void;
  typingLabel?: string;
  header?: React.ReactNode;
}

export function ChatWindow({
  threadId,
  currentUserId,
  messages,
  listing,
  participant,
  isBlocked = false,
  onSend,
  onTyping,
  onReportMessage,
  onBlockConversation,
  typingLabel,
  header,
}: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInput('');
  }, [threadId]);

  const handleSend = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isBlocked) return;
      onSend(input.trim());
      setInput('');
    },
    [input, isBlocked, onSend],
  );

  return (
    <div className="flex h-[min(32rem,70vh)] flex-col rounded-xl border border-border bg-card shadow-sm md:h-[32rem]">
      <div className="border-b border-border px-4 py-3">
        {header ?? (
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-foreground">
                  {participant?.displayName ?? 'User'}
                </p>
                {participant && (
                  <ChatVerificationBadge
                    verified={participant.verificationBadge}
                    role={participant.role}
                  />
                )}
              </div>
              {listing && (
                <div className="mt-2">
                  <ListingPreviewInChat preview={listing} />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {onBlockConversation && !isBlocked && (
                <button
                  type="button"
                  onClick={onBlockConversation}
                  className="text-xs font-medium text-destructive hover:text-destructive"
                >
                  Block
                </button>
              )}
              {isBlocked && (
                <span className="text-xs font-medium text-destructive">Conversation blocked</span>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div key={msg.id} className="group relative">
            <MessageBubble message={msg} currentUserId={currentUserId} />
            {onReportMessage &&
              msg.senderId !== currentUserId &&
              msg.messageType !== 'system' && (
                <button
                  type="button"
                  onClick={() => onReportMessage(msg.id)}
                  className="ml-2 mt-0.5 text-xs text-muted-foreground/70 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                >
                  Report
                </button>
              )}
          </div>
        ))}
        {typingLabel && <TypingIndicator label={typingLabel} />}
      </div>
      <form
        onSubmit={handleSend}
        className={cn('flex gap-2 border-t border-border p-3 sm:p-4')}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file || isBlocked) return;
            setUploading(true);
            try {
              const { chatService } = await import('@/services/chat.service');
              const url = await chatService.uploadAttachment(threadId, file);
              onSend(file.name, url);
            } finally {
              setUploading(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }
          }}
        />
        <button
          type="button"
          disabled={isBlocked || uploading}
          onClick={() => fileInputRef.current?.click()}
          className="min-h-[44px] shrink-0 rounded-lg border border-border px-3 text-sm text-muted-foreground hover:bg-muted/50 disabled:opacity-50"
          aria-label="Attach image"
        >
          Attach
        </button>
        <input
          type="text"
          value={input}
          disabled={isBlocked}
          onChange={(e) => {
            setInput(e.target.value);
            onTyping?.();
          }}
          placeholder={isBlocked ? 'Conversation blocked' : 'Type a message...'}
          className="min-h-[44px] flex-1 rounded-lg border border-border px-3 py-2 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-muted/50 sm:text-sm"
        />
        <Button type="submit" className="min-h-[44px] shrink-0" disabled={isBlocked || uploading}>
          {uploading ? '…' : 'Send'}
        </Button>
      </form>
    </div>
  );
}
