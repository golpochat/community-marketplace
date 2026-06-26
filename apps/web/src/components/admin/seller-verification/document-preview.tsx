'use client';

import { useState } from 'react';

function isImageUrl(url: string): boolean {
  return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url) || url.includes('image/');
}

export function DocumentPreview({
  label,
  url,
}: {
  label: string;
  url?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  if (!url) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        No {label.toLowerCase()} uploaded
      </div>
    );
  }

  const showImage = isImageUrl(url) && !failed;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          Download
        </a>
      </div>
      {showImage ? (
        <div className="relative overflow-hidden rounded-md bg-slate-100">
          {loading ? (
            <div className="h-48 animate-pulse bg-slate-200" aria-hidden />
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={label}
            className={`max-h-64 w-full object-contain ${loading ? 'hidden' : 'block'}`}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setFailed(true);
            }}
          />
        </div>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex text-sm text-blue-600 hover:underline"
        >
          Open document
        </a>
      )}
    </div>
  );
}
