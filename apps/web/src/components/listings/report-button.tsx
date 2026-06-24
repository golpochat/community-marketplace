'use client';

import { useState } from 'react';

import { Button } from '@community-marketplace/ui';
import { Modal } from '@/components/shared/modal';

interface ReportButtonProps {
  listingId: string;
}

export function ReportButton({ listingId }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  function handleReport() {
    // TODO: wire to buyer reports API
    void listingId;
    void reason;
    setOpen(false);
    setReason('');
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Report
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Report listing"
        description="Tell us why you're reporting this listing."
        confirmLabel="Submit report"
        onConfirm={handleReport}
      >
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="Reason for report..."
        />
      </Modal>
    </>
  );
}
