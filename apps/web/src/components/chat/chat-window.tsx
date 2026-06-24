'use client';

import { useEffect, useState } from 'react';

import type { ChatMessage } from '@community-marketplace/types';
import { Button } from '@community-marketplace/ui';

interface ChatWindowProps {
  threadId: string;
  currentUserId: string;
  messages: ChatMessage[];
  onSend: (content: string) => void;
  onTyping?: () => void;
  typingLabel?: string;
}

export function ChatWindow({
  threadId,
  currentUserId,
  messages,
  onSend,
  onTyping,
  typingLabel,
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
    <div className="flex h-[32rem] flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
      {typingLabel && (
        <p className="border-b border-gray-100 px-4 py-2 text-xs text-gray-500">
          {typingLabel}
        </p>
      )}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId;
          const isSystem = msg.messageType === 'system';
          return (
            <div
              key={msg.id}
              className={`flex ${isSystem ? 'justify-center' : isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs rounded-lg px-4 py-2 text-sm ${
                  isSystem
                    ? 'bg-gray-50 text-gray-600 italic'
                    : isMine
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 text-gray-900'
                }`}
              >
                {msg.attachmentUrl && msg.messageType === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={msg.attachmentUrl}
                    alt="attachment"
                    className="mb-2 max-h-40 rounded"
                  />
                ) : null}
                <p>{msg.content}</p>
                <p className="mt-1 text-xs opacity-70">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {msg.readBy.length > 1 ? ' · Read' : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-200 p-4">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            onTyping?.();
          }}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
}
