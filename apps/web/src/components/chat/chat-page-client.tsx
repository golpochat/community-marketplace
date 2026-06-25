'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { ChatInboxItem, ChatMessage } from '@community-marketplace/types';

import { ChatLayout } from '@/components/layout/chat-layout';
import { useChatSocket } from '@/hooks/use-chat-socket';
import { chatService } from '@/services/chat.service';

function dedupeMessages(messages: ChatMessage[]): ChatMessage[] {
  const seen = new Set<string>();
  return messages.filter((message) => {
    if (seen.has(message.id)) return false;
    seen.add(message.id);
    return true;
  });
}

interface ChatPageClientProps {
  currentUserId: string;
  accessToken?: string;
  role: 'BUYER' | 'SELLER';
  listingId?: string;
  sellerId?: string;
}

export function ChatPageClient({
  currentUserId,
  accessToken,
  role,
  listingId,
  sellerId,
}: ChatPageClientProps) {
  const [inbox, setInbox] = useState<ChatInboxItem[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingLabel, setTypingLabel] = useState<string>();
  const [threadError, setThreadError] = useState<string | null>(null);
  const activeThreadIdRef = useRef(activeThreadId);
  const autoThreadHandled = useRef(false);

  activeThreadIdRef.current = activeThreadId;

  const loadInbox = useCallback(async () => {
    const result = await chatService.getInbox();
    const items = Array.isArray(result.data) ? result.data : [];
    setInbox(items);
    return items;
  }, []);

  useEffect(() => {
    void loadInbox().then((items) => {
      setActiveThreadId((current) => {
        if (!current && items[0]) {
          return items[0].thread.id;
        }
        return current;
      });
    });
  }, [loadInbox]);

  useEffect(() => {
    if (!listingId || autoThreadHandled.current) return;
    autoThreadHandled.current = true;

    async function openListingThread() {
      setThreadError(null);
      try {
        const existing = await chatService.getThreadByListing(listingId!);
        if (existing?.id) {
          setActiveThreadId(existing.id);
          await loadInbox();
          return;
        }

        if (role === 'BUYER' && sellerId) {
          const created = await chatService.createThread(listingId!, sellerId);
          if (created?.id) {
            setActiveThreadId(created.id);
            await loadInbox();
          }
          return;
        }

        const items = await loadInbox();
        const match = items.find((item) => item.thread.listingId === listingId);
        if (match) {
          setActiveThreadId(match.thread.id);
        }
      } catch (err) {
        setThreadError(err instanceof Error ? err.message : 'Failed to open conversation');
      }
    }

    void openListingThread();
  }, [listingId, sellerId, role, loadInbox]);

  useEffect(() => {
    if (!activeThreadId) return;
    void chatService.getMessages(activeThreadId).then((res) => {
      setMessages(
        Array.isArray(res.data) ? dedupeMessages(res.data) : [],
      );
      void chatService.markRead(activeThreadId);
    });
  }, [activeThreadId]);

  const handleMessage = useCallback((message: ChatMessage) => {
    if (message.threadId !== activeThreadIdRef.current) {
      void loadInbox();
      return;
    }
    setMessages((prev) =>
      prev.some((m) => m.id === message.id) ? prev : [...prev, message],
    );
    void loadInbox();
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

  const { sendTyping } = useChatSocket({
    threadId: activeThreadId,
    token: accessToken,
    onMessage: handleMessage,
    onTyping: handleTyping,
    onReadReceipt: handleReadReceipt,
  });

  const handleSend = async (content: string) => {
    if (!activeThreadId) return;
    try {
      const sent = await chatService.sendMessage(activeThreadId, content);
      setMessages((prev) =>
        prev.some((m) => m.id === sent.id) ? prev : [...prev, sent],
      );
      void loadInbox();
    } catch (err) {
      setThreadError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const handleTypingInput = () => {
    sendTyping(role === 'BUYER' ? 'buyer_typing' : 'seller_typing');
  };

  return (
    <>
      {threadError && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {threadError}
        </p>
      )}
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
    </>
  );
}
