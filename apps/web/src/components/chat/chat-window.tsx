'use client';

import { useCallback, useEffect, useState } from 'react';

import type { ChatMessage } from '@community-marketplace/types';
import { cn } from '@community-marketplace/ui';

import { MessageBubble } from '@/components/chat/message-bubble';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import { Button } from '@community-marketplace/ui';

interface ChatWindowProps {
  threadId: string;
  currentUserId: string;
  messages: ChatMessage[];
  onSend: (content: string) => void;
  onTyping?: () => void;
  typingLabel?: string;
  header?: React.ReactNode;
}

export function ChatWindow({
  threadId,
  currentUserId,
  messages,
  onSend,
  onTyping,
  typingLabel,
  header,
}: ChatWindowProps) {
  const [input, setInput] = useState('');

  useEffect(() => {
    setInput('');
  }, [threadId]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  }

  return (
    <div className="flex h-[min(32rem,70vh)] flex-col rounded-xl border border-gray-200 bg-white shadow-sm md:h-[32rem]">
      {header && (
        <div className="border-b border-gray-200 px-4 py-3">{header}</div>
      )}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} currentUserId={currentUserId} />
        ))}
        {typingLabel && <TypingIndicator label={typingLabel} />}
      </div>
      <form
        onSubmit={handleSend}
        className={cn('flex gap-2 border-t border-gray-200 p-3 sm:p-4')}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            onTyping?.();
          }}
          placeholder="Type a message..."
          className="min-h-[44px] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
        />
        <Button type="submit" className="min-h-[44px] shrink-0">
          Send
        </Button>
      </form>
    </div>
  );
}
