'use client';

import { useCallback, useEffect, useState } from 'react';

import type { ChatInboxItem, ChatMessage } from '@community-marketplace/types';

import { ChatWindow } from '@/components/chat/chat-window';
import { ConversationList } from '@/components/chat/conversation-list';
import { useChatSocket } from '@/hooks/use-chat-socket';
import { chatService } from '@/services/chat.service';

interface ChatPageClientProps {
  currentUserId: string;
  accessToken?: string;
  role: 'BUYER' | 'SELLER';
}

export function ChatPageClient({
  currentUserId,
  accessToken,
  role,
}: ChatPageClientProps) {
  const [inbox, setInbox] = useState<ChatInboxItem[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingLabel, setTypingLabel] = useState<string>();

  const loadInbox = useCallback(async () => {
    const result = await chatService.getInbox();
    setInbox(result.data);
    if (!activeThreadId && result.data[0]) {
      setActiveThreadId(result.data[0].thread.id);
    }
  }, [activeThreadId]);

  useEffect(() => {
    void loadInbox();
  }, [loadInbox]);

  useEffect(() => {
    if (!activeThreadId) return;
    void chatService.getMessages(activeThreadId).then((res) => {
      setMessages(res.data);
      void chatService.markRead(activeThreadId);
    });
  }, [activeThreadId]);

  const handleMessage = useCallback((message: ChatMessage) => {
    if (message.threadId !== activeThreadId) {
      void loadInbox();
      return;
    }
    setMessages((prev) => [...prev, message]);
    void chatService.markRead(message.threadId, [message.id]);
  }, [activeThreadId, loadInbox]);

  const { sendMessage, sendTyping } = useChatSocket({
    threadId: activeThreadId,
    token: accessToken,
    onMessage: handleMessage,
    onTyping: ({ event }) => {
      setTypingLabel(event === 'buyer_typing' ? 'Buyer is typing…' : 'Seller is typing…');
      setTimeout(() => setTypingLabel(undefined), 2000);
    },
    onReadReceipt: ({ messageIds }) => {
      setMessages((prev) =>
        prev.map((m) =>
          messageIds.includes(m.id)
            ? { ...m, readBy: [...new Set([...m.readBy, currentUserId])] }
            : m,
        ),
      );
    },
  });

  const handleSend = async (content: string) => {
    if (!activeThreadId) return;
    sendMessage({ threadId: activeThreadId, content, messageType: 'text' });
    const sent = await chatService.sendMessage(activeThreadId, content);
    setMessages((prev) => [...prev.filter((m) => m.id !== sent.id), sent]);
  };

  const handleTyping = () => {
    sendTyping(role === 'BUYER' ? 'buyer_typing' : 'seller_typing');
  };

  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <ConversationList
          items={inbox}
          activeThreadId={activeThreadId}
          onSelect={setActiveThreadId}
        />
      </div>
      {activeThreadId ? (
        <ChatWindow
          threadId={activeThreadId}
          currentUserId={currentUserId}
          messages={messages}
          onSend={handleSend}
          onTyping={handleTyping}
          typingLabel={typingLabel}
        />
      ) : (
        <div className="flex h-[32rem] items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-500">
          Select a conversation
        </div>
      )}
    </div>
  );
}
