'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { ChatInboxItem, ChatMessage } from '@community-marketplace/types';

import { ChatLayout } from '@/components/layout/chat-layout';
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
  const activeThreadIdRef = useRef(activeThreadId);

  activeThreadIdRef.current = activeThreadId;

  const loadInbox = useCallback(async () => {
    const result = await chatService.getInbox();
    setInbox(Array.isArray(result.data) ? result.data : []);
    setActiveThreadId((current) => {
      if (!current && result.data?.[0]) {
        return result.data[0].thread.id;
      }
      return current;
    });
  }, []);

  useEffect(() => {
    void loadInbox();
  }, [loadInbox]);

  useEffect(() => {
    if (!activeThreadId) return;
    void chatService.getMessages(activeThreadId).then((res) => {
      setMessages(Array.isArray(res.data) ? res.data : []);
      void chatService.markRead(activeThreadId);
    });
  }, [activeThreadId]);

  const handleMessage = useCallback((message: ChatMessage) => {
    if (message.threadId !== activeThreadIdRef.current) {
      void loadInbox();
      return;
    }
    setMessages((prev) => [...prev, message]);
    void chatService.markRead(message.threadId, [message.id]);
  }, [loadInbox]);

  const handleTyping = useCallback(({ event }: { userId: string; event: string }) => {
    setTypingLabel(event === 'buyer_typing' ? 'Buyer is typing…' : 'Seller is typing…');
    setTimeout(() => setTypingLabel(undefined), 2000);
  }, []);

  const handleReadReceipt = useCallback(
    ({ messageIds }: { readerId: string; messageIds: string[] }) => {
      setMessages((prev) =>
        prev.map((m) =>
          messageIds.includes(m.id)
            ? { ...m, readBy: [...new Set([...m.readBy, currentUserId])] }
            : m,
        ),
      );
    },
    [currentUserId],
  );

  const { sendMessage, sendTyping } = useChatSocket({
    threadId: activeThreadId,
    token: accessToken,
    onMessage: handleMessage,
    onTyping: handleTyping,
    onReadReceipt: handleReadReceipt,
  });

  const handleSend = async (content: string) => {
    if (!activeThreadId) return;
    sendMessage({ threadId: activeThreadId, content, messageType: 'text' });
    const sent = await chatService.sendMessage(activeThreadId, content);
    setMessages((prev) => [...prev.filter((m) => m.id !== sent.id), sent]);
  };

  const handleTypingInput = () => {
    sendTyping(role === 'BUYER' ? 'buyer_typing' : 'seller_typing');
  };

  return (
    <ChatLayout
      inbox={inbox}
      activeThreadId={activeThreadId}
      messages={messages}
      currentUserId={currentUserId}
      typingLabel={typingLabel}
      onSelectThread={setActiveThreadId}
      onSend={handleSend}
      onTyping={handleTypingInput}
    />
  );
}
