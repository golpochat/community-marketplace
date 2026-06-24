'use client';

import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

import type { ChatMessage } from '@community-marketplace/types';

import { API_BASE_URL } from '@/lib/constants';

interface UseChatSocketOptions {
  threadId?: string;
  token?: string;
  onMessage?: (message: ChatMessage) => void;
  onTyping?: (payload: { userId: string; event: string }) => void;
  onReadReceipt?: (payload: { readerId: string; messageIds: string[] }) => void;
}

export function useChatSocket({
  threadId,
  token,
  onMessage,
  onTyping,
  onReadReceipt,
}: UseChatSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const wsBase = API_BASE_URL.replace(/\/api\/?$/, '');
    const socket = io(`${wsBase}/chat`, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('message', (payload: { message: ChatMessage }) => {
      onMessage?.(payload.message);
    });
    socket.on('typing', (payload: { userId: string; event: string }) => {
      onTyping?.(payload);
    });
    socket.on('read_receipt', (payload: { readerId: string; messageIds: string[] }) => {
      onReadReceipt?.(payload);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, onMessage, onTyping, onReadReceipt]);

  useEffect(() => {
    if (!threadId || !socketRef.current?.connected) return;
    socketRef.current.emit('join_thread', { threadId });
  }, [threadId, connected]);

  const sendMessage = (payload: {
    threadId: string;
    content: string;
    messageType?: 'text' | 'image';
    attachmentUrl?: string;
  }) => {
    socketRef.current?.emit('send_message', payload);
  };

  const sendTyping = (event: 'buyer_typing' | 'seller_typing') => {
    if (!threadId) return;
    socketRef.current?.emit('typing', { threadId, event });
  };

  const markRead = (messageIds?: string[]) => {
    if (!threadId) return;
    socketRef.current?.emit('mark_read', { threadId, messageIds });
  };

  return { connected, sendMessage, sendTyping, markRead };
}
