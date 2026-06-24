'use client';

import { useState } from 'react';

import { Button } from '@community-marketplace/ui';

interface SaveButtonProps {
  listingId: string;
  initialSaved?: boolean;
}

export function SaveButton({ listingId, initialSaved = false }: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);

  function handleToggle() {
    setSaved((prev) => !prev);
    // TODO: wire to buyer favorites API
    void listingId;
  }

  return (
    <Button variant="secondary" onClick={handleToggle}>
      {saved ? 'Saved ♥' : 'Save'}
    </Button>
  );
}
