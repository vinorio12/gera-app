import type { Config } from 'tailwindcss';
import geraPreset from '@gera/design-system/tailwind-preset';

export default {
  presets: [geraPreset],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
} satisfies Config;
