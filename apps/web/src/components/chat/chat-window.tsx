'use client';

import { useState } from 'react';

import { Button } from '@community-marketplace/ui';

const INITIAL_MESSAGES = [
  { id: '1', sender: 'seller', text: 'Hi! Is this item still available?', time: '10:30 AM' },
  { id: '2', sender: 'buyer', text: 'Yes, it is! Would you like to meet tomorrow?', time: '10:32 AM' },
];

export function ChatWindow() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        sender: 'buyer',
        text: input.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setInput('');
  }

  return (
    <div className="flex h-96 flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'buyer' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs rounded-lg px-4 py-2 text-sm ${
                msg.sender === 'buyer'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p>{msg.text}</p>
              <p className="mt-1 text-xs opacity-70">{msg.time}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-200 p-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
}
