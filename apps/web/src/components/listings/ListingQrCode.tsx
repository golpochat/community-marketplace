'use client';

import { useCallback, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

import { Button } from '@community-marketplace/ui';

interface ListingQrCodeProps {
  shortUrl: string;
  title: string;
  onQrShare?: () => void;
  compact?: boolean;
}

export function ListingQrCode({ shortUrl, title, onQrShare, compact = false }: ListingQrCodeProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const downloadPng = useCallback(() => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    onQrShare?.();
    const link = document.createElement('a');
    link.download = `${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [title, onQrShare]);

  const printQr = useCallback(() => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const win = window.open('', '_blank', 'width=480,height=560');
    if (!win) return;
    win.document.write(`
      <html><head><title>QR – ${title}</title></head>
      <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;">
        <img src="${canvas.toDataURL('image/png')}" alt="QR code" width="280" height="280" />
        <p style="margin-top:16px;font-size:14px;color:#444;">${shortUrl}</p>
      </body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
  }, [shortUrl, title]);

  return (
    <div className={compact ? 'space-y-3' : 'rounded-lg border border-border bg-muted/50 p-4'}>
      {!compact && <p className="text-sm font-medium text-foreground">Scan to open listing</p>}
      <div
        ref={canvasRef}
        className={`inline-block rounded-lg bg-card ${compact ? 'p-2 shadow-sm ring-1 ring-border' : 'p-3 shadow-sm'}`}
      >
        <QRCodeCanvas value={shortUrl} size={compact ? 128 : 160} level="M" includeMargin />
      </div>
      {!compact && <p className="mt-2 break-all text-xs text-muted-foreground">{shortUrl}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={downloadPng}>
          Download PNG
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={printQr}>
          Print
        </Button>
      </div>
    </div>
  );
}
