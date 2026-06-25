'use client';

import { useEffect, useState } from 'react';

import { cn } from '@community-marketplace/ui';
import { Button, Input, Label, Select } from '@community-marketplace/ui';
import type { ListingCondition } from '@community-marketplace/types';

const STEPS = ['Details', 'Pricing', 'Location', 'Photos', 'Review'];
const MAX_LISTING_IMAGES = 10;
const MAX_IMAGE_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export interface ListingFormData {
  title: string;
  description: string;
  price: string;
  condition: ListingCondition;
  categoryId: string;
  location: string;
  images: File[];
}

const INITIAL: ListingFormData = {
  title: '',
  description: '',
  price: '',
  condition: 'good',
  categoryId: '',
  location: '',
  images: [],
};

interface ListingFormProps {
  categories?: Array<{ id: string; name: string }>;
  initialData?: Partial<ListingFormData>;
  submitLabel?: string;
  onSubmit?: (data: ListingFormData) => void;
}

export function ListingForm({
  categories = [],
  initialData,
  submitLabel = 'Publish listing',
  onSubmit,
}: ListingFormProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ListingFormData>({ ...INITIAL, ...initialData });
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (categories.length > 0 && !data.categoryId) {
      setData((prev) => ({ ...prev, categoryId: categories[0]!.id }));
    }
  }, [categories, data.categoryId]);

  function update(patch: Partial<ListingFormData>) {
    setData((prev) => ({ ...prev, ...patch }));
    setValidationError(null);
  }

  function validateCurrentStep(): string | null {
    if (step === 0) {
      if (data.title.trim().length < 3) return 'Title must be at least 3 characters.';
      if (data.description.trim().length < 10) return 'Description must be at least 10 characters.';
    }
    if (step === 1) {
      if (!data.price || Number(data.price) < 0) return 'Enter a valid price.';
      if (!data.categoryId && categories.length > 0) return 'Select a category.';
    }
    if (step === 2) {
      if (!data.location.trim()) return 'Enter a location label.';
    }
    if (step === 3 && validationError) return validationError;
    return null;
  }

  function handleNext() {
    const error = validateCurrentStep();
    if (error) {
      setValidationError(error);
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
    else onSubmit?.(data);
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  function handleImagesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (selected.length > MAX_LISTING_IMAGES) {
      setValidationError(
        `You selected ${selected.length} images. The maximum is ${MAX_LISTING_IMAGES} — please choose up to ${MAX_LISTING_IMAGES} files.`,
      );
      return;
    }

    const invalidTypeCount = selected.filter((file) => !ALLOWED_IMAGE_TYPES.has(file.type)).length;
    const oversized = selected.filter(
      (file) => ALLOWED_IMAGE_TYPES.has(file.type) && file.size > MAX_IMAGE_FILE_BYTES,
    );
    const accepted = selected.filter(
      (file) => ALLOWED_IMAGE_TYPES.has(file.type) && file.size <= MAX_IMAGE_FILE_BYTES,
    );

    const messages: string[] = [];
    if (invalidTypeCount > 0) {
      messages.push(
        `${invalidTypeCount} file(s) were skipped — only JPEG, PNG, or WebP are allowed.`,
      );
    }
    if (oversized.length > 0) {
      messages.push(
        `${oversized.length} file(s) exceed the 5 MB limit: ${oversized.map((file) => file.name).join(', ')}.`,
      );
    }

    setData((prev) => ({ ...prev, images: accepted }));
    setValidationError(messages.length > 0 ? messages.join(' ') : null);
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {STEPS.map((label, idx) => (
          <div
            key={label}
            className={cn(
              'rounded-lg px-2 py-2 text-center text-xs font-medium sm:text-sm',
              idx === step
                ? 'bg-[hsl(var(--dashboard-accent))] text-white'
                : 'bg-[hsl(var(--dashboard-sidebar-active))] text-[hsl(var(--dashboard-sidebar-muted))]',
            )}
          >
            {label}
          </div>
        ))}
      </div>

      {validationError && (
        <p className="mb-4 text-sm text-red-600">{validationError}</p>
      )}

      {step === 0 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={data.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="What are you selling?"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={data.description}
              onChange={(e) => update({ description: e.target.value })}
              rows={5}
              className="mt-1 w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-white px-3 py-2 text-sm text-[hsl(var(--dashboard-main-fg))] focus:border-[hsl(var(--dashboard-accent))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--dashboard-accent))]"
              placeholder="Describe your item (min. 10 characters)..."
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="price">Price (EUR)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={data.price}
              onChange={(e) => update({ price: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="condition">Condition</Label>
            <Select
              id="condition"
              value={data.condition}
              onChange={(e) => update({ condition: e.target.value as ListingCondition })}
            >
              <option value="new">New</option>
              <option value="like_new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </Select>
          </div>
          {categories.length > 0 && (
            <div>
              <Label htmlFor="categoryId">Category</Label>
              <Select
                id="categoryId"
                value={data.categoryId}
                onChange={(e) => update({ categoryId: e.target.value })}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={data.location}
              onChange={(e) => update({ location: e.target.value })}
              placeholder="City or area (e.g. Dublin)"
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="images">Photos (optional)</Label>
            <input
              id="images"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImagesChange}
              className="mt-1 block w-full text-sm text-[hsl(var(--dashboard-main-fg))]"
            />
            <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              Up to {MAX_LISTING_IMAGES} images. JPEG, PNG, or WebP. Max 5 MB each.
            </p>
          </div>
          {data.images.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                {data.images.length} of {MAX_LISTING_IMAGES} images selected
              </p>
              <ul className="space-y-1 text-sm text-[hsl(var(--dashboard-main-fg))]">
                {data.images.map((file) => (
                  <li key={`${file.name}-${file.size}`}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-sidebar-active)/0.35)] p-4 text-sm text-[hsl(var(--dashboard-main-fg))]">
          <p>
            <span className="font-medium">Title:</span> {data.title || '—'}
          </p>
          <p>
            <span className="font-medium">Price:</span> €{data.price || '0'}
          </p>
          <p>
            <span className="font-medium">Condition:</span> {data.condition}
          </p>
          <p>
            <span className="font-medium">Location:</span> {data.location || '—'}
          </p>
          <p>
            <span className="font-medium">Photos:</span> {data.images.length} selected
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button variant="outline" onClick={handleBack} disabled={step === 0} className="w-full sm:w-auto">
          Back
        </Button>
        <Button onClick={handleNext} className="w-full sm:w-auto">
          {step === STEPS.length - 1 ? submitLabel : 'Next'}
        </Button>
      </div>
    </div>
  );
}
