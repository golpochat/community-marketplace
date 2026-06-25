'use client';

import { useCallback, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

import { Button } from '@community-marketplace/ui';

interface ListingQrCodeProps {
  shortUrl: string;
  title: string;
  onQrShare?: () => void;
}

export function ListingQrCode({ shortUrl, title, onQrShare }: ListingQrCodeProps) {
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
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm font-medium text-gray-900">Scan to open listing</p>
      <div ref={canvasRef} className="mt-3 inline-block rounded-lg bg-white p-3 shadow-sm">
        <QRCodeCanvas value={shortUrl} size={160} level="M" includeMargin />
      </div>
      <p className="mt-2 break-all text-xs text-gray-500">{shortUrl}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={downloadPng}>
          Download PNG
        </Button>
        <Button type="button" variant="outline" onClick={printQr}>
          Print
        </Button>
      </div>
    </div>
  );
}
