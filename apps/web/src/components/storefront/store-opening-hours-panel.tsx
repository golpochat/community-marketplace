'use client';

import type { StoreOpeningHours, StoreWeekday } from '@community-marketplace/types';
import { cn } from '@community-marketplace/ui';
import { Clock } from 'lucide-react';

const WEEKDAY_ORDER: StoreWeekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const WEEKDAY_LABELS: Record<StoreWeekday, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

function formatStoreTime(value?: string): string {
  if (!value) return '';
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return value;

  const hours = Number(match[1]);
  const minutes = match[2];
  const period = hours >= 12 ? 'PM' : 'AM';
  const normalized = hours % 12 === 0 ? 12 : hours % 12;
  return `${normalized}:${minutes} ${period}`;
}

function getCurrentWeekday(): StoreWeekday {
  const day = new Date()
    .toLocaleDateString('en-IE', { weekday: 'long' })
    .toLowerCase() as StoreWeekday;
  return WEEKDAY_ORDER.includes(day) ? day : 'monday';
}

function formatDayHours(day: StoreWeekday, hours?: { closed?: boolean; open?: string; close?: string }) {
  if (!hours || hours.closed) return 'Closed';
  if (hours.open && hours.close) {
    return `${formatStoreTime(hours.open)} – ${formatStoreTime(hours.close)}`;
  }
  return 'Hours not set';
}

interface StoreOpeningHoursPanelProps {
  openingHours?: StoreOpeningHours;
}

export function StoreOpeningHoursPanel({ openingHours }: StoreOpeningHoursPanelProps) {
  if (!openingHours?.schedule || Object.keys(openingHours.schedule).length === 0) {
    return null;
  }

  const today = getCurrentWeekday();
  const todayHours = openingHours.schedule[today];
  const todayLabel = formatDayHours(today, todayHours);

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-lg bg-brand-50/80 px-3 py-2.5">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-700">Open today</p>
          <p className="text-sm font-semibold text-foreground">{todayLabel}</p>
        </div>
      </div>

      <ul className="divide-y divide-border">
        {WEEKDAY_ORDER.map((day) => {
          const hours = openingHours.schedule[day];
          if (!hours) return null;
          const isToday = day === today;

          return (
            <li
              key={day}
              className={cn(
                'flex items-center justify-between gap-3 py-2 text-sm',
                isToday && 'font-medium text-foreground',
              )}
            >
              <span className={isToday ? 'text-foreground' : 'text-muted-foreground'}>{WEEKDAY_LABELS[day]}</span>
              <span className={isToday ? 'text-foreground' : 'text-foreground'}>
                {formatDayHours(day, hours)}
              </span>
            </li>
          );
        })}
      </ul>

      {openingHours.note ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{openingHours.note}</p>
      ) : null}
    </div>
  );
}
