'use client';

import { Dialog } from '@community-marketplace/ui';

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
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Block conversation"
      description={
        participantName
          ? `Block messaging with ${participantName}? Neither of you will be able to send messages in this conversation.`
          : 'Block this conversation? Neither participant will be able to send messages.'
      }
      confirmLabel={loading ? 'Blocking…' : 'Block conversation'}
      variant="destructive"
      closeOnConfirm={false}
      confirmLoading={loading}
      onConfirm={onConfirm}
    />
  );
}
