'use client';

import { useState } from 'react';

import { cn } from '@community-marketplace/ui';
import { Button, Input, Label, Select } from '@community-marketplace/ui';
import type { ListingCondition } from '@community-marketplace/types';

const STEPS = ['Details', 'Pricing', 'Location', 'Review'];

interface ListingFormData {
  title: string;
  description: string;
  price: string;
  condition: ListingCondition;
  categoryId: string;
  location: string;
}

const INITIAL: ListingFormData = {
  title: '',
  description: '',
  price: '',
  condition: 'good',
  categoryId: '',
  location: '',
};

interface ListingFormProps {
  onSubmit?: (data: ListingFormData) => void;
}

export function ListingForm({ onSubmit }: ListingFormProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ListingFormData>(INITIAL);

  function update(patch: Partial<ListingFormData>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  function handleNext() {
    if (step < STEPS.length - 1) setStep(step + 1);
    else onSubmit?.(data);
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
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
              placeholder="Describe your item..."
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
              placeholder="City or area"
            />
          </div>
        </div>
      )}

      {step === 3 && (
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
        </div>
      )}

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button variant="outline" onClick={handleBack} disabled={step === 0} className="w-full sm:w-auto">
          Back
        </Button>
        <Button onClick={handleNext} className="w-full sm:w-auto">
          {step === STEPS.length - 1 ? 'Publish listing' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
