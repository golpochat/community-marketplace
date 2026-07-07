export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ga', label: 'Irish (Gaeilge)' },
] as const;

export const TIMEZONE_OPTIONS = [
  { value: 'Europe/Dublin', label: 'Europe/Dublin (GMT/IST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET)' },
  { value: 'America/New_York', label: 'America/New York (ET)' },
  { value: 'America/Chicago', label: 'America/Chicago (CT)' },
  { value: 'America/Los_Angeles', label: 'America/Los Angeles (PT)' },
] as const;
