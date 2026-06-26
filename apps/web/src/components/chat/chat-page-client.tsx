'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { BuyerTrustProfile, ChatInboxItem, ChatMessage } from '@community-marketplace/types';

import { BlockConversationModal } from '@/components/chat/block-conversation-modal';
import { ReportMessageModal } from '@/components/chat/report-message-modal';
import { ChatLayout } from '@/components/layout/chat-layout';
import { BuyerTrustBadges } from '@/components/trust/buyer-trust-badges';
import { useChatSocket } from '@/hooks/use-chat-socket';
import { chatService } from '@/services/chat.service';
import { trustService } from '@/services/trust.service';

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
  const [buyerTrust, setBuyerTrust] = useState<BuyerTrustProfile | null>(null);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
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

  const activeInboxItem = useMemo(
    () => inbox.find((item) => item.thread.id === activeThreadId),
    [inbox, activeThreadId],
  );

  useEffect(() => {
    if (role !== 'SELLER' || !activeInboxItem?.thread.buyerId) {
      setBuyerTrust(null);
      return;
    }
    let cancelled = false;
    void trustService
      .getBuyerTrustForSeller(activeInboxItem.thread.buyerId)
      .then((profile) => {
        if (!cancelled) setBuyerTrust(profile);
      })
      .catch(() => {
        if (!cancelled) setBuyerTrust(null);
      });
    return () => {
      cancelled = true;
    };
  }, [role, activeInboxItem?.thread.buyerId]);

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

  const handleSend = async (content: string, attachmentUrl?: string) => {
    if (!activeThreadId) return;
    try {
      const sent = await chatService.sendMessage(
        activeThreadId,
        content,
        attachmentUrl ? 'image' : 'text',
        attachmentUrl,
      );
      setMessages((prev) =>
        prev.some((m) => m.id === sent.id) ? prev : [...prev, sent],
      );
      void loadInbox();
    } catch (err) {
      setThreadError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const handleReportSubmit = async (reason: string) => {
    if (!reportMessageId) return;
    setReportLoading(true);
    try {
      await chatService.reportMessage(reportMessageId, reason);
      setReportMessageId(null);
    } catch (err) {
      setThreadError(err instanceof Error ? err.message : 'Failed to report message');
    } finally {
      setReportLoading(false);
    }
  };

  const handleBlockConfirm = async () => {
    if (!activeThreadId) return;
    setBlockLoading(true);
    try {
      await chatService.blockConversation(activeThreadId);
      setBlockModalOpen(false);
      await loadInbox();
    } catch (err) {
      setThreadError(err instanceof Error ? err.message : 'Failed to block conversation');
    } finally {
      setBlockLoading(false);
    }
  };

  const handleTypingInput = () => {
    sendTyping(role === 'BUYER' ? 'buyer_typing' : 'seller_typing');
  };

  const threadHeader =
    role === 'SELLER' && buyerTrust ? (
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-900">
          {activeInboxItem?.participant.displayName ?? 'Buyer'}
        </p>
        <BuyerTrustBadges
          phoneVerified={buyerTrust.phoneVerified}
          completedTransactions={buyerTrust.completedTransactions}
          hasDisputes={buyerTrust.hasDisputes}
          isCommunityMember={buyerTrust.isCommunityMember}
          averageRating={buyerTrust.averageRating}
          reviewCount={buyerTrust.reviewCount}
        />
      </div>
    ) : undefined;

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
      activeInboxItem={activeInboxItem}
      messages={messages}
      currentUserId={currentUserId}
      typingLabel={typingLabel}
      threadHeader={threadHeader}
      onSelectThread={setActiveThreadId}
      onSend={handleSend}
      onTyping={handleTypingInput}
      onReportMessage={setReportMessageId}
      onBlockConversation={() => setBlockModalOpen(true)}
    />
      <ReportMessageModal
        open={reportMessageId != null}
        loading={reportLoading}
        onSubmit={handleReportSubmit}
        onClose={() => setReportMessageId(null)}
      />
      <BlockConversationModal
        open={blockModalOpen}
        participantName={activeInboxItem?.participant.displayName}
        loading={blockLoading}
        onConfirm={handleBlockConfirm}
        onClose={() => setBlockModalOpen(false)}
      />
    </>
  );
}
