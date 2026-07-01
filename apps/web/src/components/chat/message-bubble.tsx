import type { ChatMessage } from '@community-marketplace/types';

import { ReadReceipts } from '@/components/chat/read-receipts';

interface MessageBubbleProps {
  message: ChatMessage;
  currentUserId: string;
}

export function MessageBubble({ message, currentUserId }: MessageBubbleProps) {
  const isMine = message.senderId === currentUserId;
  const isSystem = message.messageType === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <p className="rounded-lg bg-muted/50 px-4 py-2 text-center text-xs italic text-muted-foreground">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm sm:max-w-xs ${
          isMine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
        }`}
      >
        {message.attachmentUrl && message.messageType === 'image' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={message.attachmentUrl}
            alt="attachment"
            className="mb-2 max-h-40 rounded-lg"
          />
        ) : null}
        <p className="break-words">{message.content}</p>
        <div className="mt-1 flex items-center justify-end gap-1">
          <span className="text-xs opacity-70">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {isMine && <ReadReceipts readBy={message.readBy} currentUserId={currentUserId} />}
        </div>
      </div>
    </div>
  );
}
