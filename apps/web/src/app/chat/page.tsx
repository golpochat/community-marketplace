import Link from 'next/link';

export const metadata = { title: 'Messages' };

export default function ChatPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
      <p className="mt-2 text-gray-600">
        Chat is available from your role dashboard after signing in.
      </p>
      <div className="mt-6 flex gap-4">
        <Link
          href="/buyer/dashboard/chat"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Buyer messages
        </Link>
        <Link
          href="/seller/dashboard/chat"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Seller messages
        </Link>
      </div>
    </div>
  );
}
