'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  ChatMessage,
  ChatListingPreview,
  ChatParticipantPreview,
  ListingStatus,
  PriorityMessageConfigResponse,
  PriorityMessageIntentResponse,
} from '@community-marketplace/types';
import { cn } from '@community-marketplace/ui';
import { Button } from '@community-marketplace/ui';
import { COMMERCE_PUBLIC_COPY } from '@community-marketplace/utils';

import { ChatVerificationBadge } from '@/components/chat/chat-verification-badge';
import { ListingPreviewInChat } from '@/components/chat/listing-preview-in-chat';
import { MessageBubble } from '@/components/chat/message-bubble';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import { BuyNowButton } from '@/components/listings/buy-now-button';
import { BoostCheckoutPanel } from '@/components/payments/boost-checkout-panel';
import { monetizationService } from '@/services/monetization.service';

interface ChatWindowProps {
  threadId: string;
  currentUserId: string;
  messages: ChatMessage[];
  listing?: ChatListingPreview;
  participant?: ChatParticipantPreview;
  isBlocked?: boolean;
  /** Buyer of this thread — can purchase priority send. */
  canSendPriority?: boolean;
  onSend: (
    content: string,
    attachmentUrl?: string,
    platformPurchaseId?: string,
  ) => void | Promise<void>;
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
  canSendPriority = false,
  onSend,
  onTyping,
  onReportMessage,
  onBlockConversation,
  typingLabel,
  header,
}: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [asPriority, setAsPriority] = useState(false);
  const [useCredits, setUseCredits] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [priorityConfig, setPriorityConfig] = useState<PriorityMessageConfigResponse | null>(
    null,
  );
  const [priorityIntent, setPriorityIntent] = useState<PriorityMessageIntentResponse | null>(
    null,
  );
  const [pendingContent, setPendingContent] = useState<string | null>(null);
  const [priorityError, setPriorityError] = useState<string | null>(null);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInput('');
    setAsPriority(false);
    setUseCredits(false);
    setPriorityIntent(null);
    setPendingContent(null);
    setPriorityError(null);
  }, [threadId]);

  useEffect(() => {
    if (!canSendPriority) {
      setPriorityConfig(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const [config, wallet] = await Promise.all([
          monetizationService.getPriorityMessageConfig(),
          monetizationService.getBuyerWallet().catch(() => null),
        ]);
        if (cancelled) return;
        setPriorityConfig(config);
        setWalletBalance(wallet?.balance ?? 0);
      } catch {
        if (!cancelled) setPriorityConfig(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canSendPriority, threadId]);

  const showPriorityOption = Boolean(
    canSendPriority && priorityConfig?.enabled && !isBlocked,
  );

  const resetPriorityCheckout = useCallback(() => {
    setPriorityIntent(null);
    setPendingContent(null);
    setPriorityError(null);
    setPriorityLoading(false);
  }, []);

  const handlePriorityPaid = useCallback(async () => {
    if (!priorityIntent || !pendingContent) return;
    const purchaseId = priorityIntent.purchase.id;
    const content = pendingContent;
    resetPriorityCheckout();
    setAsPriority(false);
    setUseCredits(false);
    setInput('');
    await onSend(content, undefined, purchaseId);
  }, [onSend, pendingContent, priorityIntent, resetPriorityCheckout]);

  const startPriorityCheckout = useCallback(
    async (content: string) => {
      if (!priorityConfig?.enabled) return;
      setPriorityLoading(true);
      setPriorityError(null);
      try {
        const creditsAmount =
          useCredits && walletBalance > 0
            ? Math.min(walletBalance, priorityConfig.amount)
            : undefined;
        const intent = await monetizationService.createPriorityMessageIntent({
          threadId,
          ...(creditsAmount && creditsAmount > 0 ? { creditsAmount } : {}),
        });
        setPendingContent(content);
        setPriorityIntent(intent);
        // Credits-only: purchase already succeeded — send immediately.
        if (!intent.clientSecret || (intent.amountDue != null && intent.amountDue <= 0)) {
          setAsPriority(false);
          setUseCredits(false);
          setInput('');
          setPendingContent(null);
          setPriorityIntent(null);
          await onSend(content, undefined, intent.purchase.id);
        }
      } catch (err) {
        setPriorityError(
          err instanceof Error ? err.message : 'Failed to start priority checkout',
        );
      } finally {
        setPriorityLoading(false);
      }
    },
    [onSend, priorityConfig, threadId, useCredits, walletBalance],
  );

  const handleSend = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isBlocked || priorityLoading || priorityIntent) return;
      const content = input.trim();
      if (asPriority && showPriorityOption) {
        void startPriorityCheckout(content);
        return;
      }
      onSend(content);
      setInput('');
    },
    [
      asPriority,
      input,
      isBlocked,
      onSend,
      priorityIntent,
      priorityLoading,
      showPriorityOption,
      startPriorityCheckout,
    ],
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
      {listing &&
        listing.status === 'active' &&
        listing.sellerId !== currentUserId &&
        !isBlocked && (
          <div className="border-b border-border px-4 py-3">
            <p className="mb-2 text-xs text-muted-foreground">{COMMERCE_PUBLIC_COPY.chatPayHint}</p>
            <BuyNowButton
              listing={{
                id: listing.id,
                status: listing.status as ListingStatus,
                sellerId: listing.sellerId,
              }}
            />
          </div>
        )}
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

      {priorityIntent && pendingContent && (
        <div className="space-y-2 border-t border-border px-3 py-3 sm:px-4">
          <p className="text-xs text-muted-foreground">
            Complete payment to send as a priority message. Or{' '}
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => {
                const content = pendingContent;
                resetPriorityCheckout();
                setAsPriority(false);
                setInput('');
                void onSend(content);
              }}
            >
              send as normal
            </button>
            .
          </p>
          {priorityError && <p className="text-sm text-destructive">{priorityError}</p>}
          <BoostCheckoutPanel
            intent={priorityIntent}
            onSuccess={() => void handlePriorityPaid()}
            confirmPurchase={(purchaseId) =>
              monetizationService.confirmPriorityMessage(purchaseId)
            }
            confirmLabel="Pay and send priority"
          />
        </div>
      )}

      <form
        onSubmit={handleSend}
        className={cn('space-y-2 border-t border-border p-3 sm:p-4')}
      >
        {showPriorityOption && !priorityIntent && (
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={asPriority}
                onChange={(e) => setAsPriority(e.target.checked)}
                disabled={isBlocked || priorityLoading}
                className="rounded border-border"
              />
              Send as priority message (€{priorityConfig!.amount.toFixed(2)})
            </label>
            {asPriority && walletBalance > 0 && (
              <label className="ml-6 flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={useCredits}
                  onChange={(e) => setUseCredits(e.target.checked)}
                  disabled={isBlocked || priorityLoading}
                  className="rounded border-border"
                />
                Use SellNearby Credit (€{walletBalance.toFixed(2)} available)
              </label>
            )}
          </div>
        )}
        {priorityError && !priorityIntent && (
          <p className="text-sm text-destructive">{priorityError}</p>
        )}
        <div className="flex gap-2">
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
                await onSend(file.name, url);
              } finally {
                setUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }
            }}
          />
          <button
            type="button"
            disabled={isBlocked || uploading || Boolean(priorityIntent)}
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] shrink-0 rounded-lg border border-border px-3 text-sm text-muted-foreground hover:bg-muted/50 disabled:opacity-50"
            aria-label="Attach image"
          >
            Attach
          </button>
          <input
            type="text"
            value={input}
            disabled={isBlocked || Boolean(priorityIntent)}
            onChange={(e) => {
              setInput(e.target.value);
              onTyping?.();
            }}
            placeholder={isBlocked ? 'Conversation blocked' : 'Type a message...'}
            className="min-h-[44px] flex-1 rounded-lg border border-border px-3 py-2 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-muted/50 sm:text-sm"
          />
          <Button
            type="submit"
            className="min-h-[44px] shrink-0"
            disabled={isBlocked || uploading || priorityLoading || Boolean(priorityIntent)}
          >
            {priorityLoading ? '…' : uploading ? '…' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  );
}
