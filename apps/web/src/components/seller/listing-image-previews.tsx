'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ListingImage } from '@community-marketplace/types';
import { Button } from '@community-marketplace/ui';
import { cn } from '@community-marketplace/ui';

import { ListingMediaImage } from '@/components/listings/listing-media-image';

interface ExistingListingPhotosProps {
  images: ListingImage[];
  title?: string;
  onRemove?: (imageId: string) => void;
  removingId?: string | null;
  removeDisabled?: boolean;
  sortable?: boolean;
  onReorder?: (images: ListingImage[]) => void | Promise<void>;
  reordering?: boolean;
}

export function ExistingListingPhotos({
  images,
  title = 'Current photos',
  onRemove,
  removingId = null,
  removeDisabled = false,
  sortable = false,
  onReorder,
  reordering = false,
}: ExistingListingPhotosProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [localImages, setLocalImages] = useState(images);

  useEffect(() => {
    setLocalImages(images);
  }, [images]);

  const handleDrop = useCallback(
    async (targetIndex: number) => {
      if (dragIndex == null || dragIndex === targetIndex || !onReorder) return;
      const next = [...localImages];
      const [moved] = next.splice(dragIndex, 1);
      if (!moved) return;
      next.splice(targetIndex, 0, moved);
      setLocalImages(next);
      setDragIndex(null);
      await onReorder(next);
    },
    [dragIndex, localImages, onReorder],
  );

  const handleSetCover = useCallback(
    async (index: number) => {
      if (!onReorder || index === 0) return;
      const next = [...localImages];
      const [moved] = next.splice(index, 1);
      if (!moved) return;
      next.unshift(moved);
      setLocalImages(next);
      await onReorder(next);
    },
    [localImages, onReorder],
  );

  if (localImages.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">{title}</p>
        {sortable && (
          <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            Drag to reorder · first photo is the cover
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {localImages.map((image, index) => (
          <ExistingPhotoThumb
            key={image.id}
            image={image}
            index={index}
            isCover={index === 0}
            sortable={sortable}
            dragging={dragIndex === index}
            onRemove={onRemove}
            removing={removingId === image.id}
            removeDisabled={removeDisabled || reordering}
            onDragStart={() => setDragIndex(index)}
            onDragEnd={() => setDragIndex(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => void handleDrop(index)}
            onSetCover={() => void handleSetCover(index)}
            reordering={reordering}
          />
        ))}
      </div>
    </div>
  );
}

function ExistingPhotoThumb({
  image,
  index,
  isCover,
  sortable,
  dragging,
  onRemove,
  removing = false,
  removeDisabled = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onSetCover,
  reordering = false,
}: {
  image: ListingImage;
  index: number;
  isCover: boolean;
  sortable: boolean;
  dragging: boolean;
  onRemove?: (imageId: string) => void;
  removing?: boolean;
  removeDisabled?: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onSetCover: () => void;
  reordering?: boolean;
}) {
  return (
    <figure
      draggable={sortable && !removeDisabled}
      onDragStart={sortable ? onDragStart : undefined}
      onDragEnd={sortable ? onDragEnd : undefined}
      onDragOver={sortable ? onDragOver : undefined}
      onDrop={sortable ? onDrop : undefined}
      className={cn(
        'group relative overflow-hidden rounded-lg border bg-[hsl(var(--dashboard-sidebar-active)/0.35)]',
        isCover
          ? 'border-[hsl(var(--dashboard-accent))] ring-2 ring-[hsl(var(--dashboard-accent)/0.35)]'
          : 'border-[hsl(var(--dashboard-sidebar-border))]',
        sortable && 'cursor-grab active:cursor-grabbing',
        dragging && 'opacity-50',
      )}
    >
      <ListingMediaImage
        image={image}
        variant="tiny"
        alt={`Listing photo ${index + 1}`}
        rounded="none"
        className="aspect-square w-full"
      />
      {isCover && (
        <span className="absolute left-2 top-2 rounded bg-[hsl(var(--dashboard-accent))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          Cover
        </span>
      )}
      <div className="absolute right-2 top-2 flex flex-col gap-1">
        {onRemove && (
          <Button
            type="button"
            variant="outline"
            className="h-7 bg-white/95 px-2 text-xs shadow-sm"
            disabled={removeDisabled || removing}
            onClick={() => onRemove(image.id)}
          >
            {removing ? '…' : 'Remove'}
          </Button>
        )}
        {sortable && !isCover && (
          <Button
            type="button"
            variant="outline"
            className="h-7 bg-white/95 px-2 text-xs shadow-sm"
            disabled={removeDisabled || reordering}
            onClick={onSetCover}
          >
            Set as Cover
          </Button>
        )}
      </div>
      <figcaption className="truncate px-2 py-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
        Photo {index + 1}
      </figcaption>
    </figure>
  );
}

interface SelectedFilePreviewsProps {
  files: File[];
  onRemove?: (index: number) => void;
  onReorder?: (files: File[]) => void;
  title?: string;
}

export function SelectedFilePreviews({
  files,
  onRemove,
  onReorder,
  title = 'New photos to upload',
}: SelectedFilePreviewsProps) {
  const fileKey = useMemo(
    () => files.map((f) => `${f.name}-${f.size}-${f.lastModified}`).join('|'),
    [files],
  );

  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [fileKey, files]);

  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleDrop = useCallback(
    (targetIndex: number) => {
      if (dragIndex == null || dragIndex === targetIndex || !onReorder) return;
      const next = [...files];
      const [moved] = next.splice(dragIndex, 1);
      if (!moved) return;
      next.splice(targetIndex, 0, moved);
      onReorder(next);
      setDragIndex(null);
    },
    [dragIndex, files, onReorder],
  );

  const handleSetCover = useCallback(
    (index: number) => {
      if (!onReorder || index === 0) return;
      const next = [...files];
      const [moved] = next.splice(index, 1);
      if (!moved) return;
      next.unshift(moved);
      onReorder(next);
    },
    [files, onReorder],
  );

  if (files.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">{title}</p>
        {onReorder && files.length > 1 && (
          <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            Drag to reorder · first will be the cover
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {files.map((file, index) => {
          const previewSrc = previewUrls[index];
          const isReady = previewUrls.length === files.length && Boolean(previewSrc);

          return (
          <figure
            key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
            draggable={!!onReorder}
            onDragStart={() => setDragIndex(index)}
            onDragEnd={() => setDragIndex(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(index)}
            className={cn(
              'group relative overflow-hidden rounded-lg border bg-[hsl(var(--dashboard-sidebar-active)/0.35)]',
              index === 0
                ? 'border-[hsl(var(--dashboard-accent))] ring-2 ring-[hsl(var(--dashboard-accent)/0.35)]'
                : 'border-[hsl(var(--dashboard-sidebar-border))]',
              onReorder && 'cursor-grab active:cursor-grabbing',
              dragIndex === index && 'opacity-50',
            )}
          >
            {isReady ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewSrc}
                alt={file.name}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center bg-[hsl(var(--dashboard-sidebar-active)/0.5)] text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                Loading…
              </div>
            )}
            {index === 0 && (
              <span className="absolute left-2 top-2 rounded bg-[hsl(var(--dashboard-accent))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                Cover
              </span>
            )}
            <div className="absolute right-2 top-2 flex flex-col gap-1">
              {onRemove && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 bg-white/95 px-2 text-xs shadow-sm"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => onRemove(index)}
                >
                  Remove
                </Button>
              )}
              {onReorder && index > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 bg-white/95 px-2 text-xs shadow-sm"
                  onClick={() => handleSetCover(index)}
                >
                  Set as Cover
                </Button>
              )}
            </div>
            <figcaption className="truncate px-2 py-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              {file.name}
            </figcaption>
          </figure>
          );
        })}
      </div>
    </div>
  );
}
