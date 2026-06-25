import type { Config } from 'tailwindcss';
import uiConfig from '../../packages/ui/tailwind.config';

const config: Config = {
  presets: [uiConfig],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui-dashboard/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'hsl(var(--brand-primary) / <alpha-value>)',
          secondary: 'hsl(var(--brand-secondary) / <alpha-value>)',
          accent: 'hsl(var(--brand-accent) / <alpha-value>)',
          neutral: 'hsl(var(--brand-neutral) / <alpha-value>)',
        },
      },
      borderRadius: {
        'brand-sm': 'var(--brand-radius-sm)',
        'brand-md': 'var(--brand-radius-md)',
      },
      boxShadow: {
        'brand-sm': 'var(--brand-shadow-sm)',
        'brand-md': 'var(--brand-shadow-md)',
        'brand-lg': 'var(--brand-shadow-lg)',
      },
    },
  },
};

export default config;
