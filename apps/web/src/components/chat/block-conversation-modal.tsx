'use client';

interface BlockConversationModalProps {
  open: boolean;
  participantName?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function BlockConversationModal({
  open,
  participantName,
  loading = false,
  onConfirm,
  onClose,
}: BlockConversationModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="block-conversation-title"
    >
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h3 id="block-conversation-title" className="text-lg font-semibold text-slate-900">
          Block conversation
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          {participantName
            ? `Block messaging with ${participantName}? Neither of you will be able to send messages in this conversation.`
            : 'Block this conversation? Neither participant will be able to send messages.'}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Blocking…' : 'Block conversation'}
          </button>
        </div>
      </div>
    </div>
  );
}
