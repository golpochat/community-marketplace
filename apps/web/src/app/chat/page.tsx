import { ChatWindow } from '@/components/chat/chat-window';

export const metadata = { title: 'Messages' };

export default function ChatPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
      <p className="mt-2 text-gray-600">Chat with buyers and sellers in your community</p>
      <div className="mt-8">
        <ChatWindow />
      </div>
    </div>
  );
}
